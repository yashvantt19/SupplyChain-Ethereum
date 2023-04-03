const MyERC20Token = artifacts.require("MyERC20Token");
const SupplyChain = artifacts.require("SupplyChain");

module.exports = async function (deployer) {
  // Deploy the MyERC20Token contract with the initial supply
  await deployer.deploy(MyERC20Token, "1000000000000000000000000"); // 1,000,000 tokens with 18 decimals
  const myERC20TokenInstance = await MyERC20Token.deployed();

  // Deploy the RentHouse contract with the MyERC20Token contract address
  await deployer.deploy(SupplyChain, myERC20TokenInstance.address);
};
