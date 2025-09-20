// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IFaucetContract} from "./interfaces/IFaucetContract.sol";
import {SignatureVerifier} from "./utils/SignatureVerifier.sol";

contract FlipToEarnFaucet is
    IFaucetContract,
    ReentrancyGuard,
    Pausable,
    Ownable
{
    using SignatureVerifier for *;

    // Configuration parameters
    uint256 public minFlipsRequired;
    uint256 public dailyClaimsLimit;
    uint256 public dropAmount;
    uint256 public cooldownPeriod;
    uint256 public signatureExpiration;

    // Signing key for EIP-712 signatures
    address public signingKey;

    // Daily claims tracking
    mapping(uint256 => uint256) public dailyClaimsCount; // date => count
    uint256 public constant SECONDS_PER_DAY = 86400;

    // User state tracking
    mapping(address => uint256) public userNonce;
    mapping(address => uint256) public userLastClaimTime;
    mapping(address => uint256) public userFlipCount;

    // EIP-712 domain separator
    bytes32 public immutable DOMAIN_SEPARATOR;

    constructor(
        address _signingKey,
        uint256 _minFlipsRequired,
        uint256 _dailyClaimsLimit,
        uint256 _dropAmount,
        uint256 _cooldownPeriod,
        uint256 _signatureExpiration
    ) Ownable(msg.sender) {
        require(_signingKey != address(0), "Invalid signing key");
        require(_minFlipsRequired > 0, "Invalid min flips required");
        require(_dailyClaimsLimit > 0, "Invalid daily limit");
        require(_dropAmount > 0, "Invalid drop amount");
        require(_cooldownPeriod > 0, "Invalid cooldown period");
        require(_signatureExpiration > 0, "Invalid signature expiration");

        signingKey = _signingKey;
        minFlipsRequired = _minFlipsRequired;
        dailyClaimsLimit = _dailyClaimsLimit;
        dropAmount = _dropAmount;
        cooldownPeriod = _cooldownPeriod;
        signatureExpiration = _signatureExpiration;

        DOMAIN_SEPARATOR = SignatureVerifier.getDomainSeparator(
            "CoinFlipFaucet",
            "1",
            block.chainid,
            address(this)
        );

        emit FaucetConfigured(_minFlipsRequired, _dailyClaimsLimit);
    }

    function claimReward(
        ClaimData calldata claimData,
        bytes calldata signature
    ) external override nonReentrant whenNotPaused {
        require(
            claimData.flipCount >= claimData.minFlipsRequired,
            "Insufficient flips"
        );
        require(
            block.timestamp <= claimData.timestamp + signatureExpiration,
            "Signature expired"
        );
        require(block.timestamp >= claimData.timestamp, "Invalid timestamp");

        // Verify signature
        require(
            SignatureVerifier.verifyClaimSignature(
                claimData.userAddress,
                claimData.flipCount,
                claimData.minFlipsRequired,
                claimData.timestamp,
                claimData.nonce,
                signature,
                claimData.userAddress, // The user should sign their own claim
                DOMAIN_SEPARATOR
            ),
            "Invalid signature"
        );

        // Check nonce
        require(claimData.nonce == userNonce[claimData.userAddress], "Invalid nonce");

        // Check cooldown
        require(
            block.timestamp >= userLastClaimTime[claimData.userAddress] + cooldownPeriod,
            "Cooldown period not met"
        );

        // Check daily limit
        uint256 today = block.timestamp / SECONDS_PER_DAY;
        require(
            dailyClaimsCount[today] < dailyClaimsLimit,
            "Daily limit reached"
        );

        // Check contract balance
        require(
            address(this).balance >= dropAmount,
            "Insufficient contract balance"
        );

        // Update state
        userLastClaimTime[claimData.userAddress] = block.timestamp;
        userNonce[claimData.userAddress] += 1;
        dailyClaimsCount[today] += 1;

        // Reset user flip count
        userFlipCount[claimData.userAddress] = 0;

        // Transfer reward
        (bool success, ) = payable(claimData.userAddress).call{value: dropAmount}("");
        require(success, "Transfer failed");

        emit RewardClaimed(
            claimData.userAddress,
            dropAmount,
            claimData.flipCount,
            claimData.minFlipsRequired,
            claimData.nonce
        );

        if (dailyClaimsCount[today] >= dailyClaimsLimit) {
            emit DailyLimitReached(today, dailyClaimsLimit);
        }
    }

    function initiateSession()
        external
        override
        whenNotPaused
        returns (uint256)
    {
        // Reset user flip count
        userFlipCount[msg.sender] = 0;

        emit SessionInitiated(
            msg.sender,
            minFlipsRequired,
            userNonce[msg.sender]
        );
        return minFlipsRequired;
    }

    // View functions
    function getMinFlipsRequired() external view override returns (uint256) {
        return minFlipsRequired;
    }

    function getDailyClaimsLimit() external view override returns (uint256) {
        return dailyClaimsLimit;
    }

    function getDailyClaimsCount(
        uint256 date
    ) external view override returns (uint256) {
        return dailyClaimsCount[date];
    }

    function getUserNonce(
        address user
    ) external view override returns (uint256) {
        return userNonce[user];
    }

    function getUserMinFlipsRequired(
        address /* user */
    ) external view override returns (uint256) {
        return minFlipsRequired;
    }

    function isClaimAvailable(
        address user
    ) external view override returns (bool) {
        return
            userFlipCount[user] >= minFlipsRequired &&
            block.timestamp >= userLastClaimTime[user] + cooldownPeriod;
    }

    function getContractBalance() external view override returns (uint256) {
        return address(this).balance;
    }

    function getDropAmount() external view override returns (uint256) {
        return dropAmount;
    }

    // Admin functions
    function setMinFlipsRequired(uint256 _minFlipsRequired) external onlyOwner {
        require(_minFlipsRequired > 0, "Invalid min flips required");
        minFlipsRequired = _minFlipsRequired;
        emit MinFlipsRequiredUpdated(_minFlipsRequired);
    }

    function setDailyClaimsLimit(uint256 limit) external onlyOwner {
        require(limit > 0, "Invalid limit");
        dailyClaimsLimit = limit;
        emit DailyClaimsLimitUpdated(limit);
    }

    function setDropAmount(uint256 amount) external onlyOwner {
        require(amount > 0, "Invalid amount");
        dropAmount = amount;
    }

    function setCooldownPeriod(uint256 period) external onlyOwner {
        require(period > 0, "Invalid period");
        cooldownPeriod = period;
    }

    function setSignatureExpiration(uint256 expiration) external onlyOwner {
        require(expiration > 0, "Invalid expiration");
        signatureExpiration = expiration;
    }

    function updateSigningKey(address newKey) external onlyOwner {
        require(newKey != address(0), "Invalid key");
        signingKey = newKey;
        emit SigningKeyUpdated(newKey);
    }

    function fund() external payable onlyOwner {
        require(msg.value > 0, "No funds sent");
        emit ContractFunded(msg.value);
    }

    function pause() external onlyOwner {
        _pause();
        emit ContractPaused();
    }

    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused();
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit EmergencyWithdrawal(balance);
    }

    // Receive function to accept ETH
    receive() external payable {
        emit ContractFunded(msg.value);
    }
}
