const { expect } = require("chai");

describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, BlockMusic!");
    
    expect(await greeter.greet()).to.equal("Hello, BlockMusic!");
    
    const setGreetingTx = await greeter.setGreeting("Hola, BlockMusic!");
    await setGreetingTx.wait();
    
    expect(await greeter.greet()).to.equal("Hola, BlockMusic!");
  });
});
