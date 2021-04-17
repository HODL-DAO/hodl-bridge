const { expect } = require('chai');

describe('Token.sol', () => {
    let Token, token, admin, addr1, addr2;

    beforeEach(async () => {
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

    describe('transactions', () => {
        it('token transfer', async () => {
            await token.mint(admin.address, 50);

            await token.transfer(addr1.address, 50);
            const addr1Balance = await token.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(50);

            await token.connect(addr1).transfer(addr2.address, 50);
            const addr2Balance = await token.balanceOf(addr2.address);
            expect(addr2Balance).to.equal(50);
        });

        it('revert when send more than balance', async () => {
            const initialAdminBalance = await token.balanceOf(admin.address);

            await expect(token.connect(addr1).transfer(admin.address, 1)).to.be.revertedWith('ERC20: transfer amount exceeds balance');
            expect(await token.balanceOf(admin.address)).to.equal(initialAdminBalance);
        });

        it('update balances after transfer', async () => {
            await token.mint(admin.address, 200);

            const initialAdminBalance = await token.balanceOf(admin.address);
            await token.transfer(addr1.address, 100);
            await token.transfer(addr2.address, 50);

            const finalAdminBalance = await token.balanceOf(admin.address);
            expect(finalAdminBalance).to.equal(initialAdminBalance - 150);

            const addr1Balance = await token.balanceOf(addr1. address);
            expect(addr1Balance).to.equal(100);
            
            const addr2Balance = await token.balanceOf(addr2. address);
            expect(addr2Balance).to.equal(50);
        });
    });

    describe('mint and burn', () => {
        it('mint tokens with minter role changes balance', async () => {
            await token.mint(admin.address, 100);
            const adminBalance = await token.balanceOf(admin.address);
            expect(adminBalance).to.equal(100);
        });

        it('revert when mint tokens without minter role', async () => {
            await expect(token.connect(addr1).mint(addr1.address, 100)).to.be.revertedWith('ERC20: must have minter role to mint');
        });

        it('burn tokens changes totalSupply and balance', async () => {
            await token.mint(admin.address, 100);
            
            const initialAdminBalance = await token.balanceOf(admin.address);
            const initialTotalSupply = await token.totalSupply();

            await token.burn(50);
            const finalAdminBalance = await token.balanceOf(admin.address);
            const finalTotalSupply = await token.totalSupply();

            expect(initialAdminBalance - 50 === finalAdminBalance && initialTotalSupply - 50 === finalTotalSupply);
        });

        it('revert when burn more than balance', async () => {
            await expect(token.connect(addr1).burn(50)).to.be.revertedWith('ERC20: burn amount exceeds balance');
        });

        it('revert when burn negative value', async () => {
            await expect(token.connect(addr1).burn(-50)).to.be.reverted;
        });
    });
});