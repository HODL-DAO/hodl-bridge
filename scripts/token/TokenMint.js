let tokenAddress = '0xABDB114C75E4F861DcBC4b5F881484a939D15241';

async function main() {
    const[ deployer ] = await ethers.getSigners();
    console.log(`deploying contract with account: ${deployer.address}`);

    const balance = await deployer.getBalance();
    console.log(`account balance: ${balance.toString()}`);

    const Token = await ethers.getContractAt("CheapToken", tokenAddress);
    await Token.mint(deployer.address, '100000000000000000000');

    console.log('minted');
}

main().then(() => {
    process.exit(0)
}).catch(error => {
    console.log(error);
    process.exit(1);
});