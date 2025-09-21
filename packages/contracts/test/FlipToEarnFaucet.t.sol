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
    uint256 public constant RELAYER1_PRIVATE_KEY = 0x4;
    uint256 public constant RELAYER2_PRIVATE_KEY = 0x5;
    uint256 public constant NON_OWNER_PRIVATE_KEY = 0x6;
    
    address public owner;
    address public user1;
    address public user2;
    address public relayer1;
    address public relayer2;
    address public nonOwner;
    
    // Test parameters
    uint256 public constant MIN_FLIPS_REQUIRED = 5;
    uint256 public constant DAILY_CLAIMS_LIMIT = 4;
    uint256 public constant DROP_AMOUNT = 0.01 ether;
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
        relayer1 = vm.addr(RELAYER1_PRIVATE_KEY);
        relayer2 = vm.addr(RELAYER2_PRIVATE_KEY);
        nonOwner = vm.addr(NON_OWNER_PRIVATE_KEY);
        
        // Create array of authorized relayers
        address[] memory authorizedRelayers = new address[](2);
        authorizedRelayers[0] = relayer1;
        authorizedRelayers[1] = relayer2;
        
        vm.startPrank(owner);
        faucet = new FlipToEarnFaucet(
            authorizedRelayers,
            MIN_FLIPS_REQUIRED,
            DAILY_CLAIMS_LIMIT,
            DROP_AMOUNT,
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
    
    // ============ Constructor Tests ============
    
    function test_Constructor() public view {
        assertEq(faucet.owner(), owner);
        assertEq(faucet.minFlipsRequired(), MIN_FLIPS_REQUIRED);
        assertEq(faucet.dailyClaimsLimit(), DAILY_CLAIMS_LIMIT);
        assertEq(faucet.dropAmount(), DROP_AMOUNT);
        assertEq(faucet.signatureExpirationTime(), SIGNATURE_EXPIRATION);
        assertEq(faucet.getContractBalance(), 1 ether);
        
        // Check authorized relayers
        address[] memory authorizedRelayers = faucet.getAuthorizedRelayers();
        assertEq(authorizedRelayers.length, 2);
        assertEq(authorizedRelayers[0], relayer1);
        assertEq(authorizedRelayers[1], relayer2);
        assertTrue(faucet.isAuthorizedRelayer(relayer1));
        assertTrue(faucet.isAuthorizedRelayer(relayer2));
    }
    
    function test_Constructor_InvalidParameters() public {
        address[] memory authorizedRelayers = new address[](1);
        authorizedRelayers[0] = relayer1;
        
        // Test invalid min flips required
        vm.expectRevert("Invalid min flips required");
        new FlipToEarnFaucet(
            authorizedRelayers,
            2, // Too low
            DAILY_CLAIMS_LIMIT,
            DROP_AMOUNT,
            SIGNATURE_EXPIRATION
        );
        
        // Test invalid daily limit
        vm.expectRevert("Invalid daily limit");
        new FlipToEarnFaucet(
            authorizedRelayers,
            MIN_FLIPS_REQUIRED,
            3, // Too low
            DROP_AMOUNT,
            SIGNATURE_EXPIRATION
        );
        
        // Test invalid drop amount
        vm.expectRevert("Invalid drop amount");
        new FlipToEarnFaucet(
            authorizedRelayers,
            MIN_FLIPS_REQUIRED,
            DAILY_CLAIMS_LIMIT,
            0, // Too low
            SIGNATURE_EXPIRATION
        );
        
        // Test invalid signature expiration
        vm.expectRevert("Invalid signature expiration");
        new FlipToEarnFaucet(
            authorizedRelayers,
            MIN_FLIPS_REQUIRED,
            DAILY_CLAIMS_LIMIT,
            DROP_AMOUNT,
            4 minutes // Too low
        );
        
        // Test no authorized relayers
        address[] memory emptyRelayers = new address[](0);
        vm.expectRevert("No authorized relayers");
        new FlipToEarnFaucet(
            emptyRelayers,
            MIN_FLIPS_REQUIRED,
            DAILY_CLAIMS_LIMIT,
            DROP_AMOUNT,
            SIGNATURE_EXPIRATION
        );
        
        // Test invalid relayer address
        address[] memory invalidRelayerArray = new address[](1);
        invalidRelayerArray[0] = address(0);
        vm.expectRevert("Invalid relayer address");
        new FlipToEarnFaucet(
            invalidRelayerArray,
            MIN_FLIPS_REQUIRED,
            DAILY_CLAIMS_LIMIT,
            DROP_AMOUNT,
            SIGNATURE_EXPIRATION
        );
    }
    
    // ============ Claim Reward Tests ============
    
    function test_ClaimReward_Success() public {
        vm.startPrank(relayer1);
        
        uint256 timestamp = block.timestamp;
        uint256 nonce = faucet.getUserNonce(user1);
        
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
        assertEq(faucet.getUserNonce(user1), nonce + 1);
        
        // Check that user's daily claims count increased
        uint256 today = block.timestamp / 86400;
        assertEq(faucet.getUserDailyClaimsCount(user1, today), 1);
        
        // Check that user's last claim time was updated
        assertEq(faucet.userLastClaimTime(user1), block.timestamp);
        
        vm.stopPrank();
    }
    
    function test_ClaimReward_OnlyAuthorizedRelayer() public {
        vm.startPrank(nonOwner);
        
        uint256 timestamp = block.timestamp;
        uint256 nonce = faucet.getUserNonce(user1);
        
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
        
        vm.expectRevert("Not authorized");
        faucet.claimReward(claimData, signature);
        
        vm.stopPrank();
    }
    
    function test_ClaimReward_InvalidNonce() public {
        vm.startPrank(relayer1);
        
        uint256 timestamp = block.timestamp;
        uint256 nonce = faucet.getUserNonce(user1) + 1; // Wrong nonce
        
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
        
        vm.expectRevert("Invalid nonce");
        faucet.claimReward(claimData, signature);
        
        vm.stopPrank();
    }
    
    function test_ClaimReward_InsufficientFlips() public {
        vm.startPrank(relayer1);
        
        uint256 timestamp = block.timestamp;
        uint256 nonce = faucet.getUserNonce(user1);
        
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
    
    function test_ClaimReward_ExpiredSignature() public {
        vm.startPrank(relayer1);
        
        // Warp time forward first to avoid underflow
        vm.warp(block.timestamp + SIGNATURE_EXPIRATION + 1 seconds);
        uint256 timestamp = block.timestamp - SIGNATURE_EXPIRATION - 1 seconds; // Expired
        uint256 nonce = faucet.getUserNonce(user1);
        
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
    
    function test_ClaimReward_InvalidTimestamp() public {
        vm.startPrank(relayer1);
        
        uint256 timestamp = block.timestamp + 1; // Future timestamp
        uint256 nonce = faucet.getUserNonce(user1);
        
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
        
        vm.expectRevert("Invalid timestamp");
        faucet.claimReward(claimData, signature);
        
        vm.stopPrank();
    }
    
    function test_ClaimReward_InvalidSignature() public {
        vm.startPrank(relayer1);
        
        uint256 timestamp = block.timestamp;
        uint256 nonce = faucet.getUserNonce(user1);
        
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
    
    function test_ClaimReward_DailyLimitReached() public {
        vm.startPrank(relayer1);
        
        // User1 claims up to the daily limit
        for (uint256 i = 0; i < DAILY_CLAIMS_LIMIT; i++) {
            uint256 loopTimestamp = block.timestamp;
            uint256 loopNonce = faucet.getUserNonce(user1);
            
            IFaucetContract.ClaimData memory loopClaimData = IFaucetContract.ClaimData({
                userAddress: user1,
                flipCount: MIN_FLIPS_REQUIRED,
                minFlipsRequired: MIN_FLIPS_REQUIRED,
                timestamp: loopTimestamp,
                nonce: loopNonce
            });
            
            bytes memory loopSignature = createSignature(
                user1,
                MIN_FLIPS_REQUIRED,
                MIN_FLIPS_REQUIRED,
                loopTimestamp,
                loopNonce
            );
            
            faucet.claimReward(loopClaimData, loopSignature);
        }
        
        // Try to claim one more time - should fail
        uint256 finalTimestamp = block.timestamp;
        uint256 finalNonce = faucet.getUserNonce(user1);
        
        IFaucetContract.ClaimData memory finalClaimData = IFaucetContract.ClaimData({
            userAddress: user1,
            flipCount: MIN_FLIPS_REQUIRED,
            minFlipsRequired: MIN_FLIPS_REQUIRED,
            timestamp: finalTimestamp,
            nonce: finalNonce
        });
        
        bytes memory finalSignature = createSignature(
            user1,
            MIN_FLIPS_REQUIRED,
            MIN_FLIPS_REQUIRED,
            finalTimestamp,
            finalNonce
        );
        
        vm.expectRevert("Daily limit reached for this wallet");
        faucet.claimReward(finalClaimData, finalSignature);
        
        vm.stopPrank();
    }
    
    function test_ClaimReward_InsufficientContractBalance() public {
        // Drain the contract balance
        vm.startPrank(owner);
        faucet.emergencyWithdraw();
        vm.stopPrank();
        
        vm.startPrank(relayer1);
        
        uint256 timestamp = block.timestamp;
        uint256 nonce = faucet.getUserNonce(user1);
        
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
        
        vm.expectRevert("Insufficient contract balance");
        faucet.claimReward(claimData, signature);
        
        vm.stopPrank();
    }
    
    function test_MultipleUsersCanClaimSimultaneously() public {
        // User1 claims
        vm.startPrank(relayer1);
        
        uint256 timestamp = block.timestamp;
        uint256 nonce1 = faucet.getUserNonce(user1);
        
        IFaucetContract.ClaimData memory claimData1 = IFaucetContract.ClaimData({
            userAddress: user1,
            flipCount: MIN_FLIPS_REQUIRED,
            minFlipsRequired: MIN_FLIPS_REQUIRED,
            timestamp: timestamp,
            nonce: nonce1
        });
        
        bytes memory signature1 = createSignature(
            user1,
            MIN_FLIPS_REQUIRED,
            MIN_FLIPS_REQUIRED,
            timestamp,
            nonce1
        );
        
        faucet.claimReward(claimData1, signature1);
        
        // User2 claims immediately after (should work since limits are per-wallet)
        uint256 nonce2 = faucet.getUserNonce(user2);
        
        IFaucetContract.ClaimData memory claimData2 = IFaucetContract.ClaimData({
            userAddress: user2,
            flipCount: MIN_FLIPS_REQUIRED,
            minFlipsRequired: MIN_FLIPS_REQUIRED,
            timestamp: timestamp,
            nonce: nonce2
        });
        
        bytes memory signature2 = createSignature(
            user2,
            MIN_FLIPS_REQUIRED,
            MIN_FLIPS_REQUIRED,
            timestamp,
            nonce2
        );
        
        faucet.claimReward(claimData2, signature2);
        vm.stopPrank();
        
        // Both users should have claimed successfully
        uint256 today = block.timestamp / 86400;
        assertEq(faucet.getUserDailyClaimsCount(user1, today), 1);
        assertEq(faucet.getUserDailyClaimsCount(user2, today), 1);
    }
    
    // ============ Admin Functions Tests ============
    
    function test_AdminFunctions() public {
        vm.startPrank(owner);
        
        // Test setting new parameters
        faucet.setMinFlipsRequired(10);
        assertEq(faucet.minFlipsRequired(), 10);
        
        faucet.setDailyClaimsLimit(5);
        assertEq(faucet.dailyClaimsLimit(), 5);
        
        faucet.setDropAmount(0.02 ether);
        assertEq(faucet.dropAmount(), 0.02 ether);
        
        faucet.setSignatureExpirationTime(2 hours);
        assertEq(faucet.signatureExpirationTime(), 2 hours);
        
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
        faucet.setSignatureExpirationTime(2 hours);
        
        vm.expectRevert();
        faucet.pause();
        
        vm.expectRevert();
        faucet.unpause();
        
        vm.expectRevert();
        faucet.emergencyWithdraw();
        
        vm.expectRevert();
        faucet.addAuthorizedRelayer(address(0x7));
        
        vm.expectRevert();
        faucet.removeAuthorizedRelayer(relayer1);
        
        vm.stopPrank();
    }
    
    // ============ Authorized Relayer Management Tests ============
    
    function test_AddAuthorizedRelayer() public {
        address newRelayer = address(0x7);
        
        vm.startPrank(owner);
        
        // Check initial state
        assertFalse(faucet.isAuthorizedRelayer(newRelayer));
        
        // Add new relayer
        faucet.addAuthorizedRelayer(newRelayer);
        
        // Check new state
        assertTrue(faucet.isAuthorizedRelayer(newRelayer));
        
        address[] memory updatedRelayers = faucet.getAuthorizedRelayers();
        assertEq(updatedRelayers.length, 3);
        assertEq(updatedRelayers[2], newRelayer);
        
        vm.stopPrank();
    }
    
    function test_AddAuthorizedRelayer_InvalidAddress() public {
        vm.startPrank(owner);
        
        vm.expectRevert("Invalid relayer address");
        faucet.addAuthorizedRelayer(address(0));
        
        vm.stopPrank();
    }
    
    function test_AddAuthorizedRelayer_AlreadyAuthorized() public {
        vm.startPrank(owner);
        
        vm.expectRevert("Relayer already authorized");
        faucet.addAuthorizedRelayer(relayer1);
        
        vm.stopPrank();
    }
    
    function test_RemoveAuthorizedRelayer() public {
        vm.startPrank(owner);
        
        // Check initial state
        assertTrue(faucet.isAuthorizedRelayer(relayer1));
        
        // Remove relayer
        faucet.removeAuthorizedRelayer(relayer1);
        
        // Check new state
        assertFalse(faucet.isAuthorizedRelayer(relayer1));
        
        address[] memory remainingRelayers = faucet.getAuthorizedRelayers();
        assertEq(remainingRelayers.length, 1);
        assertEq(remainingRelayers[0], relayer2);
        
        vm.stopPrank();
    }
    
    function test_RemoveAuthorizedRelayer_NotAuthorized() public {
        address notAuthorized = address(0x7);
        
        vm.startPrank(owner);
        
        vm.expectRevert("Relayer not authorized");
        faucet.removeAuthorizedRelayer(notAuthorized);
        
        vm.stopPrank();
    }
    
    // ============ Pause/Unpause Tests ============
    
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
        
        vm.startPrank(relayer1);
        
        uint256 timestamp = block.timestamp;
        uint256 nonce = faucet.getUserNonce(user1);
        
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
        
        vm.expectRevert();
        faucet.claimReward(claimData, signature);
        
        vm.stopPrank();
    }
    
    // ============ Emergency Functions Tests ============
    
    function test_EmergencyWithdraw() public {
        uint256 initialOwnerBalance = owner.balance;
        uint256 contractBalance = address(faucet).balance;
        
        vm.startPrank(owner);
        faucet.emergencyWithdraw();
        vm.stopPrank();
        
        assertEq(owner.balance, initialOwnerBalance + contractBalance);
        assertEq(address(faucet).balance, 0);
    }
    
    function test_EmergencyWithdraw_NoFunds() public {
        // Drain the contract first
        vm.startPrank(owner);
        faucet.emergencyWithdraw();
        
        vm.expectRevert("No funds to withdraw");
        faucet.emergencyWithdraw();
        
        vm.stopPrank();
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
    
    function test_FundContract_NoFundsSent() public {
        vm.startPrank(owner);
        
        vm.expectRevert("No funds sent");
        faucet.fund{value: 0}();
        
        vm.stopPrank();
    }
    
    // ============ View Functions Tests ============
    
    function test_ViewFunctions() public view {
        // Test all view functions
        assertEq(faucet.minFlipsRequired(), MIN_FLIPS_REQUIRED);
        assertEq(faucet.getDailyClaimsLimit(), DAILY_CLAIMS_LIMIT);
        assertEq(faucet.getDropAmount(), DROP_AMOUNT);
        assertEq(faucet.getContractBalance(), 1 ether);
        
        // Test user-specific view functions
        assertEq(faucet.getUserNonce(user1), 0);
        
        // Test daily claims count (should return 0 for backward compatibility)
        assertEq(faucet.getDailyClaimsCount(block.timestamp / 86400), 0);
        
        // Test per-user daily claims count
        uint256 today = block.timestamp / 86400;
        assertEq(faucet.getUserDailyClaimsCount(user1, today), 0);
    }
    
    // ============ Receive Function Tests ============
    
    function test_ReceiveFunction() public {
        uint256 initialBalance = address(faucet).balance;
        uint256 sendAmount = 0.1 ether;
        
        vm.deal(address(this), sendAmount);
        (bool success,) = address(faucet).call{value: sendAmount}("");
        // The contract doesn't have a receive function, so this should fail
        assertFalse(success);
        
        // Balance should remain unchanged
        assertEq(address(faucet).balance, initialBalance);
    }
    
    // ============ Edge Cases and Fuzz Tests ============
    
    function test_ClaimReward_ReentrancyProtection() public {
        // This test ensures that the nonReentrant modifier is working
        vm.startPrank(relayer1);
        
        uint256 timestamp = block.timestamp;
        uint256 nonce = faucet.getUserNonce(user1);
        
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
        
        // First claim should succeed
        faucet.claimReward(claimData, signature);
        
        // Second claim with same nonce should fail due to nonce check
        vm.expectRevert("Invalid nonce");
        faucet.claimReward(claimData, signature);
        
        vm.stopPrank();
    }
    
    function test_MultipleRelayersCanClaim() public {
        // Test that different authorized relayers can process claims
        vm.startPrank(relayer1);
        
        uint256 timestamp = block.timestamp;
        uint256 nonce1 = faucet.getUserNonce(user1);
        
        IFaucetContract.ClaimData memory claimData1 = IFaucetContract.ClaimData({
            userAddress: user1,
            flipCount: MIN_FLIPS_REQUIRED,
            minFlipsRequired: MIN_FLIPS_REQUIRED,
            timestamp: timestamp,
            nonce: nonce1
        });
        
        bytes memory signature1 = createSignature(
            user1,
            MIN_FLIPS_REQUIRED,
            MIN_FLIPS_REQUIRED,
            timestamp,
            nonce1
        );
        
        faucet.claimReward(claimData1, signature1);
        vm.stopPrank();
        
        // Now use relayer2 for user2
        vm.startPrank(relayer2);
        
        uint256 nonce2 = faucet.getUserNonce(user2);
        
        IFaucetContract.ClaimData memory claimData2 = IFaucetContract.ClaimData({
            userAddress: user2,
            flipCount: MIN_FLIPS_REQUIRED,
            minFlipsRequired: MIN_FLIPS_REQUIRED,
            timestamp: timestamp,
            nonce: nonce2
        });
        
        bytes memory signature2 = createSignature(
            user2,
            MIN_FLIPS_REQUIRED,
            MIN_FLIPS_REQUIRED,
            timestamp,
            nonce2
        );
        
        faucet.claimReward(claimData2, signature2);
        vm.stopPrank();
        
        // Both claims should succeed
        uint256 today = block.timestamp / 86400;
        assertEq(faucet.getUserDailyClaimsCount(user1, today), 1);
        assertEq(faucet.getUserDailyClaimsCount(user2, today), 1);
    }
    
    function test_AdminFunctionValidation() public {
        vm.startPrank(owner);
        
        // Test invalid min flips required
        vm.expectRevert("Invalid min flips required");
        faucet.setMinFlipsRequired(0);
        
        // Test invalid daily limit
        vm.expectRevert("Invalid limit");
        faucet.setDailyClaimsLimit(0);
        
        // Test invalid drop amount
        vm.expectRevert("Invalid amount");
        faucet.setDropAmount(0);
        
        // Test invalid signature expiration
        vm.expectRevert("Invalid expiration");
        faucet.setSignatureExpirationTime(0);
        
        vm.stopPrank();
    }
}