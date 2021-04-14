// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0;
pragma experimental ABIEncoderV2;

import "./Bridge.sol";
import "hardhat/console.sol";
import "./lib/Lib_RLPReader.sol";
import "./lib/Lib_RLPWriter.sol";
import "./lib/Lib_MerkleTrie.sol";

/**
 * @title BridgeSale
 * @dev The BridgeSale uses the state from a Bridge to validate send transactions on the bridged chain.
 */
contract BridgeSale {
  Bridge immutable bridge;
  address immutable depositOnL1;
  uint16 immutable chainIdOnL1;
  uint8 constant BLOCK_DEPTH_REQUIRED = 5;

  // prevent double spend with the same tx
  mapping (bytes32 => bool) private seenTransactions;

  constructor(Bridge input_bridge, address dep, uint16 chainId) public {
    bridge = input_bridge;
    depositOnL1 = dep;
    chainIdOnL1 = chainId;
  }

  receive() external payable {
    // thanks for the coin
  }

  function decodeBlockData(bytes memory rlpHeader) internal pure returns (bytes32, uint) {
    Lib_RLPReader.RLPItem[] memory nodes = Lib_RLPReader.readList(rlpHeader);

    bytes32 transactionsRoot = Lib_RLPReader.readBytes32(nodes[4]);
    uint blockNumber = Lib_RLPReader.readUint256(nodes[8]);

    return (transactionsRoot, blockNumber);
  }

  struct Transaction {
    uint256 nonce;
    uint256 gasPrice;
    uint256 gasLimit;
    address to;
    uint256 value;
    bytes data;
    uint256 v;
    bytes32 r;
    bytes32 s;
  }

  function decodeTransactionData(bytes memory rlpHeader) internal view returns (address, address, uint) {
    Lib_RLPReader.RLPItem[] memory nodes = Lib_RLPReader.readList(rlpHeader);

    Transaction memory txx = Transaction({
      nonce: Lib_RLPReader.readUint256(nodes[0]),
      gasPrice: Lib_RLPReader.readUint256(nodes[1]),
      gasLimit: Lib_RLPReader.readUint256(nodes[2]),
      to: Lib_RLPReader.readAddress(nodes[3]),
      value: Lib_RLPReader.readUint256(nodes[4]),
      data: Lib_RLPReader.readBytes(nodes[5]),
      v: Lib_RLPReader.readUint256(nodes[6]),
      r: Lib_RLPReader.readBytes32(nodes[7]),
      s: Lib_RLPReader.readBytes32(nodes[8])
    });

    bytes[] memory raw = new bytes[](9);
    raw[0] = Lib_RLPWriter.writeUint(txx.nonce);
    raw[1] = Lib_RLPWriter.writeUint(txx.gasPrice);
    raw[2] = Lib_RLPWriter.writeUint(txx.gasLimit);
    if (txx.to == address(0)) {
      raw[3] = Lib_RLPWriter.writeBytes('');
    } else {
      raw[3] = Lib_RLPWriter.writeAddress(txx.to);
    }
    raw[4] = Lib_RLPWriter.writeUint(txx.value);
    raw[5] = Lib_RLPWriter.writeBytes(txx.data);
    raw[6] = Lib_RLPWriter.writeUint(chainIdOnL1);
    raw[7] = Lib_RLPWriter.writeBytes(bytes(''));
    raw[8] = Lib_RLPWriter.writeBytes(bytes(''));
    bytes32 hash = keccak256(Lib_RLPWriter.writeList(raw));

    address from = ecrecover(hash, uint8(txx.v - chainIdOnL1 * 2 - 8), txx.r, txx.s);
    require(from != address(0x0), "signature verification failed");
    return (from, txx.to, txx.value);
  }

  function isTransactionClaimed(bytes32 hash) public view returns (bool) {
    return seenTransactions[hash];
  }

  function redeemDeposit(bytes memory rlpBlockHeader, bytes memory rlpTransaction, address payable inputFrom, bytes memory key, bytes memory proof) public {
    bytes32 blockHash = keccak256(rlpBlockHeader);
    bytes32 transactionHash = keccak256(rlpTransaction);
    require(!seenTransactions[transactionHash], "already paid out transaction");
    seenTransactions[transactionHash] = true;

    bytes32 transactionsRoot;
    uint blockNumber;
    (transactionsRoot, blockNumber) = decodeBlockData(rlpBlockHeader);

    // confirm block is deep enough in blockchain on bridge
    bytes32 hash;
    uint24 depth;
    (hash, depth) = bridge.getBlockByNumber(blockNumber);
    require(hash == blockHash, "block hash didn't match block for number");
    require(depth >= BLOCK_DEPTH_REQUIRED, "block not deep enough in chain");

    // parse and validate the transaction (do we have to? it's in the block)
    // yes, we have to validate to recover the from address
    address from;
    address to;
    uint value;
    (from, to, value) = decodeTransactionData(rlpTransaction);
    require(from == inputFrom, "wrong from address");
    require(to == depositOnL1, "wrong to address");

    // confirm transaction is in block
    bool ret = Lib_MerkleTrie.verifyInclusionProof(key, rlpTransaction, proof, transactionsRoot);
    require(ret, "transaction is in block");

    // transfer value (with ratio) of coins to from address
    inputFrom.transfer(value/100);
  }
}

