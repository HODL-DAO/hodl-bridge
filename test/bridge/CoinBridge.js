const { expect } = require('chai');

var Web3 = require('web3');
var w3 = new Web3("https://rpc.deveth.org/");

async function do_add_block(Bridge, bn) {
    add_block = await w3.eth.getBlock(bn);
    var add_block_rlp = lib.getBlockRlp(add_block);
    const ret = await Bridge.submitHeader(add_block_rlp);
    expect(await Bridge.isHeaderStored(add_block['hash'])).to.equal(true);
}

describe('L2_CoinBridge.sol', () => {
    let Bridge, Token, token, admin, addr1, addr2;

    beforeEach(async () => {
        Bridge = await ethers.getContractFactory("Bridge");

        Token = await ethers.getContractFactory('CheapToken');
        token = await Token.deploy();
        [admin, addr1, addr2, _] = await ethers.getSigners();
    });

    describe('deployment', () => {
        it('assigns admin role to deployer', async () => {
            expect(await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), admin.address));
        });

        it('assigns minter role to deployer', async () => {
            expect(await token.hasRole(await token.MINTER_ROLE(), admin.address));
        });
    });

});