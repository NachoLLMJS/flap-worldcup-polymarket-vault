// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

struct MatchViewResult {
    uint256 matchId;
    string matchName;
    bool isResolved;
    uint256 teamId;
    string teamName;
}

interface IWorldCupViewer {
    function getWorldCupWinner() external view returns (MatchViewResult memory);
    function getGroupMatchWinners(uint256 matchId) external view returns (MatchViewResult memory);
    function getMatchResult(uint256 matchId) external view returns (MatchViewResult memory);
    function getTeamName(uint256 teamId) external view returns (string memory);
}
