async function main() {
    const[ deployer ] = await ethers.getSigners();
    console.log(`deploying contract with account: ${deployer.address}`);

    const balance = await deployer.getBalance();
    console.log(`account balance: ${balance.toString()}`);

    const Token = await ethers.getContractFactory('CheapToken');
    const token = await Token.deploy();
    console.log(`token address: ${token.address}`);
}

main().then(() => {
    process.exit(0)
}).catch(error => {
    console.log(error);
    process.exit(1);
});