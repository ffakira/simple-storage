const SimpleStorage = artifacts.require("SimpleStorage");
const truffleAssert = require("truffle-assertions");
const web3 = require("web3");

contract("SimpleStorage", ([deployer, ...accounts]) => {
  beforeEach(async () => {
    this.contractInstance = await SimpleStorage.new();
  });

  it("should receive 0 address", async() => {
    const getDeployer = await this.contractInstance.deployer.call();
    expect(getDeployer).to.equal(deployer);
  });

  it("should change the deployer value", async() => {
    await this.contractInstance.changeDeployer(deployer, {from: deployer});
    
    const getDeployer = await this.contractInstance.deployer.call();
    expect(getDeployer).to.equal(deployer);
  });

  it("should fail to change the deployer", async() => {
    await this.contractInstance.changeDeployer(accounts[1], {from: deployer});

    await truffleAssert.fails(
      this.contractInstance.changeDeployer(accounts[1], {from: deployer}),
      truffleAssert.ErrorType.REVERT,
      "SimpleStorage: Unauthorized permission"
    );
  });

  it("should deposit eth", async() => {
    const deposit = web3.utils.toBN(web3.utils.toWei("0.1", "ether"));
    const tx = await this.contractInstance.depositEth(
      deposit, {from: deployer, value: deposit}
    );

    truffleAssert.eventEmitted(tx, 'DepositEvent', event => {
      return (
        deployer === event["user"] &&
        web3.utils.toBN(deposit).eq(event["amount"])
      );
    });

    const totalDeposits = await this.contractInstance.listDeposits.call(deployer);
    expect(1).to.deep.equal(+totalDeposits["totalDeposits"].toString());
  });

  it("should fail to deposit eth", async() => {
    const deposit = web3.utils.toBN(web3.utils.toWei("1001", "ether"));
    
    await truffleAssert.fails(
      this.contractInstance.depositEth(deposit, {from: deployer, value: deposit}),
      "Returned error: insufficient funds for gas * price + value"
    );
  });

  it("should fail to withdraw eth", async() => {
    const withdraw = web3.utils.toBN("0");

    await truffleAssert.fails(
      this.contractInstance.withdrawEth(withdraw, {from: deployer, value: withdraw}),
      "SimpleStorage: Invalid withdraw amount"
    );
  });

  it("should fail and overflow uint256 when withdraw eth", async() => {
    const withdraw = web3.utils.toBN("1");

    await truffleAssert.fails(
      this.contractInstance.withdrawEth(withdraw, {from: deployer}),
      truffleAssert.ErrorType.REVERT,
      "SimpleStorage: Invalid withdraw amount"
    );
  });

  it("should withdraw 0.5 eth", async() => {
    const deposit = web3.utils.toBN(web3.utils.toWei("1", "ether"));
    await this.contractInstance.depositEth(deposit, {from: deployer, value: deposit});

    let listDeposits = await this.contractInstance.listDeposits.call(deployer);
    expect(true).to.deep.equal(listDeposits["totalDeposits"].eq(web3.utils.toBN("1")));

    const withdraw = web3.utils.toBN(web3.utils.toWei("0.6", "ether"));
    
    await this.contractInstance.withdrawEth(withdraw, {from: deployer});
    listDeposits = await this.contractInstance.listDeposits.call(deployer);
    expect(true).to.deep.equal(web3.utils.toBN(
      web3.utils.toWei("0.4", "ether")).eq(web3.utils.toBN(listDeposits["amount"])
    ));
  });
});
