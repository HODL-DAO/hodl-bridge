// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.3;

import 'hardhat/console.sol';

import '@openzeppelin/contracts/utils/Context.sol';
import '@openzeppelin/contracts/access/AccessControlEnumerable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';

contract CheapToken is Context, AccessControlEnumerable, ERC20, ERC20Burnable {
    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');

    /**
     * @dev Grants 'DEFAULT_ADMIN_ROLE' and 'MINTER_ROLE' to the
     * account that deploys the contract.
     * 
     * See {ERC20-constructors}
     */
    constructor() ERC20('Cheap Token', 'CHP') {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
    }

    /**
     * @dev Creates 'amount' new tokens for 'to'.
     * 
     * See {ERC20-_mint}
     * 
     * Requirements:
     * - the caller must have the 'MINTER_ROLE'.
     */
    function mint(address to, uint256 amount) public virtual {
        require(hasRole(MINTER_ROLE, _msgSender()), 'ERC20: must have minter role to mint');
        _mint(to, amount);
    }
}