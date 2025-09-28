// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICoinFlipGame {
    enum Choice {
        HEADS,
        TAILS
    }

    struct BetInfo {
        address player;
        uint256 amount;
        Choice choice;
        uint256 timestamp;
        bool resolved;
        bool won;
    }

    function placeBet(Choice choice) external payable returns (uint256 betId);

    function getBetInfo(uint256 betId) external view returns (BetInfo memory);

    function getContractStats()
        external
        view
        returns (uint256 totalBets, uint256 totalVolume, uint256 houseEdge);
}
