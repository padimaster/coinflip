// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {FlipToEarnFaucet} from "../src/FlipToEarnFaucet.sol";

contract FlipToEarnFaucetScript is Script {
    FlipToEarnFaucet public faucet;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying FlipToEarnFaucet with the account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Constructor parameters for FlipToEarnFaucet
        address signingKey = deployer; // Using deployer as signing key for now
        uint256 minFlipsRequired = 5; // Minimum 5 flips required
        uint256 dailyClaimsLimit = 100; // 100 claims per day
        uint256 dropAmount = 0.001 ether; // 0.001 ETH per claim
        uint256 cooldownPeriod = 24 hours; // 24 hour cooldown
        uint256 signatureExpiration = 1 hours; // 1 hour signature expiration

        faucet = new FlipToEarnFaucet(
            signingKey,
            minFlipsRequired,
            dailyClaimsLimit,
            dropAmount,
            cooldownPeriod,
            signatureExpiration
        );
        
        console.log("FlipToEarnFaucet deployed to:", address(faucet));
        console.log("Signing key:", signingKey);
        console.log("Min flips required:", minFlipsRequired);
        console.log("Daily claims limit:", dailyClaimsLimit);
        console.log("Drop amount:", dropAmount);
        console.log("Cooldown period:", cooldownPeriod);
        console.log("Signature expiration:", signatureExpiration);

        // Fund the contract with 1000 ETH using the fund() method
        uint256 fundingAmount = 1 ether;
        faucet.fund{value: fundingAmount}();
        
        console.log("Contract funded with:", fundingAmount);
        console.log("Contract balance after funding:", address(faucet).balance);

        // Transfer funds to the specified address
        address targetAddress = 0xBD7496d6bB2E466cCF6f6789A50A75e4Aa4356B5;
        uint256 transferAmount = 1 ether;
        payable(targetAddress).transfer(transferAmount);
        
        console.log("Transferred to address:", targetAddress);
        console.log("Transfer amount:", transferAmount);
        console.log("Target address balance:", targetAddress.balance);

        vm.stopBroadcast();
    }
}
