// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

contract SimpleStorage {
  address public deployer = address(0);

  struct Deposit {
    uint256 amount;
    uint256 totalDeposits;
    uint256 totalWithdraws;
  }

  mapping(address => Deposit) public listDeposits;
  event DepositEvent(address indexed user, uint256 indexed amount);
  event WithdrawEvent(address indexed user, uint256 indexed amount);

  constructor() {
    deployer = msg.sender;
  }

  receive() external payable {}
  fallback() external payable {}

  modifier onlyOwner() {
    require(deployer == msg.sender, "SimpleStorage: Unauthorized permission");
    _;
  }

  function changeDeployer(address _deployer) public onlyOwner {
    deployer = _deployer;
  }

  function depositEth(uint256 _amount) public payable {
    require(msg.value > 0, "SimpleStorage: Cannot be zero");
    (bool sent,) = payable(address(this)).call{value: _amount}("");
    require(sent, "SimpleStorage: Failed to transfer");

    Deposit storage deposit = listDeposits[msg.sender];
    deposit.amount += _amount;
    deposit.totalDeposits += 1;

    emit DepositEvent(msg.sender, _amount);
  }

  function withdrawEth(uint256 _amount) public payable {
    Deposit storage deposit = listDeposits[msg.sender];
    require(_amount > 0 && _amount <= deposit.amount, "SimpleStorage: Invalid withdraw amount");

    (bool sent,) = payable(msg.sender).call{value: _amount}("");
    require(sent, "SimpleStorage: Failed to transfer");

    deposit.amount -= _amount;
    deposit.totalWithdraws += 1;

    emit WithdrawEvent(msg.sender, _amount);
  }
}
