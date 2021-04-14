var express = require('express');
let sleep = require('util').promisify(setTimeout);

var rlp = require('rlp');
var Web3 = require('web3');
var dw3 = new Web3("https://rpc.deveth.org/");

const lib = require("../scripts/lib");
 
const mpt = require('merkle-patricia-tree');
const Trie = mpt.BaseTrie;

// TXID=0x854d68f9fb192ae55028dde6e4c4bbae453f9d8ca589a4fc8721e70c7c6ae7e5 BRIDGESALE=0x610510c0D13Adf82FF4e2C67a38698a080FefaD7 BRIDGE=0x8168a8c43F1943EcC812ef1b8dE19a897c16488e npx hardhat run scripts/bridgesale.js --network cheapeth

// TXID= BRIDGESALE=0x8b227F1a97dCC22Ad27Ade8b7b1bD2e285a9F379 BRIDGE=0x819144cF88b516bE19A05A561Ad794B1Fec83910 npx hardhat run scripts/bridgesale.js --network cheapeth

const bridgeAddress = process.env['BRIDGE'];
const tokenAddress = "0x45D26Bc2229C94AEBBD9d16422f02924a77E6807";
console.log("Using bridge at address", bridgeAddress);

// SALE 0x781B1E3d3081E37405eF706790AB95AccBe28644

// 0x7646d704699120cb918dd31677dd55facbc874071264f62ba630c7e3c6085423
var txId = process.env['TXID'];
const DOOBIE = "0xDEAD71b317d4c4a03C5f9F5740eAe19E8eB3702e";

var bridgeSaleAddress = process.env['BRIDGESALE'];
var Bridge, BridgeSale;

var claimedAll = {};

async function claimTransaction(txId) {
  if (claimedAll[txId] === true) {
    console.log("has claimed");
    return false;
  }

  const txn = await dw3.eth.getTransaction(txId);
  console.log("CLAIMING", txId, "FROM", txn.from);
  
  const claimed = await BridgeSale.isTransactionClaimed(txId);
  if (claimed) {
    claimedAll[txId] = true;
    console.log("already claimed in contract");
    return false;
  }

  const bridgeHash = await Bridge.getLongestChainEndpoint();
  const bridgeBlock = (await Bridge.getHeader(bridgeHash))[1];


  if (txn.blockNumber + 5 > bridgeBlock) {
    console.log("too early");
    return false;
  }

  console.log(txn);

  const block = await dw3.eth.getBlock(txn.blockNumber)
  const txtrie = await lib.getTransactionTrie(dw3, txn.blockNumber, txId);
  const proof = await Trie.createProof(txtrie.trie, txtrie.key);

  const ret = await BridgeSale.redeemDeposit(lib.getBlockRlp(block), lib.getTransactionRlp(txn), txn['from'], txtrie.key, rlp.encode(proof));
  console.log(ret);
  claimedAll[txId] = true;
  return true;
}

async function main() {
  if (bridgeSaleAddress == null) {
    const [deployer] = await ethers.getSigners();
    const BridgeSaleFactory = await ethers.getContractFactory("WrapDTH");
    BridgeSale = await BridgeSaleFactory.deploy(bridgeAddress, tokenAddress, DOOBIE, 787);
    bridgeSaleAddress = BridgeSale.address;
    await deployer.sendTransaction({to: BridgeSale.address, value: ethers.utils.parseUnits("0.01", 18)});
  } else {
    BridgeSale = await ethers.getContractAt("WrapDTH", bridgeSaleAddress)
    }

  console.log("BridgeSale deployed at", bridgeSaleAddress);
  Bridge = await ethers.getContractAt("Bridge", bridgeAddress);

  var back = 30;
  while (1) {
    // 0xbac9c83bef36b8740b4543ed48825a3900a11abf9e77a88e4dd1402d84e0bdaf
    //if(txId) claimTransaction(txId);

    const longestCommitedChainHash = await Bridge.getLongestChainEndpoint();
    var hdr = await Bridge.getHeader(longestCommitedChainHash);
    var blockNumber = hdr['blockNumber'].toNumber();
    console.log("getting previous blocks: ", blockNumber-back, blockNumber-5);
    for (var i = blockNumber-back; i < blockNumber-5; i++) {
      const block = await dw3.eth.getBlock(i);
      block.transactions.forEach(async function(tx) {
        const txn = await dw3.eth.getTransaction(tx);
        if (txn.to == DOOBIE) {
          console.log("transaction is to sale address");
          claimTransaction(txn.hash);
        }
      });
    }

    back = 15;
    await sleep(5000);
  }
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

