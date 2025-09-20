// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {CoinFlip} from "../src/CoinFlip.sol";

contract CounterTest is Test {
    CoinFlip public coinFlip;

    function setUp() public {
        coinFlip = new CoinFlip();
    }

    function test_ClaimReward() public {
        coinFlip.claimReward(address(this));
    }
}
