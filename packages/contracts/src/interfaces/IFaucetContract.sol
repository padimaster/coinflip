// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFaucetContract {
    struct ClaimData {
        address userAddress;
        uint256 flipCount;
        uint256 minFlipsRequired;
        uint256 timestamp;
        uint256 nonce;
    }

    event RewardClaimed(
        address indexed user,
        uint256 amount,
        uint256 flipCount,
        uint256 minFlipsRequired,
        uint256 nonce
    );

    event DailyLimitReached(uint256 date, uint256 limit);
    event FaucetConfigured(
        uint256 dropAmount,
        uint256 minFlipsRequired,
        uint256 dailyLimit
    );
    event MinFlipsRequiredUpdated(uint256 minFlipsRequired);
    event DailyClaimsLimitUpdated(uint256 limit);
    event ContractPaused();
    event ContractUnpaused();
    event ContractFunded(uint256 amount);
    event EmergencyWithdrawal(uint256 amount);
    event AuthorizedRelayerAdded(address newRelayer);
    event AuthorizedRelayerRemoved(address relayer);

    function claimReward(
        ClaimData calldata claimData,
        bytes calldata signature
    ) external;

    function getDailyClaimsLimit() external view returns (uint256);

    function getDailyClaimsCount(uint256 date) external view returns (uint256);

    function getUserNonce(address user) external view returns (uint256);

    function getContractBalance() external view returns (uint256);

    function getDropAmount() external view returns (uint256);
}
