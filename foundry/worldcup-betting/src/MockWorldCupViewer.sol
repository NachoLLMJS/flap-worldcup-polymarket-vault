// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IWorldCupViewer, MatchViewResult} from "./interfaces/IWorldCupViewer.sol";

/// @notice Testnet-only WorldCupViewer-compatible oracle stub.
/// @dev Use this on BNB Testnet if Flap has not deployed the real WorldCupViewer there yet.
///      Do not use as mainnet settlement truth.
contract MockWorldCupViewer is IWorldCupViewer {
    address public owner;

    mapping(uint256 => string) private teamNames;
    mapping(uint256 => MatchViewResult) private matchResults;
    mapping(uint256 => MatchViewResult) private groupResults;
    MatchViewResult private worldCupWinner;

    event OwnerUpdated(address indexed owner);
    event TeamNameSet(uint256 indexed teamId, string name);
    event MatchResultSet(uint256 indexed matchId, bool isResolved, uint256 indexed teamId, string teamName);
    event GroupWinnerSet(uint256 indexed matchId, bool isResolved, uint256 indexed teamId, string teamName);
    event WorldCupWinnerSet(uint256 indexed matchId, bool isResolved, uint256 indexed teamId, string teamName);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(address _owner) {
        require(_owner != address(0), "owner required");
        owner = _owner;
        emit OwnerUpdated(_owner);
        _seedTeamNames();
        worldCupWinner = MatchViewResult({matchId: 1, matchName: "2026 FIFA World Cup Winner", isResolved: false, teamId: 0, teamName: ""});
    }

    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "owner required");
        owner = newOwner;
        emit OwnerUpdated(newOwner);
    }

    function setTeamName(uint256 teamId, string calldata name) external onlyOwner {
        require(teamId != 0, "team required");
        teamNames[teamId] = name;
        emit TeamNameSet(teamId, name);
    }

    function setMatchResult(uint256 matchId, string calldata matchName, bool isResolved, uint256 teamId) external onlyOwner {
        string memory name = teamNames[teamId];
        matchResults[matchId] = MatchViewResult({matchId: matchId, matchName: matchName, isResolved: isResolved, teamId: teamId, teamName: name});
        emit MatchResultSet(matchId, isResolved, teamId, name);
    }

    function setGroupWinner(uint256 matchId, string calldata matchName, bool isResolved, uint256 teamId) external onlyOwner {
        string memory name = teamNames[teamId];
        groupResults[matchId] = MatchViewResult({matchId: matchId, matchName: matchName, isResolved: isResolved, teamId: teamId, teamName: name});
        emit GroupWinnerSet(matchId, isResolved, teamId, name);
    }

    function setWorldCupWinner(bool isResolved, uint256 teamId) external onlyOwner {
        string memory name = teamNames[teamId];
        worldCupWinner = MatchViewResult({matchId: 1, matchName: "2026 FIFA World Cup Winner", isResolved: isResolved, teamId: teamId, teamName: name});
        emit WorldCupWinnerSet(1, isResolved, teamId, name);
    }

    function getWorldCupWinner() external view returns (MatchViewResult memory) {
        return worldCupWinner;
    }

    function getGroupMatchWinners(uint256 matchId) external view returns (MatchViewResult memory) {
        MatchViewResult memory result = groupResults[matchId];
        if (result.matchId == 0) {
            return MatchViewResult({matchId: matchId, matchName: _defaultGroupName(matchId), isResolved: false, teamId: 0, teamName: ""});
        }
        return result;
    }

    function getMatchResult(uint256 matchId) external view returns (MatchViewResult memory) {
        MatchViewResult memory result = matchResults[matchId];
        if (result.matchId == 0) {
            return MatchViewResult({matchId: matchId, matchName: _defaultMatchName(matchId), isResolved: false, teamId: 0, teamName: ""});
        }
        return result;
    }

    function getTeamName(uint256 teamId) external view returns (string memory) {
        return teamNames[teamId];
    }

    function _defaultGroupName(uint256 matchId) private pure returns (string memory) {
        if (matchId >= 2 && matchId <= 13) return "World Cup Group Winner";
        return "World Cup Group";
    }

    function _defaultMatchName(uint256) private pure returns (string memory) {
        return "World Cup Match";
    }

    function _seedTeamNames() private {
        teamNames[1] = "Mexico";
        teamNames[2] = "South Africa";
        teamNames[3] = "South Korea";
        teamNames[4] = "Saudi Arabia";
        teamNames[5] = "Canada";
        teamNames[6] = "New Zealand";
        teamNames[7] = "Qatar";
        teamNames[8] = "Switzerland";
        teamNames[9] = "Brazil";
        teamNames[10] = "Morocco";
        teamNames[11] = "Tunisia";
        teamNames[12] = "Scotland";
        teamNames[13] = "USA";
        teamNames[14] = "Paraguay";
        teamNames[15] = "Australia";
        teamNames[16] = "Algeria";
        teamNames[17] = "Germany";
        teamNames[18] = "Austria";
        teamNames[19] = "Ivory Coast";
        teamNames[20] = "Ecuador";
        teamNames[21] = "Netherlands";
        teamNames[22] = "Japan";
        teamNames[23] = "Ghana";
        teamNames[24] = "Panama";
        teamNames[25] = "Belgium";
        teamNames[26] = "Egypt";
        teamNames[27] = "Iran";
        teamNames[28] = "Uzbekistan";
        teamNames[29] = "Spain";
        teamNames[30] = "Uruguay";
        teamNames[31] = "Costa Rica";
        teamNames[32] = "Uruguay";
        teamNames[33] = "France";
        teamNames[34] = "Senegal";
        teamNames[35] = "Serbia";
        teamNames[36] = "Norway";
        teamNames[37] = "Argentina";
        teamNames[38] = "Denmark";
        teamNames[39] = "Colombia";
        teamNames[40] = "Nigeria";
        teamNames[41] = "Portugal";
        teamNames[42] = "Turkey";
        teamNames[43] = "Poland";
        teamNames[44] = "Colombia";
        teamNames[45] = "England";
        teamNames[46] = "Croatia";
        teamNames[47] = "Cameroon";
        teamNames[48] = "Jamaica";
        teamNames[49] = "Others";
        teamNames[50] = "Draw";
    }
}
