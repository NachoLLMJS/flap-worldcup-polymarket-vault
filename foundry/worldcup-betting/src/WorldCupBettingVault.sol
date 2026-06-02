// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IWorldCupViewer, MatchViewResult} from "./interfaces/IWorldCupViewer.sol";

/// @notice Real BNB pari-mutuel betting escrow for 2026 World Cup markets.
/// @dev MVP: BNB pools, WorldCupViewer settlement, winner proportional claims, cancelled-market refunds.
contract WorldCupBettingVault {
    enum MarketType { MatchWinner, GroupWinner, TournamentWinner }
    enum MarketStatus { Draft, Open, Locked, Resolved, Cancelled }

    struct BettingMarket {
        uint256 marketId;
        uint256 viewerMatchId;
        MarketType marketType;
        string label;
        uint64 openTime;
        uint64 closeTime;
        uint64 resolveAfter;
        MarketStatus status;
        uint256 winningTeamId;
        uint256 totalPool;
        uint256 feeBps;
    }

    struct MarketView {
        BettingMarket market;
        uint256[] outcomeTeamIds;
        uint256[] outcomePools;
    }

    IWorldCupViewer public immutable worldCupViewer;
    address public immutable guardian;
    address public immutable feeRecipient;
    uint256 public constant PROTOCOL_FEE_BPS = 100;
    address public operator;
    uint256 public marketCount;

    mapping(uint256 => BettingMarket) private markets;
    mapping(uint256 => uint256[]) private marketOutcomes;
    mapping(uint256 => mapping(uint256 => bool)) public validOutcome;
    mapping(uint256 => mapping(uint256 => uint256)) public outcomePool;
    mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public userBets;
    mapping(uint256 => mapping(address => bool)) public claimed;

    bool private entered;

    event OperatorUpdated(address indexed operator);
    event MarketCreated(uint256 indexed marketId, uint256 indexed viewerMatchId, MarketType marketType, string label, uint64 openTime, uint64 closeTime, uint64 resolveAfter, uint256 feeBps);
    event MarketOpened(uint256 indexed marketId);
    event MarketLocked(uint256 indexed marketId);
    event BetPlaced(uint256 indexed marketId, address indexed user, uint256 indexed teamId, uint256 amount);
    event BetWithdrawn(uint256 indexed marketId, address indexed user, uint256 indexed teamId, uint256 amount);
    event MarketResolved(uint256 indexed marketId, uint256 indexed winningTeamId, string teamName);
    event MarketCancelled(uint256 indexed marketId, string reason);
    event Claimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event Refunded(uint256 indexed marketId, address indexed user, uint256 amount);
    event FeePaid(uint256 indexed marketId, address indexed payer, address indexed recipient, uint256 amount);

    modifier onlyOperatorOrGuardian() {
        require(msg.sender == operator || msg.sender == guardian, "not operator/guardian");
        _;
    }

    modifier onlyGuardian() {
        require(msg.sender == guardian, "not guardian");
        _;
    }

    modifier nonReentrant() {
        require(!entered, "reentrant");
        entered = true;
        _;
        entered = false;
    }

    constructor(address _worldCupViewer, address _guardian, address _operator) {
        require(_worldCupViewer != address(0), "viewer required");
        require(_guardian != address(0), "guardian required");
        require(_operator != address(0), "operator required");
        worldCupViewer = IWorldCupViewer(_worldCupViewer);
        guardian = _guardian;
        feeRecipient = 0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e;
        operator = _operator;
    }

    function setOperator(address newOperator) external onlyOperatorOrGuardian {
        require(newOperator != address(0), "operator required");
        operator = newOperator;
        emit OperatorUpdated(newOperator);
    }

    function createMarket(
        uint256 viewerMatchId,
        MarketType marketType,
        string calldata label,
        uint64 openTime,
        uint64 closeTime,
        uint64 resolveAfter,
        uint256[] calldata outcomeTeamIds,
        uint256 feeBps
    ) external onlyOperatorOrGuardian returns (uint256 marketId) {
        require(viewerMatchId != 0, "match required");
        require(bytes(label).length != 0, "label required");
        require(outcomeTeamIds.length >= 2, "outcomes required");
        require(closeTime > openTime, "bad close");
        require(resolveAfter >= closeTime, "bad resolve");
        require(feeBps == PROTOCOL_FEE_BPS, "fee must be 1%");

        marketId = ++marketCount;
        BettingMarket storage m = markets[marketId];
        m.marketId = marketId;
        m.viewerMatchId = viewerMatchId;
        m.marketType = marketType;
        m.label = label;
        m.openTime = openTime;
        m.closeTime = closeTime;
        m.resolveAfter = resolveAfter;
        m.status = MarketStatus.Draft;
        m.feeBps = PROTOCOL_FEE_BPS;

        for (uint256 i = 0; i < outcomeTeamIds.length; i++) {
            uint256 teamId = outcomeTeamIds[i];
            require(teamId != 0, "zero outcome");
            require(!validOutcome[marketId][teamId], "duplicate outcome");
            validOutcome[marketId][teamId] = true;
            marketOutcomes[marketId].push(teamId);
        }

        emit MarketCreated(marketId, viewerMatchId, marketType, label, openTime, closeTime, resolveAfter, feeBps);
    }

    function openMarket(uint256 marketId) external onlyOperatorOrGuardian {
        BettingMarket storage m = markets[marketId];
        require(m.marketId != 0, "market missing");
        require(m.status == MarketStatus.Draft, "not draft");
        require(block.timestamp < m.closeTime, "already closed");
        m.status = MarketStatus.Open;
        emit MarketOpened(marketId);
    }

    function placeBet(uint256 marketId, uint256 teamId) external payable nonReentrant {
        BettingMarket storage m = markets[marketId];
        require(m.status == MarketStatus.Open, "not open");
        require(block.timestamp >= m.openTime, "not started");
        require(block.timestamp < m.closeTime, "closed");
        require(validOutcome[marketId][teamId], "invalid outcome");
        require(msg.value > 0, "amount required");

        uint256 fee = (msg.value * PROTOCOL_FEE_BPS) / 10000;
        uint256 netStake = msg.value - fee;
        require(netStake > 0, "stake too small");

        userBets[marketId][msg.sender][teamId] += netStake;
        outcomePool[marketId][teamId] += netStake;
        m.totalPool += netStake;
        if (fee != 0) {
            _send(payable(feeRecipient), fee);
            emit FeePaid(marketId, msg.sender, feeRecipient, fee);
        }
        emit BetPlaced(marketId, msg.sender, teamId, netStake);
    }

    /// @notice Lets users pull back part or all of an open bet before the market closes.
    /// @dev Only the net stake is withdrawable; the 1% fee was paid at entry and is not refunded.
    function withdrawBet(uint256 marketId, uint256 teamId, uint256 amount) external nonReentrant {
        BettingMarket storage m = markets[marketId];
        require(m.status == MarketStatus.Open, "not open");
        require(block.timestamp < m.closeTime, "closed");
        require(validOutcome[marketId][teamId], "invalid outcome");
        require(amount > 0, "amount required");
        uint256 stake = userBets[marketId][msg.sender][teamId];
        require(stake >= amount, "amount exceeds stake");

        userBets[marketId][msg.sender][teamId] = stake - amount;
        outcomePool[marketId][teamId] -= amount;
        m.totalPool -= amount;
        _send(payable(msg.sender), amount);
        emit BetWithdrawn(marketId, msg.sender, teamId, amount);
    }

    function lockMarket(uint256 marketId) external onlyOperatorOrGuardian {
        BettingMarket storage m = markets[marketId];
        require(m.status == MarketStatus.Open, "not open");
        require(block.timestamp >= m.closeTime, "too early");
        m.status = MarketStatus.Locked;
        emit MarketLocked(marketId);
    }

    /// @notice Permissionless WorldCupViewer settlement. No keeper/bot/operator is required.
    /// @dev Anyone can call this after `resolveAfter`; the winner still comes only from WorldCupViewer.
    function resolveMarket(uint256 marketId) external nonReentrant returns (uint256 winningTeamId, string memory teamName) {
        return _resolveMarket(marketId);
    }

    function _resolveMarket(uint256 marketId) private returns (uint256 winningTeamId, string memory teamName) {
        BettingMarket storage m = markets[marketId];
        require(m.status == MarketStatus.Locked || (m.status == MarketStatus.Open && block.timestamp >= m.closeTime), "not locked");
        require(block.timestamp >= m.resolveAfter, "too early");

        MatchViewResult memory r;
        if (m.marketType == MarketType.TournamentWinner) {
            r = worldCupViewer.getWorldCupWinner();
        } else if (m.marketType == MarketType.GroupWinner) {
            r = worldCupViewer.getGroupMatchWinners(m.viewerMatchId);
        } else {
            r = worldCupViewer.getMatchResult(m.viewerMatchId);
        }
        require(r.isResolved, "viewer unresolved");
        require(validOutcome[marketId][r.teamId], "winner not listed");

        m.status = MarketStatus.Resolved;
        m.winningTeamId = r.teamId;
        emit MarketResolved(marketId, r.teamId, r.teamName);
        return (r.teamId, r.teamName);
    }

    function claimable(uint256 marketId, address user) public view returns (uint256 amount) {
        return _claimable(marketId, user);
    }

    function _claimable(uint256 marketId, address user) private view returns (uint256 amount) {
        BettingMarket storage m = markets[marketId];
        if (m.status != MarketStatus.Resolved || claimed[marketId][user]) return 0;
        uint256 stake = userBets[marketId][user][m.winningTeamId];
        if (stake == 0) return 0;
        uint256 winningPool = outcomePool[marketId][m.winningTeamId];
        if (winningPool == 0) return 0;
        return (stake * m.totalPool) / winningPool;
    }

    function claim(uint256 marketId) external nonReentrant {
        BettingMarket storage m = markets[marketId];
        if (m.status != MarketStatus.Resolved) {
            _resolveMarket(marketId);
        }
        uint256 amount = _claimable(marketId, msg.sender);
        require(amount > 0, "nothing to claim");
        claimed[marketId][msg.sender] = true;
        _send(payable(msg.sender), amount);
        emit Claimed(marketId, msg.sender, amount);
    }

    function cancelMarket(uint256 marketId, string calldata reason) external onlyOperatorOrGuardian {
        BettingMarket storage m = markets[marketId];
        require(m.marketId != 0, "market missing");
        require(m.status != MarketStatus.Resolved, "resolved");
        m.status = MarketStatus.Cancelled;
        emit MarketCancelled(marketId, reason);
    }

    function refundable(uint256 marketId, address user) public view returns (uint256 amount) {
        BettingMarket storage m = markets[marketId];
        if (m.status != MarketStatus.Cancelled || claimed[marketId][user]) return 0;
        uint256[] storage outcomes = marketOutcomes[marketId];
        for (uint256 i = 0; i < outcomes.length; i++) {
            amount += userBets[marketId][user][outcomes[i]];
        }
    }

    function refund(uint256 marketId) external nonReentrant {
        uint256 amount = refundable(marketId, msg.sender);
        require(amount > 0, "nothing to refund");
        claimed[marketId][msg.sender] = true;
        _send(payable(msg.sender), amount);
        emit Refunded(marketId, msg.sender, amount);
    }


    function getMarket(uint256 marketId) external view returns (MarketView memory view_) {
        BettingMarket storage m = markets[marketId];
        require(m.marketId != 0, "market missing");
        uint256[] storage outcomes = marketOutcomes[marketId];
        uint256[] memory pools = new uint256[](outcomes.length);
        uint256[] memory ids = new uint256[](outcomes.length);
        for (uint256 i = 0; i < outcomes.length; i++) {
            ids[i] = outcomes[i];
            pools[i] = outcomePool[marketId][outcomes[i]];
        }
        view_ = MarketView({market: m, outcomeTeamIds: ids, outcomePools: pools});
    }

    function getUserBet(uint256 marketId, address user, uint256 teamId) external view returns (uint256) {
        return userBets[marketId][user][teamId];
    }

    function getTeamName(uint256 teamId) external view returns (string memory) {
        return worldCupViewer.getTeamName(teamId);
    }

    function _send(address payable recipient, uint256 amount) private {
        (bool ok, ) = recipient.call{value: amount}("");
        require(ok, "transfer failed");
    }
}
