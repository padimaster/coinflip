// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {FlipToEarnFaucet} from "../src/FlipToEarnFaucet.sol";
import {IFaucetContract} from "../src/interfaces/IFaucetContract.sol";

contract FlipToEarnFaucetTest is Test {
    FlipToEarnFaucet public faucet;
    
    // Test addresses with known private keys
    uint256 public constant OWNER_PRIVATE_KEY = 0x1;
    uint256 public constant USER1_PRIVATE_KEY = 0x2;
    uint256 public constant USER2_PRIVATE_KEY = 0x3;
    uint256 public constant SIGNING_KEY_PRIVATE_KEY = 0x4;
    uint256 public constant NON_OWNER_PRIVATE_KEY = 0x5;
    
    address public owner;
    address public user1;
    address public user2;
    address public signingKey;
    address public nonOwner;
    
    // Test parameters
    uint256 public constant MIN_FLIPS_REQUIRED = 5;
    uint256 public constant DAILY_CLAIMS_LIMIT = 3;
    uint256 public constant DROP_AMOUNT = 0.01 ether;
    uint256 public constant COOLDOWN_PERIOD = 1 hours;
    uint256 public constant SIGNATURE_EXPIRATION = 1 hours;
    
    // EIP-712 domain separator components
    bytes32 public constant DOMAIN_NAME = keccak256("CoinFlipFaucet");
    bytes32 public constant DOMAIN_VERSION = keccak256("1");
    bytes32 public constant CLAIM_TYPEHASH = keccak256(
        "ClaimData(address userAddress,uint256 flipCount,uint256 minFlipsRequired,uint256 timestamp,uint256 nonce)"
    );
    
    function setUp() public {
        // Generate addresses from private keys
        owner = vm.addr(OWNER_PRIVATE_KEY);
        user1 = vm.addr(USER1_PRIVATE_KEY);
        user2 = vm.addr(USER2_PRIVATE_KEY);
        signingKey = vm.addr(SIGNING_KEY_PRIVATE_KEY);
        nonOwner = vm.addr(NON_OWNER_PRIVATE_KEY);
        
        vm.startPrank(owner);
        faucet = new FlipToEarnFaucet(
            signingKey,
            MIN_FLIPS_REQUIRED,
            DAILY_CLAIMS_LIMIT,
            DROP_AMOUNT,
            COOLDOWN_PERIOD,
            SIGNATURE_EXPIRATION
        );
        
        // Fund the contract
        vm.deal(address(faucet), 1 ether);
        vm.stopPrank();
    }
    
    // Helper function to create a valid signature
    function createSignature(
        address user,
        uint256 flipCount,
        uint256 minFlipsRequired,
        uint256 timestamp,
        uint256 nonce
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                CLAIM_TYPEHASH,
                user,
                flipCount,
                minFlipsRequired,
                timestamp,
                nonce
            )
        );
        
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                DOMAIN_NAME,
                DOMAIN_VERSION,
                block.chainid,
                address(faucet)
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );
        
        // The user signs their own claim, so we need to use the user's private key
        uint256 userPrivateKey;
        if (user == user1) {
            userPrivateKey = USER1_PRIVATE_KEY;
        } else if (user == user2) {
            userPrivateKey = USER2_PRIVATE_KEY;
        } else {
            revert("Unknown user");
        }
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        return abi.encodePacked(r, s, v);
    }
    
    function test_Constructor() public {
        assertEq(faucet.owner(), owner);
        assertEq(faucet.signingKey(), signingKey);
        assertEq(faucet.minFlipsRequired(), MIN_FLIPS_REQUIRED);
        assertEq(faucet.dailyClaimsLimit(), DAILY_CLAIMS_LIMIT);
        assertEq(faucet.dropAmount(), DROP_AMOUNT);
        assertEq(faucet.cooldownPeriod(), COOLDOWN_PERIOD);
        assertEq(faucet.signatureExpiration(), SIGNATURE_EXPIRATION);
        assertEq(faucet.getContractBalance(), 1 ether);
    }
    
    function test_InitiateSession() public {
        vm.startPrank(user1);
        
        uint256 minFlips = faucet.initiateSession();
        assertEq(minFlips, MIN_FLIPS_REQUIRED);
        assertEq(faucet.userFlipCount(user1), 0);
        assertEq(faucet.userNonce(user1), 0);
        
        vm.stopPrank();
    }
    
    function test_ClaimReward_Success() public {
        vm.startPrank(user1);
        
        // Initiate session
        faucet.initiateSession();
        
        // Warp time forward to avoid cooldown period
        vm.warp(block.timestamp + COOLDOWN_PERIOD + 1);
        
        uint256 timestamp = block.timestamp;
        uint256 nonce = faucet.userNonce(user1);
        
        IFaucetContract.ClaimData memory claimData = IFaucetContract.ClaimData({
            userAddress: user1,
            flipCount: MIN_FLIPS_REQUIRED,
            minFlipsRequired: MIN_FLIPS_REQUIRED,
            timestamp: timestamp,
            nonce: nonce
        });
        
        bytes memory signature = createSignature(
            user1,
            MIN_FLIPS_REQUIRED,
            MIN_FLIPS_REQUIRED,
            timestamp,
            nonce
        );
        
        uint256 initialBalance = user1.balance;
        
        faucet.claimReward(claimData, signature);
        
        // Check that user received the reward
        assertEq(user1.balance, initialBalance + DROP_AMOUNT);
        
        // Check that user's nonce increased
        assertEq(faucet.userNonce(user1), nonce + 1);
        
        // Check that user's daily claims count increased
        uint256 today = block.timestamp / 86400;
        assertEq(faucet.userDailyClaimsCount(user1, today), 1);
        
        // Check that user's last claim time was updated
        assertEq(faucet.userLastClaimTime(user1), block.timestamp);
        
        vm.stopPrank();
    }
    
    function test_PerWalletDailyLimit() public {
        vm.startPrank(user1);
        
        // User1 claims up to the daily limit
        for (uint256 i = 0; i < DAILY_CLAIMS_LIMIT; i++) {
            faucet.initiateSession();
            
            // Warp time forward to avoid cooldown for each claim
            vm.warp(block.timestamp + COOLDOWN_PERIOD + 1);
            
            uint256 claimTimestamp = block.timestamp;
            uint256 claimNonce = faucet.userNonce(user1);
            
            IFaucetContract.ClaimData memory claimData = IFaucetContract.ClaimData({
                userAddress: user1,
                flipCount: MIN_FLIPS_REQUIRED,
                minFlipsRequired: MIN_FLIPS_REQUIRED,
                timestamp: claimTimestamp,
                nonce: claimNonce
            });
            
            bytes memory signature = createSignature(
                user1,
                MIN_FLIPS_REQUIRED,
                MIN_FLIPS_REQUIRED,
                claimTimestamp,
                claimNonce
            );
            
            faucet.claimReward(claimData, signature);
        }
        
        // Try to claim one more time - should fail
        faucet.initiateSession();
        
        // Warp time forward to avoid cooldown for the final claim attempt
        vm.warp(block.timestamp + COOLDOWN_PERIOD + 1);
        
        uint256 timestamp = block.timestamp;
        uint256 nonce = faucet.userNonce(user1);
        
        IFaucetContract.ClaimData memory claimData = IFaucetContract.ClaimData({
            userAddress: user1,
            flipCount: MIN_FLIPS_REQUIRED,
            minFlipsRequired: MIN_FLIPS_REQUIRED,
            timestamp: timestamp,
            nonce: nonce
        });
        
        bytes memory signature = createSignature(
            user1,
            MIN_FLIPS_REQUIRED,
            MIN_FLIPS_REQUIRED,
            timestamp,
            nonce
        );
        
        vm.expectRevert("Daily limit reached for this wallet");
        faucet.claimReward(claimData, signature);
        
        vm.stopPrank();
    }
    
    function test_MultipleUsersCanClaimSimultaneously() public {
        // User1 claims
        vm.startPrank(user1);
        faucet.initiateSession();
        
        // Warp time forward to avoid cooldown
        vm.warp(block.timestamp + COOLDOWN_PERIOD + 1);
        
        uint256 timestamp = block.timestamp;
        uint256 nonce = faucet.userNonce(user1);
        
        IFaucetContract.ClaimData memory claimData1 = IFaucetContract.ClaimData({
            userAddress: user1,
            flipCount: MIN_FLIPS_REQUIRED,
            minFlipsRequired: MIN_FLIPS_REQUIRED,
            timestamp: timestamp,
            nonce: nonce
        });
        
        bytes memory signature1 = createSignature(
            user1,
            MIN_FLIPS_REQUIRED,
            MIN_FLIPS_REQUIRED,
            timestamp,
            nonce
        );
        
        faucet.claimReward(claimData1, signature1);
        vm.stopPrank();
        
        // User2 claims immediately after (should work since limits are per-wallet)
        vm.startPrank(user2);
        faucet.initiateSession();
        
        // Warp time forward to avoid cooldown for user2
        vm.warp(block.timestamp + COOLDOWN_PERIOD + 1);
        
        timestamp = block.timestamp;
        nonce = faucet.userNonce(user2);
        
        IFaucetContract.ClaimData memory claimData2 = IFaucetContract.ClaimData({
            userAddress: user2,
            flipCount: MIN_FLIPS_REQUIRED,
            minFlipsRequired: MIN_FLIPS_REQUIRED,
            timestamp: timestamp,
            nonce: nonce
        });
        
        bytes memory signature2 = createSignature(
            user2,
            MIN_FLIPS_REQUIRED,
            MIN_FLIPS_REQUIRED,
            timestamp,
            nonce
        );
        
        faucet.claimReward(claimData2, signature2);
        vm.stopPrank();
        
        // Both users should have claimed successfully
        uint256 today = block.timestamp / 86400;
        assertEq(faucet.userDailyClaimsCount(user1, today), 1);
        assertEq(faucet.userDailyClaimsCount(user2, today), 1);
    }
    
    function test_CooldownPeriod() public {
        vm.startPrank(owner);
        // Set signature expiration to be longer than cooldown period for this test
        faucet.setSignatureExpiration(2 hours);
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        // First claim
        faucet.initiateSession();
        
        // Warp time forward to avoid initial cooldown
        vm.warp(block.timestamp + COOLDOWN_PERIOD + 1);
        
        uint256 timestamp = block.timestamp;
        uint256 nonce = faucet.userNonce(user1);
        
        IFaucetContract.ClaimData memory claimData = IFaucetContract.ClaimData({
            userAddress: user1,
            flipCount: MIN_FLIPS_REQUIRED,
            minFlipsRequired: MIN_FLIPS_REQUIRED,
            timestamp: timestamp,
            nonce: nonce
        });
        
        bytes memory signature = createSignature(
            user1,
            MIN_FLIPS_REQUIRED,
            MIN_FLIPS_REQUIRED,
            timestamp,
            nonce
        );
        
        faucet.claimReward(claimData, signature);
        
        // Try to claim again immediately - should fail due to cooldown
        faucet.initiateSession();
        
        // Update timestamp to current time for the second claim attempt
        timestamp = block.timestamp;
        nonce = faucet.userNonce(user1);
        
        claimData = IFaucetContract.ClaimData({
            userAddress: user1,
            flipCount: MIN_FLIPS_REQUIRED,
            minFlipsRequired: MIN_FLIPS_REQUIRED,
            timestamp: timestamp,
            nonce: nonce
        });
        
        signature = createSignature(
            user1,
            MIN_FLIPS_REQUIRED,
            MIN_FLIPS_REQUIRED,
            timestamp,
            nonce
        );
        
        vm.expectRevert("Cooldown period not met");
        faucet.claimReward(claimData, signature);
        
        // Fast forward past cooldown period
        vm.warp(block.timestamp + COOLDOWN_PERIOD + 1);
        
        // Now should work
        faucet.claimReward(claimData, signature);
        
        vm.stopPrank();
    }
    
    function test_InvalidSignature() public {
        vm.startPrank(user1);
        
        faucet.initiateSession();
        
        uint256 timestamp = block.timestamp;
        uint256 nonce = faucet.userNonce(user1);
        
        IFaucetContract.ClaimData memory claimData = IFaucetContract.ClaimData({
            userAddress: user1,
            flipCount: MIN_FLIPS_REQUIRED,
            minFlipsRequired: MIN_FLIPS_REQUIRED,
            timestamp: timestamp,
            nonce: nonce
        });
        
        // Create signature with wrong user (user2 signs for user1)
        bytes32 structHash = keccak256(
            abi.encode(
                CLAIM_TYPEHASH,
                user1, // user1 is the claimer
                MIN_FLIPS_REQUIRED,
                MIN_FLIPS_REQUIRED,
                timestamp,
                nonce
            )
        );
        
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                DOMAIN_NAME,
                DOMAIN_VERSION,
                block.chainid,
                address(faucet)
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );
        
        // Use user2's private key to sign user1's claim (should fail)
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(USER2_PRIVATE_KEY, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.expectRevert("Invalid signature");
        faucet.claimReward(claimData, signature);
        
        vm.stopPrank();
    }
    
    function test_ExpiredSignature() public {
        vm.startPrank(user1);
        
        faucet.initiateSession();
        
        // Warp time forward to avoid cooldown, then set expired timestamp
        vm.warp(block.timestamp + COOLDOWN_PERIOD + 1);
        uint256 timestamp = block.timestamp - SIGNATURE_EXPIRATION - 1 seconds; // Expired
        uint256 nonce = faucet.userNonce(user1);
        
        IFaucetContract.ClaimData memory claimData = IFaucetContract.ClaimData({
            userAddress: user1,
            flipCount: MIN_FLIPS_REQUIRED,
            minFlipsRequired: MIN_FLIPS_REQUIRED,
            timestamp: timestamp,
            nonce: nonce
        });
        
        bytes memory signature = createSignature(
            user1,
            MIN_FLIPS_REQUIRED,
            MIN_FLIPS_REQUIRED,
            timestamp,
            nonce
        );
        
        vm.expectRevert("Signature expired");
        faucet.claimReward(claimData, signature);
        
        vm.stopPrank();
    }
    
    function test_InsufficientFlips() public {
        vm.startPrank(user1);
        
        faucet.initiateSession();
        
        uint256 timestamp = block.timestamp;
        uint256 nonce = faucet.userNonce(user1);
        
        IFaucetContract.ClaimData memory claimData = IFaucetContract.ClaimData({
            userAddress: user1,
            flipCount: MIN_FLIPS_REQUIRED - 1, // Insufficient flips
            minFlipsRequired: MIN_FLIPS_REQUIRED,
            timestamp: timestamp,
            nonce: nonce
        });
        
        bytes memory signature = createSignature(
            user1,
            MIN_FLIPS_REQUIRED - 1,
            MIN_FLIPS_REQUIRED,
            timestamp,
            nonce
        );
        
        vm.expectRevert("Insufficient flips");
        faucet.claimReward(claimData, signature);
        
        vm.stopPrank();
    }
    
    function test_AdminFunctions() public {
        vm.startPrank(owner);
        
        // Test setting new parameters
        faucet.setMinFlipsRequired(10);
        assertEq(faucet.minFlipsRequired(), 10);
        
        faucet.setDailyClaimsLimit(5);
        assertEq(faucet.dailyClaimsLimit(), 5);
        
        faucet.setDropAmount(0.02 ether);
        assertEq(faucet.dropAmount(), 0.02 ether);
        
        faucet.setCooldownPeriod(2 hours);
        assertEq(faucet.cooldownPeriod(), 2 hours);
        
        faucet.setSignatureExpiration(2 hours);
        assertEq(faucet.signatureExpiration(), 2 hours);
        
        faucet.updateSigningKey(address(0x6));
        assertEq(faucet.signingKey(), address(0x6));
        
        vm.stopPrank();
    }
    
    function test_NonOwnerCannotCallAdminFunctions() public {
        vm.startPrank(nonOwner);
        
        vm.expectRevert();
        faucet.setMinFlipsRequired(10);
        
        vm.expectRevert();
        faucet.setDailyClaimsLimit(5);
        
        vm.expectRevert();
        faucet.setDropAmount(0.02 ether);
        
        vm.expectRevert();
        faucet.setCooldownPeriod(2 hours);
        
        vm.expectRevert();
        faucet.setSignatureExpiration(2 hours);
        
        vm.expectRevert();
        faucet.updateSigningKey(address(0x6));
        
        vm.expectRevert();
        faucet.pause();
        
        vm.expectRevert();
        faucet.unpause();
        
        vm.expectRevert();
        faucet.emergencyWithdraw();
        
        vm.stopPrank();
    }
    
    function test_PauseUnpause() public {
        vm.startPrank(owner);
        
        // Pause the contract
        faucet.pause();
        assertTrue(faucet.paused());
        
        // Unpause the contract
        faucet.unpause();
        assertFalse(faucet.paused());
        
        vm.stopPrank();
    }
    
    function test_CannotClaimWhenPaused() public {
        vm.startPrank(owner);
        faucet.pause();
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        vm.expectRevert();
        faucet.initiateSession();
        
        vm.stopPrank();
    }
    
    function test_EmergencyWithdraw() public {
        uint256 initialOwnerBalance = owner.balance;
        uint256 contractBalance = address(faucet).balance;
        
        vm.startPrank(owner);
        faucet.emergencyWithdraw();
        vm.stopPrank();
        
        assertEq(owner.balance, initialOwnerBalance + contractBalance);
        assertEq(address(faucet).balance, 0);
    }
    
    function test_FundContract() public {
        uint256 initialBalance = address(faucet).balance;
        uint256 fundAmount = 0.5 ether;
        
        vm.startPrank(owner);
        vm.deal(owner, fundAmount);
        faucet.fund{value: fundAmount}();
        vm.stopPrank();
        
        assertEq(address(faucet).balance, initialBalance + fundAmount);
    }
    
    function test_ViewFunctions() public {
        // Test all view functions
        assertEq(faucet.getMinFlipsRequired(), MIN_FLIPS_REQUIRED);
        assertEq(faucet.getDailyClaimsLimit(), DAILY_CLAIMS_LIMIT);
        assertEq(faucet.getDropAmount(), DROP_AMOUNT);
        assertEq(faucet.getContractBalance(), 1 ether);
        
        // Test user-specific view functions
        assertEq(faucet.getUserNonce(user1), 0);
        assertEq(faucet.getUserMinFlipsRequired(user1), MIN_FLIPS_REQUIRED);
        assertFalse(faucet.isClaimAvailable(user1));
        
        // Test daily claims count (should return 0 for backward compatibility)
        assertEq(faucet.getDailyClaimsCount(block.timestamp / 86400), 0);
        
        // Test per-user daily claims count
        uint256 today = block.timestamp / 86400;
        assertEq(faucet.getUserDailyClaimsCount(user1, today), 0);
    }
    
    function test_ReceiveFunction() public {
        uint256 initialBalance = address(faucet).balance;
        uint256 sendAmount = 0.1 ether;
        
        vm.deal(address(this), sendAmount);
        (bool success,) = address(faucet).call{value: sendAmount}("");
        assertTrue(success);
        
        assertEq(address(faucet).balance, initialBalance + sendAmount);
    }
}
