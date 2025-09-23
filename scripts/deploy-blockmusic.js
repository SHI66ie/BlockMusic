const hre = require("hardhat");

async function main() {
  const BlockMusic = await hre.ethers.getContractFactory('BlockMusic');
  const blockMusic = await BlockMusic.deploy();
  await blockMusic.deployed();
  console.log('BlockMusic deployed to:', blockMusic.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
