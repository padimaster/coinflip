// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract CoinFlip {
    address public owner;
    bool public paused;
    uint256 public constant REWARD_AMOUNT = 0.00001 ether;

    constructor() {
        owner = msg.sender;
    }

    function claimReward(address to) public {
        require(!paused, "Contract is paused");
        require(
            address(this).balance >= REWARD_AMOUNT,
            "Insufficient funds in the contract"
        );

        payable(to).transfer(REWARD_AMOUNT);
    }

    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");

        payable(msg.sender).transfer(address(this).balance);
    }

    function pause() public {
        require(msg.sender == owner, "Only owner can pause");

        paused = true;
    }

    function unpause() public {
        require(msg.sender == owner, "Only owner can unpause");

        paused = false;
    }

    function fund() public payable {
        require(msg.sender == owner, "Only owner can fund");

        require(msg.value > 0, "Amount must be greater than 0");
    }
}
