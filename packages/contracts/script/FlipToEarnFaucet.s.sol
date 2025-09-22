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
        uint256 dailyClaimsLimit = 10; // 10 claims per day
        uint256 dropAmount = 0.0000023 ether;
        uint256 signatureExpiration = 1 hours; // 1 hour signature expiration

        address[] memory authorizedRelayers = new address[](1);
        authorizedRelayers[0] = signingKey;

        faucet = new FlipToEarnFaucet(
            authorizedRelayers,
            minFlipsRequired,
            dailyClaimsLimit,
            dropAmount,
            signatureExpiration
        );

        console.log("FlipToEarnFaucet deployed to:", address(faucet));
        console.log("Signing key:", signingKey);
        console.log("Min flips required:", minFlipsRequired);
        console.log("Daily claims limit:", dailyClaimsLimit);
        console.log("Drop amount:", dropAmount);
        console.log("Signature expiration:", signatureExpiration);

        uint256 fundingAmount = 0.0045 ether;
        faucet.fund{value: fundingAmount}();

        console.log("Contract funded with:", fundingAmount);
        console.log("Contract balance after funding:", address(faucet).balance);

        vm.stopBroadcast();
    }
}