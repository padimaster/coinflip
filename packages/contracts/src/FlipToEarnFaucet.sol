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

    uint256 public minFlipsRequired;
    uint256 public dailyClaimsLimit;
    uint256 public dropAmount;
    uint256 public signatureExpirationTime;

    address[] public authorizedRelayers;
    mapping(address => mapping(uint256 => uint256)) public userDailyClaimsCount;
    uint256 public constant SECONDS_PER_DAY = 86400;

    mapping(address => uint256) public userNonce;
    mapping(address => uint256) public userLastClaimTime;
    mapping(address => uint256) public userFlipCount;
    mapping(address => bool) public isAuthorizedRelayer;

    bytes32 public immutable DOMAIN_SEPARATOR;

    modifier onlyAuthorized() {
        require(isAuthorizedRelayer[msg.sender], "Not authorized");
        _;
    }

    constructor(
        address[] memory _authorizedRelayers,
        uint256 _minFlipsRequired,
        uint256 _dailyClaimsLimit,
        uint256 _dropAmount,
        uint256 _signatureExpirationTime
    ) Ownable(msg.sender) {
        require(_authorizedRelayers.length > 0, "No authorized relayers");
        require(_minFlipsRequired > 2, "Invalid min flips required");
        require(_dailyClaimsLimit > 3, "Invalid daily limit");
        require(
            _dropAmount > 0.000000000000000001 ether,
            "Invalid drop amount"
        );
        require(
            _signatureExpirationTime > 5 minutes,
            "Invalid signature expiration"
        );

        for (uint256 i = 0; i < _authorizedRelayers.length; i++) {
            require(
                _authorizedRelayers[i] != address(0),
                "Invalid relayer address"
            );
            authorizedRelayers.push(_authorizedRelayers[i]);
            isAuthorizedRelayer[_authorizedRelayers[i]] = true;
        }

        minFlipsRequired = _minFlipsRequired;
        dailyClaimsLimit = _dailyClaimsLimit;
        dropAmount = _dropAmount;
        signatureExpirationTime = _signatureExpirationTime;

        DOMAIN_SEPARATOR = SignatureVerifier.getDomainSeparator(
            "CoinFlipFaucet",
            "1",
            block.chainid,
            address(this)
        );

        emit FaucetConfigured(
            _dropAmount,
            _minFlipsRequired,
            _dailyClaimsLimit
        );
    }

    function claimReward(
        ClaimData calldata claimData,
        bytes calldata signature
    ) external override nonReentrant whenNotPaused onlyAuthorized {
        require(
            claimData.nonce == userNonce[claimData.userAddress],
            "Invalid nonce"
        );
        require(
            claimData.flipCount >= claimData.minFlipsRequired,
            "Insufficient flips"
        );
        require(
            block.timestamp <= claimData.timestamp + signatureExpirationTime,
            "Signature expired"
        );
        require(block.timestamp >= claimData.timestamp, "Invalid timestamp");

        // 🔧 UPDATED: Now supports both EOA and smart wallet signatures
        require(
            SignatureVerifier.verifyClaimSignature(
                claimData.userAddress,
                claimData.flipCount,
                claimData.minFlipsRequired,
                claimData.timestamp,
                claimData.nonce,
                signature,
                claimData.userAddress, // expectedSigner should match userAddress
                DOMAIN_SEPARATOR
            ),
            "Invalid signature"
        );

        // Check per-wallet daily limit
        uint256 today = block.timestamp / SECONDS_PER_DAY;
        require(
            userDailyClaimsCount[claimData.userAddress][today] <
                dailyClaimsLimit,
            "Daily limit reached for this wallet"
        );

        // Check contract balance
        require(
            address(this).balance >= dropAmount,
            "Insufficient contract balance"
        );

        // Update state
        userLastClaimTime[claimData.userAddress] = block.timestamp;
        userNonce[claimData.userAddress] += 1;
        userDailyClaimsCount[claimData.userAddress][today] += 1;

        // Transfer reward
        (bool success, ) = payable(claimData.userAddress).call{
            value: dropAmount
        }("");
        require(success, "Transfer failed");

        emit RewardClaimed(
            claimData.userAddress,
            dropAmount,
            claimData.flipCount,
            claimData.minFlipsRequired,
            claimData.nonce
        );

        if (
            userDailyClaimsCount[claimData.userAddress][today] >=
            dailyClaimsLimit
        ) {
            emit UserDailyLimitReached(
                claimData.userAddress,
                today,
                dailyClaimsLimit
            );
        }
    }

    // ... rest of your contract methods remain the same ...

    // View functions
    function getDailyClaimsLimit() external view override returns (uint256) {
        return dailyClaimsLimit;
    }

    function getDailyClaimsCount(
        uint256 /* date */
    ) external pure override returns (uint256) {
        return 0;
    }

    function getUserDailyClaimsCount(
        address user,
        uint256 date
    ) external view override returns (uint256) {
        return userDailyClaimsCount[user][date];
    }

    function getUserNonce(
        address user
    ) external view override returns (uint256) {
        return userNonce[user];
    }

    function getContractBalance() external view override returns (uint256) {
        return address(this).balance;
    }

    function getDropAmount() external view override returns (uint256) {
        return dropAmount;
    }

    // Admin functions remain the same...
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

    function setSignatureExpirationTime(uint256 expiration) external onlyOwner {
        require(expiration > 0, "Invalid expiration");
        signatureExpirationTime = expiration;
    }

    function addAuthorizedRelayer(address newRelayer) external onlyOwner {
        require(newRelayer != address(0), "Invalid relayer address");
        require(!isAuthorizedRelayer[newRelayer], "Relayer already authorized");

        authorizedRelayers.push(newRelayer);
        isAuthorizedRelayer[newRelayer] = true;
        emit AuthorizedRelayerAdded(newRelayer);
    }

    function removeAuthorizedRelayer(address relayer) external onlyOwner {
        require(isAuthorizedRelayer[relayer], "Relayer not authorized");

        isAuthorizedRelayer[relayer] = false;

        for (uint256 i = 0; i < authorizedRelayers.length; i++) {
            if (authorizedRelayers[i] == relayer) {
                authorizedRelayers[i] = authorizedRelayers[
                    authorizedRelayers.length - 1
                ];
                authorizedRelayers.pop();
                break;
            }
        }

        emit AuthorizedRelayerRemoved(relayer);
    }

    function getAuthorizedRelayers() external view returns (address[] memory) {
        return authorizedRelayers;
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
}
