const { expect } = require('chai');

let Web3 = require('web3');
let w3 = new Web3("https://rpc.deveth.org/");
let bombDelayFromParent = 900000000;

const startBlock = 11982090;

async function do_add_block(Bridge, bn) {
    add_block = await w3.eth.getBlock(bn);
    var add_block_rlp = lib.getBlockRlp(add_block);
    const ret = await Bridge.submitHeader(add_block_rlp);
    expect(await Bridge.isHeaderStored(add_block['hash'])).to.equal(true);
}

describe('L2_CoinBridge.sol', () => {
    let Bridge, Token, CoinBridge, owner, addr1, addr2;

    beforeEach(async () => {
        const BridgeFactory = await ethers.getContractFactory("Bridge");
        const genesis_block = await w3.eth.getBlock(startBlock);

        Bridge = await BridgeFactory.deploy(lib.getBlockRlp(genesis_block), bombDelayFromParent);
        expect(await Bridge.isHeaderStored(genesis_block['hash'])).to.equal(true);

        const TokenFactory = await ethers.getContractFactory("Token");
        Token = await TokenFactory.deploy();
        
        var hdrs = [];
        for (var i = 1; i < 16; i++) {
            add_block = await w3.eth.getBlock(startBlock+i);
            var add_block_rlp = lib.getBlockRlp(add_block);
            hdrs.push(add_block_rlp);
        }
        await Bridge.submitHeaders(hdrs);

        [owner, addr1, addr2, _] = await ethers.getSigners();
    });

    it('deployment', () => {
        it('assigns admin role to deployer', async () => {
            expect(await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), owner.address));
        });

        it('assigns minter role to deployer', async () => {
            expect(await token.hasRole(await token.MINTER_ROLE(), owner.address));
        });
    });

    it('coin bridge', async () => {
        const CoinBridgeFactory = await ethers.getContractFactory("L2_CoinBridge");
        CoinBridge = await CoinBridgeFactory.deploy(Bridge.address, Token.address, "0xd000000000000000000000000000000000000b1e", 787);

        await owner.sendTransaction({ to: BridgeSale.address, value: ethers.utils.parseUnits("1.0", 18) });
        const coinBridgeBalance = await provider.getBalance(BridgeSale.address);

        const txtrie = await lib.getTransactionTrie(w3, saleBlock, saleTxid);
        const proof = await Trie.createProof(txtrie.trie, txtrie.key);

        // submit the transaction to claim
        txn = await w3.eth.getTransaction(saleTxid);

        console.log(txn);

        /*const startBalance = await provider.getBalance(saleFrom);
        expect(startBalance).to.equal(0);
        await BridgeSale.redeemDeposit(lib.getBlockRlp(saleBlockData), lib.getTransactionRlp(txn), txn['from'], txtrie.key, rlp.encode(proof));
        const endBalance = await provider.getBalance(saleFrom);*/

        // 0.01 on deveth = 0.0001 on cheapEth 
        //expect(endBalance).to.equal(ethers.utils.parseUnits("0.0001", 18));
    });

});