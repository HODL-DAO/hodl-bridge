/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('@nomiclabs/hardhat-waffle');

const fs = require('fs');
const home = require('os').homedir();
const keyfile = require('path').join(home, '.ethkey');
const ethkey = fs.readFileSync(keyfile, { encoding: 'utf8' });

const CHEAPETH_RPC = 'https://rpc.cheapeth.org/rpc';
const DEVETH_RPC = 'https://rpc.deveth.org';

module.exports = {
	solidity: {
		compilers: [
			{
				version: "0.6.12",
				settings: { optimizer: { enabled: true, runs: 200 } }
			},
			{
				version: "0.8.3",
				settings: { optimizer: { enabled: true, runs: 200 } }
			}
		],
	},
	networks: {
		cheapeth: {
			url: CHEAPETH_RPC,
			accounts: [ethkey],
			gasPrice: 1000000000
		},
		deveth: {
			url: DEVETH_RPC,
			accounts: [ethkey],
			gasPrice: 1000000000
		}
	},
	paths: {
		sources: './contracts',
		tests: './test'
	}
};
