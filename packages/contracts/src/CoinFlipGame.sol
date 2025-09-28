// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ICoinFlipGame} from "./interfaces/ICoinFlipGame.sol";

// Interface for randomness providers
interface IRandomnessProvider {
    function generateRandomNumber(uint256 seed) external view returns (uint256);
}

// Interface for access control
interface IAccessControl {
    function hasRole(bytes32 role, address account) external view returns (bool);
    function grantRole(bytes32 role, address account) external;
    function revokeRole(bytes32 role, address account) external;
}

// Simple randomness provider (can be upgraded later)
contract SimpleRandomnessProvider is IRandomnessProvider {
    function generateRandomNumber(uint256 seed) external view override returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao, // More secure than block.difficulty in post-merge Ethereum
                    msg.sender,
                    seed,
                    block.number
                )
            )
        );
    }
}

// Access control contract
contract AccessControl is IAccessControl {
    mapping(bytes32 => mapping(address => bool)) private _roles;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    
    modifier onlyRole(bytes32 role) {
        require(hasRole(role, msg.sender), "AccessControl: account is missing role");
        _;
    }
    
    constructor() {
        _roles[ADMIN_ROLE][msg.sender] = true;
        emit RoleGranted(ADMIN_ROLE, msg.sender, msg.sender);
    }
    
    function hasRole(bytes32 role, address account) public view override returns (bool) {
        return _roles[role][account];
    }
    
    function grantRole(bytes32 role, address account) public override onlyRole(ADMIN_ROLE) {
        _roles[role][account] = true;
        emit RoleGranted(role, account, msg.sender);
    }
    
    function revokeRole(bytes32 role, address account) public override onlyRole(ADMIN_ROLE) {
        _roles[role][account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }
}

// Main improved coin flip contract
contract ImprovedCoinFlip is ICoinFlipGame, AccessControl {
    // State variables
    uint256 public contractBalance;
    IRandomnessProvider public randomnessProvider;
    
    // Statistics
    uint256 public totalBets;
    uint256 public totalVolume;
    uint256 public totalWinnings;
    
    // Bet storage
    mapping(uint256 => BetInfo) public bets;
    uint256 public nextBetId = 1;
    
    // Player statistics
    mapping(address => uint256) public playerBets;
    mapping(address => uint256) public playerWinnings;
    
    // Configuration
    uint256 public houseEdge = 0; // 0% house edge for pure 50/50
    uint256 public maxBetPercentage = 10; // Maximum 10% of contract balance per bet
    bool public paused = false;
    
    // Events
    event BetPlaced(uint256 indexed betId, address indexed player, uint256 amount, Choice choice);
    event BetResolved(uint256 indexed betId, address indexed player, Choice result, bool won, uint256 payout);
    event ContractFunded(address indexed funder, uint256 amount);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    event RandomnessProviderUpdated(address indexed newProvider);
    event HouseEdgeUpdated(uint256 newHouseEdge);
    event ContractPaused(bool paused);
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier validBetAmount() {
        require(msg.value > 0, "Bet amount must be greater than zero");
        require(msg.value <= (contractBalance * maxBetPercentage) / 100, "Bet exceeds maximum allowed");
        _;
    }
    
    constructor(address _randomnessProvider) {
        randomnessProvider = IRandomnessProvider(_randomnessProvider);
        grantRole(OPERATOR_ROLE, msg.sender);
    }
    
    // Main betting function
    function placeBet(Choice _choice) external payable override whenNotPaused validBetAmount returns (uint256) {
        require(contractBalance >= msg.value, "Insufficient contract funds");
        
        uint256 betId = nextBetId++;
        
        bets[betId] = BetInfo({
            player: msg.sender,
            amount: msg.value,
            choice: _choice,
            timestamp: block.timestamp,
            resolved: false,
            won: false
        });
        
        // Update statistics
        totalBets++;
        totalVolume += msg.value;
        playerBets[msg.sender]++;
        
        emit BetPlaced(betId, msg.sender, msg.value, _choice);
        
        // Resolve bet immediately
        _resolveBet(betId);
        
        return betId;
    }
    
    // Internal function to resolve bets
    function _resolveBet(uint256 _betId) internal {
        BetInfo storage bet = bets[_betId];
        require(!bet.resolved, "Bet already resolved");
        
        // Generate random result
        uint256 randomNumber = randomnessProvider.generateRandomNumber(_betId);
        Choice result = (randomNumber % 2 == 0) ? Choice.HEADS : Choice.TAILS;
        
        bet.resolved = true;
        
        if (bet.choice == result) {
            // Player wins
            bet.won = true;
            uint256 baseWinnings = bet.amount * 2;
            uint256 houseFee = (bet.amount * houseEdge) / 100;
            uint256 payout = baseWinnings - houseFee;
            
            if (address(this).balance >= payout) {
                contractBalance -= (bet.amount - houseFee);
                totalWinnings += payout;
                playerWinnings[bet.player] += payout;
                
                payable(bet.player).transfer(payout);
                emit BetResolved(_betId, bet.player, result, true, payout);
            } else {
                // Emergency: return original bet if insufficient funds
                payable(bet.player).transfer(bet.amount);
                emit BetResolved(_betId, bet.player, result, true, bet.amount);
            }
        } else {
            // Player loses
            bet.won = false;
            contractBalance += bet.amount;
            emit BetResolved(_betId, bet.player, result, false, 0);
        }
    }
    
    // View functions
    function getBetInfo(uint256 _betId) external view override returns (BetInfo memory) {
        require(bets[_betId].player != address(0), "Bet does not exist");
        return bets[_betId];
    }
    
    function getContractStats() external view override returns (uint256, uint256, uint256) {
        return (totalBets, totalVolume, houseEdge);
    }
    
    function getPlayerStats(address _player) external view returns (uint256 betsCount, uint256 totalWon) {
        return (playerBets[_player], playerWinnings[_player]);
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getAvailableBalance() external view returns (uint256) {
        return contractBalance;
    }
    
    // Admin functions
    function fundContract() external payable onlyRole(ADMIN_ROLE) {
        contractBalance += msg.value;
        emit ContractFunded(msg.sender, msg.value);
    }
    
    function withdrawFunds(uint256 _amount) external onlyRole(ADMIN_ROLE) {
        require(_amount <= contractBalance, "Amount exceeds available balance");
        require(address(this).balance >= _amount, "Insufficient contract balance");
        
        contractBalance -= _amount;
        payable(msg.sender).transfer(_amount);
        emit FundsWithdrawn(msg.sender, _amount);
    }
    
    function updateRandomnessProvider(address _newProvider) external onlyRole(ADMIN_ROLE) {
        require(_newProvider != address(0), "Invalid provider address");
        randomnessProvider = IRandomnessProvider(_newProvider);
        emit RandomnessProviderUpdated(_newProvider);
    }
    
    function setHouseEdge(uint256 _houseEdge) external onlyRole(ADMIN_ROLE) {
        require(_houseEdge <= 5, "House edge cannot exceed 5%");
        houseEdge = _houseEdge;
        emit HouseEdgeUpdated(_houseEdge);
    }
    
    function setMaxBetPercentage(uint256 _percentage) external onlyRole(ADMIN_ROLE) {
        require(_percentage > 0 && _percentage <= 50, "Invalid percentage");
        maxBetPercentage = _percentage;
    }
    
    function setPaused(bool _paused) external onlyRole(OPERATOR_ROLE) {
        paused = _paused;
        emit ContractPaused(_paused);
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyRole(ADMIN_ROLE) {
        require(paused, "Contract must be paused for emergency withdrawal");
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
        contractBalance = 0;
    }
    
    // Receive function to accept ETH
    receive() external payable {
        contractBalance += msg.value;
        emit ContractFunded(msg.sender, msg.value);
    }
}