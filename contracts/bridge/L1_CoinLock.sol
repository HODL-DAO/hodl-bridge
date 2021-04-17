// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title L1_CoinLock
 * @dev transferring coins into the L1_CoinLock contract allows the user to provide a valid transaction
 *      to the L2_CoinBridge to mint a wrapped version of the coin on another (L2) chain
 *      coins are unlocked when this contract is provided and can validate a proof that the wrapped token
 *      has been burned on the other (L2) chain
 */
contract L1_CoinLock {
    mapping (address => uint256) private _balances;

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function withdraw() public {
        // provide proof of burn on L2 to withdraw from L1 locking contract
    }

    receive() external payable {
        _balances[msg.sender] += msg.value;
    }
}