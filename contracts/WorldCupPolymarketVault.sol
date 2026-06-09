// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VaultBaseV2} from "./flap/VaultBaseV2.sol";
import {VaultFactoryBaseV2} from "./flap/VaultFactoryBaseV2.sol";
import {FieldDescriptor, ApproveAction, VaultMethodSchema, VaultUISchema, VaultDataSchema, FactoryPolicy} from "./flap/IVaultSchemasV1.sol";
import {IVaultFactoryValidationV2} from "./flap/IVaultFactory.sol";

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

interface IBettingRewardReceiver {
    function depositTaxRewards() external payable;
}

interface IBettingVaultView {
    function marketCount() external view returns (uint256);
    function totalRewardShares() external view returns (uint256);
    function totalTaxRewardsReceived() external view returns (uint256);
    function claimableTaxRewards(address user) external view returns (uint256);
}

/// @notice Flap V2-compatible World Cup metadata tax vault.
/// @dev This is the Flap-submitted vault surface. It only receives/holds Flap tax revenue and stores WorldCup/Polymarket metadata.
///      The standalone betting escrow lives separately under foundry/worldcup-betting and is intentionally not part of this contract.
contract WorldCupPolymarketVault is VaultBaseV2 {
    struct MarketMapping {
        uint256 matchId;
        uint256 teamId;
        bytes32 polymarketConditionId;
        string marketSlug;
        string label;
        uint64 matchStartTime;
        uint64 bettingCloseTime;
        uint64 settlementEarliestTime;
        bool active;
    }

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    address public taxToken;
    IWorldCupViewer public worldCupViewer;
    address public bettingVault;
    address public operator;
    bool private initialized;
    uint256 private reentrancyStatus;

    uint256 public totalRevenueReceived;
    uint256 public lastSettlementMatchId;
    uint256 public lastSettlementTeamId;
    string public lastSettlementTeamName;
    bool public lastSettlementResolved;

    MarketMapping[] private markets;

    event RevenueReceived(address indexed from, uint256 amount);
    event Initialized(address indexed taxToken, address indexed guardian, address indexed worldCupViewer, address operator);
    event OperatorUpdated(address indexed operator);
    event BettingVaultUpdated(address indexed bettingVault);
    event TaxRewardsForwarded(address indexed bettingVault, uint256 amount);
    event MarketUpserted(uint256 indexed index, uint256 indexed matchId, uint256 indexed teamId, bytes32 conditionId, string marketSlug, uint64 matchStartTime, uint64 bettingCloseTime, uint64 settlementEarliestTime);
    event SettlementRefreshed(uint256 indexed matchId, bool isResolved, uint256 indexed teamId, string teamName);
    event EmergencyWithdrawNative(address indexed to, uint256 amount);
    event EmergencyWithdrawToken(address indexed token, address indexed to, uint256 amount);

    modifier onlyOperatorOrGuardian() {
        require(msg.sender == operator || msg.sender == _getGuardian(), "not operator or guardian");
        _;
    }

    modifier nonReentrant() {
        require(reentrancyStatus != _ENTERED, "reentrant call");
        reentrancyStatus = _ENTERED;
        _;
        reentrancyStatus = _NOT_ENTERED;
    }

    constructor() {
        initialized = true;
        reentrancyStatus = _NOT_ENTERED;
    }

    function initialize(address _taxToken, address _guardian, address _worldCupViewer, address _operator, address _bettingVault) external {
        require(!initialized, "already initialized");
        require(_taxToken != address(0), "taxToken required");
        require(_guardian == _getGuardian(), "guardian mismatch");
        require(_worldCupViewer != address(0), "viewer required");
        require(_operator != address(0), "operator required");
        initialized = true;
        reentrancyStatus = _NOT_ENTERED;
        taxToken = _taxToken;
        worldCupViewer = IWorldCupViewer(_worldCupViewer);
        operator = _operator;
        bettingVault = _bettingVault;
        emit Initialized(_taxToken, _guardian, _worldCupViewer, _operator);
        if (_bettingVault != address(0)) emit BettingVaultUpdated(_bettingVault);
    }

    receive() external payable {
        if (msg.value == 0) return;
        totalRevenueReceived += msg.value;
        emit RevenueReceived(msg.sender, msg.value);
    }

    function guardian() external view returns (address) {
        return _getGuardian();
    }

    function description() public view override returns (string memory) {
        if (lastSettlementResolved) {
            return string.concat(
                "World Cup-only Polymarket metadata vault. Revenue held: ",
                _uintToString(address(this).balance),
                " wei. Latest resolved team: ",
                lastSettlementTeamName,
                "."
            );
        }
        return string.concat(
            "World Cup-only Polymarket metadata vault. Revenue held: ",
            _uintToString(address(this).balance),
            " wei. Winner/group settlement is still pending."
        );
    }

    function setOperator(address newOperator) external onlyOperatorOrGuardian {
        require(newOperator != address(0), "operator required");
        operator = newOperator;
        emit OperatorUpdated(newOperator);
    }

    function setBettingVault(address newBettingVault) external onlyOperatorOrGuardian {
        bettingVault = newBettingVault;
        emit BettingVaultUpdated(newBettingVault);
    }

    /// @notice Forwards BNB tax revenue held by this Flap vault into the betting vault reward pool.
    /// @dev The betting vault allocates received BNB pro-rata to users who have reward shares from net betting stake.
    function forwardTaxRewardsToBetting(uint256 amountWei) external onlyOperatorOrGuardian nonReentrant {
        require(bettingVault != address(0), "betting vault required");
        require(amountWei > 0, "amount required");
        require(amountWei <= address(this).balance, "insufficient balance");
        IBettingRewardReceiver(bettingVault).depositTaxRewards{value: amountWei}();
        emit TaxRewardsForwarded(bettingVault, amountWei);
    }

    function upsertMarket(
        uint256 index,
        uint256 matchId,
        uint256 teamId,
        bytes32 polymarketConditionId,
        string calldata marketSlug,
        string calldata label,
        uint64 matchStartTime,
        uint64 bettingCloseTime,
        uint64 settlementEarliestTime,
        bool active
    ) external onlyOperatorOrGuardian {
        require(bytes(marketSlug).length <= 160, "slug too long");
        require(bytes(label).length <= 160, "label too long");
        MarketMapping memory item = MarketMapping({
            matchId: matchId,
            teamId: teamId,
            polymarketConditionId: polymarketConditionId,
            marketSlug: marketSlug,
            label: label,
            matchStartTime: matchStartTime,
            bettingCloseTime: bettingCloseTime,
            settlementEarliestTime: settlementEarliestTime,
            active: active
        });

        if (index == markets.length) {
            markets.push(item);
        } else {
            require(index < markets.length, "index gap");
            markets[index] = item;
        }
        emit MarketUpserted(index, matchId, teamId, polymarketConditionId, marketSlug, matchStartTime, bettingCloseTime, settlementEarliestTime);
    }

    function refreshSettlement(uint256 matchId) external onlyOperatorOrGuardian returns (uint256 resultMatchId, string memory matchName, bool isResolved, uint256 teamId, string memory teamName) {
        MatchViewResult memory result;
        if (matchId == 1) {
            result = worldCupViewer.getWorldCupWinner();
        } else if (matchId >= 2 && matchId <= 13) {
            result = worldCupViewer.getGroupMatchWinners(matchId);
        } else {
            result = worldCupViewer.getMatchResult(matchId);
        }

        lastSettlementMatchId = result.matchId;
        lastSettlementResolved = result.isResolved;
        lastSettlementTeamId = result.teamId;
        lastSettlementTeamName = result.teamName;
        emit SettlementRefreshed(result.matchId, result.isResolved, result.teamId, result.teamName);
        return (result.matchId, result.matchName, result.isResolved, result.teamId, result.teamName);
    }

    /// @notice Guardian-only emergency recovery for all BNB held by this non-upgradeable vault.
    function emergencyWithdrawNative(address to) external onlyGuardian nonReentrant {
        require(to != address(0), "recipient required");
        uint256 bal = address(this).balance;
        (bool ok, ) = payable(to).call{value: bal}("");
        require(ok, "native transfer failed");
        emit EmergencyWithdrawNative(to, bal);
    }

    /// @notice Guardian-only emergency recovery for all of an ERC-20 token held by this non-upgradeable vault.
    function emergencyWithdrawToken(address token, address to) external onlyGuardian nonReentrant {
        require(token != address(0), "token required");
        require(to != address(0), "recipient required");
        uint256 bal = _tokenBalance(token);
        _safeTransfer(token, to, bal);
        emit EmergencyWithdrawToken(token, to, bal);
    }

    function getWorldCupWinner() external view returns (uint256 matchId, string memory matchName, bool isResolved, uint256 teamId, string memory teamName) {
        MatchViewResult memory result = worldCupViewer.getWorldCupWinner();
        return (result.matchId, result.matchName, result.isResolved, result.teamId, result.teamName);
    }

    function getGroupWinner(uint256 matchId) external view returns (uint256 resultMatchId, string memory matchName, bool isResolved, uint256 teamId, string memory teamName) {
        MatchViewResult memory result = worldCupViewer.getGroupMatchWinners(matchId);
        return (result.matchId, result.matchName, result.isResolved, result.teamId, result.teamName);
    }

    function getMatchResult(uint256 matchId) external view returns (uint256 resultMatchId, string memory matchName, bool isResolved, uint256 teamId, string memory teamName) {
        MatchViewResult memory result = worldCupViewer.getMatchResult(matchId);
        return (result.matchId, result.matchName, result.isResolved, result.teamId, result.teamName);
    }

    function getTeamName(uint256 teamId) external view returns (string memory) {
        return worldCupViewer.getTeamName(teamId);
    }

    function marketCount() external view returns (uint256) {
        return markets.length;
    }

    function getMarket(uint256 index) external view returns (MarketMapping memory) {
        require(index < markets.length, "market missing");
        return markets[index];
    }

    function getMarkets(uint256 offset, uint256 limit) external view returns (MarketMapping[] memory page) {
        require(limit <= 100, "limit too high");
        if (offset >= markets.length) return new MarketMapping[](0);
        uint256 end = offset + limit;
        if (end > markets.length) end = markets.length;
        page = new MarketMapping[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = markets[i];
        }
    }

    function getMarketTiming(uint256 index) external view returns (uint64 matchStartTime, uint64 bettingCloseTime, uint64 settlementEarliestTime) {
        require(index < markets.length, "market missing");
        MarketMapping storage item = markets[index];
        return (item.matchStartTime, item.bettingCloseTime, item.settlementEarliestTime);
    }

    function bettingMarketCount() external view returns (uint256) {
        if (bettingVault == address(0)) return 0;
        return IBettingVaultView(bettingVault).marketCount();
    }

    function totalBettingRewardShares() external view returns (uint256) {
        if (bettingVault == address(0)) return 0;
        return IBettingVaultView(bettingVault).totalRewardShares();
    }

    function totalTaxRewardsReceivedByBetting() external view returns (uint256) {
        if (bettingVault == address(0)) return 0;
        return IBettingVaultView(bettingVault).totalTaxRewardsReceived();
    }

    function claimableBettingTaxRewards(address user) external view returns (uint256) {
        if (bettingVault == address(0)) return 0;
        return IBettingVaultView(bettingVault).claimableTaxRewards(user);
    }

    function vaultUISchema() public pure override returns (VaultUISchema memory schema) {
        schema.vaultType = "WorldCupPolymarketVault";
        schema.description = "World Cup prediction vault for Flap users: shows BNB tax revenue, betting reward stats, WorldCupViewer results, and clean market metadata. Admin/emergency controls are intentionally hidden from the user UI.";
        schema.methods = new VaultMethodSchema[](18);

        schema.methods[0] = _method("description", "Live status banner with revenue held and latest World Cup settlement state.", new FieldDescriptor[](0), _fields1("summary", "string", "Human-readable vault status", 0), false, false, false);
        schema.methods[1] = _method("totalRevenueReceived", "Total BNB tax revenue received by this Flap vault.", new FieldDescriptor[](0), _fields1("amountWei", "uint256", "Total BNB revenue received", 18), false, false, false);
        schema.methods[2] = _method("taxToken", "Flap token connected to this vault.", new FieldDescriptor[](0), _fields1("taxToken", "address", "Connected Flap tax token", 0), false, false, false);
        schema.methods[3] = _method("bettingVault", "Betting vault where users place predictions and claim tax-reward distributions.", new FieldDescriptor[](0), _fields1("bettingVault", "address", "Connected betting vault", 0), false, false, false);

        schema.methods[4] = _method("bettingMarketCount", "Number of betting markets available in the connected betting vault.", new FieldDescriptor[](0), _fields1("count", "uint256", "Betting market count", 0), false, false, false);
        schema.methods[5] = _method("totalBettingRewardShares", "Total net bettor stake currently earning pro-rata tax rewards.", new FieldDescriptor[](0), _fields1("shares", "uint256", "Total reward shares", 18), false, false, false);
        schema.methods[6] = _method("totalTaxRewardsReceivedByBetting", "Total BNB tax rewards forwarded to the betting reward pool.", new FieldDescriptor[](0), _fields1("amountWei", "uint256", "Tax rewards received by betting vault", 18), false, false, false);
        schema.methods[7] = _method("claimableBettingTaxRewards", "Check how much BNB tax reward a wallet can claim in the betting vault.", _fields1("user", "address", "Wallet to check", 0), _fields1("amountWei", "uint256", "Claimable BNB tax rewards", 18), false, false, false);

        schema.methods[8] = _method("lastSettlementResolved", "Whether the latest stored WorldCupViewer settlement refresh is resolved.", new FieldDescriptor[](0), _fields1("isResolved", "bool", "Latest settlement resolved", 0), false, false, false);
        schema.methods[9] = _method("lastSettlementTeamName", "Team name from the latest stored settlement refresh.", new FieldDescriptor[](0), _fields1("teamName", "string", "Latest resolved team name", 0), false, false, false);
        schema.methods[10] = _method("getWorldCupWinner", "Read the current 2026 FIFA World Cup champion result from WorldCupViewer.", new FieldDescriptor[](0), _matchOutputs(), false, false, false);
        schema.methods[11] = _method("getGroupWinner", "Read a Group A-L winner from WorldCupViewer. Group A starts at matchId 2; Group L is 13.", _fields1("matchId", "uint256", "WorldCupViewer group match ID, 2 through 13", 0), _matchOutputs(), false, false, false);
        schema.methods[12] = _method("getMatchResult", "Read any WorldCupViewer match result by matchId.", _fields1("matchId", "uint256", "WorldCupViewer match ID", 0), _matchOutputs(), false, false, false);
        schema.methods[13] = _method("getTeamName", "Resolve a WorldCupViewer team ID into a team name. Reserved: 49 = others, 50 = draw.", _fields1("teamId", "uint256", "WorldCupViewer team ID", 0), _fields1("teamName", "string", "Team name or reserved label", 0), false, false, false);

        schema.methods[14] = _method("marketCount", "Number of Polymarket/World Cup metadata mappings stored in this Flap vault.", new FieldDescriptor[](0), _fields1("count", "uint256", "Metadata market count", 0), false, false, false);
        schema.methods[15] = _method("getMarket", "Read one clean World Cup market mapping: label, Polymarket slug, team, timing, and active flag.", _fields1("index", "uint256", "Market mapping index", 0), _marketOutputs(), false, false, false);
        schema.methods[16] = _method("getMarkets", "Read a paginated table of World Cup market mappings. Limit is capped at 100.", _fields2("offset", "uint256", "First index to return", 0, "limit", "uint256", "Maximum items to return; capped at 100", 0), _marketOutputs(), false, true, false);
        schema.methods[17] = _method("getMarketTiming", "Read match start, betting close, and earliest settlement timestamps for one market.", _fields1("index", "uint256", "Market mapping index", 0), _marketTimingOutputs(), false, false, false);
    }

    function _method(
        string memory name,
        string memory desc,
        FieldDescriptor[] memory inputs,
        FieldDescriptor[] memory outputs,
        bool isInputArray,
        bool isOutputArray,
        bool isWriteMethod
    ) private pure returns (VaultMethodSchema memory m) {
        m.name = name;
        m.description = desc;
        m.inputs = inputs;
        m.outputs = outputs;
        m.approvals = new ApproveAction[](0);
        m.isInputArray = isInputArray;
        m.isOutputArray = isOutputArray;
        m.isWriteMethod = isWriteMethod;
    }

    function _field(string memory name, string memory fieldType, string memory desc, uint8 decimals) private pure returns (FieldDescriptor memory) {
        return FieldDescriptor({name: name, fieldType: fieldType, description: desc, decimals: decimals});
    }

    function _fields1(string memory n1, string memory t1, string memory d1, uint8 dec1) private pure returns (FieldDescriptor[] memory fields) {
        fields = new FieldDescriptor[](1);
        fields[0] = _field(n1, t1, d1, dec1);
    }

    function _fields2(string memory n1, string memory t1, string memory d1, uint8 dec1, string memory n2, string memory t2, string memory d2, uint8 dec2) private pure returns (FieldDescriptor[] memory fields) {
        fields = new FieldDescriptor[](2);
        fields[0] = _field(n1, t1, d1, dec1);
        fields[1] = _field(n2, t2, d2, dec2);
    }

    function _matchOutputs() private pure returns (FieldDescriptor[] memory fields) {
        fields = new FieldDescriptor[](5);
        fields[0] = _field("matchId", "uint256", "WorldCupViewer match ID", 0);
        fields[1] = _field("matchName", "string", "Human-readable match name", 0);
        fields[2] = _field("isResolved", "bool", "Whether the oracle/viewer has settled this result", 0);
        fields[3] = _field("teamId", "uint256", "Winning team ID; 0 pending, 49 others, 50 draw", 0);
        fields[4] = _field("teamName", "string", "Winning team name, tie message, others, or empty while pending", 0);
    }

    function _marketOutputs() private pure returns (FieldDescriptor[] memory fields) {
        fields = new FieldDescriptor[](9);
        fields[0] = _field("matchId", "uint256", "WorldCupViewer match/group/champion ID", 0);
        fields[1] = _field("teamId", "uint256", "WorldCupViewer team ID tied to this market", 0);
        fields[2] = _field("polymarketConditionId", "bytes32", "Polymarket condition ID metadata", 0);
        fields[3] = _field("marketSlug", "string", "Polymarket market slug or URL path", 0);
        fields[4] = _field("label", "string", "Human-readable market label/thesis", 0);
        fields[5] = _field("matchStartTime", "time", "Configurable Unix timestamp for scheduled match start; 0 if unknown", 0);
        fields[6] = _field("bettingCloseTime", "time", "Configurable Unix timestamp when betting UI should lock; 0 if unknown", 0);
        fields[7] = _field("settlementEarliestTime", "time", "Configurable earliest timestamp to attempt refreshSettlement; 0 if unknown", 0);
        fields[8] = _field("active", "bool", "Whether this mapping is currently active", 0);
    }

    function _marketTimingOutputs() private pure returns (FieldDescriptor[] memory fields) {
        fields = new FieldDescriptor[](3);
        fields[0] = _field("matchStartTime", "time", "Configurable Unix timestamp for scheduled match start; 0 if unknown", 0);
        fields[1] = _field("bettingCloseTime", "time", "Configurable Unix timestamp when betting UI should lock; 0 if unknown", 0);
        fields[2] = _field("settlementEarliestTime", "time", "Configurable earliest timestamp to attempt refreshSettlement; 0 if unknown", 0);
    }

    function _upsertInputs() private pure returns (FieldDescriptor[] memory fields) {
        fields = new FieldDescriptor[](10);
        fields[0] = _field("index", "uint256", "Existing index to update, or marketCount() to append", 0);
        fields[1] = _field("matchId", "uint256", "WorldCupViewer match/group/champion ID", 0);
        fields[2] = _field("teamId", "uint256", "WorldCupViewer team ID", 0);
        fields[3] = _field("polymarketConditionId", "bytes32", "Polymarket condition ID metadata", 0);
        fields[4] = _field("marketSlug", "string", "Polymarket market slug or URL path; max 160 bytes", 0);
        fields[5] = _field("label", "string", "UI label or short thesis; max 160 bytes", 0);
        fields[6] = _field("matchStartTime", "time", "Configurable Unix timestamp for scheduled match start; 0 if unknown", 0);
        fields[7] = _field("bettingCloseTime", "time", "Configurable Unix timestamp when betting UI should lock; 0 if unknown", 0);
        fields[8] = _field("settlementEarliestTime", "time", "Configurable earliest timestamp to attempt refreshSettlement; 0 if unknown", 0);
        fields[9] = _field("active", "bool", "Enable/disable this mapping", 0);
    }

    function _tokenBalance(address token) private view returns (uint256 bal) {
        (bool ok, bytes memory data) = token.staticcall(abi.encodeWithSignature("balanceOf(address)", address(this)));
        require(ok && data.length >= 32, "balance query failed");
        bal = abi.decode(data, (uint256));
    }

    function _safeTransfer(address token, address to, uint256 amount) private {
        (bool ok, bytes memory data) = token.call(abi.encodeWithSignature("transfer(address,uint256)", to, amount));
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "token transfer failed");
    }

    function _uintToString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

/// @notice Flap-compatible V2.2 vault factory for launching tax tokens with an EIP-1167 clone of WorldCupPolymarketVault.
/// @dev VaultPortal predicts the tax-token address and passes it into newVault() before the token is deployed.
contract WorldCupPolymarketVaultFactory is VaultFactoryBaseV2 {
    struct LaunchConfig {
        address worldCupViewer;
        address operator;
        address bettingVault;
    }

    address public constant BSC_WORLD_CUP_VIEWER = 0x00036192958C2aaAF9F445d3Cdc2979995EA333e;
    address public immutable implementation;

    event VaultDeployed(address indexed vault, address indexed taxToken, address indexed creator, address guardian, address worldCupViewer, address operator);

    modifier onlyVaultPortal() {
        require(msg.sender == _getVaultPortal(), "only VaultPortal");
        _;
    }

    constructor(address _implementation) {
        require(_implementation != address(0), "implementation required");
        implementation = _implementation;
    }

    function isQuoteTokenSupported(address quoteToken) external pure override returns (bool supported) {
        return quoteToken == address(0);
    }

    function vaultDataSchema() public pure override returns (VaultDataSchema memory schema) {
        schema.description = "Launches a Flap V2 WorldCupPolymarketVault clone for the predicted Flap tax token. On BNB mainnet, zero worldCupViewer uses Flap's WorldCupViewer. On testnet, provide a testnet viewer/mock. Zero operator uses the token creator.";
        schema.fields = new FieldDescriptor[](3);
        schema.fields[0] = FieldDescriptor("worldCupViewer", "address", "Optional WorldCupViewer address; on BNB mainnet zero address uses the Flap WorldCupViewer default", 0);
        schema.fields[1] = FieldDescriptor("operator", "address", "Optional day-to-day operator; zero address falls back to token creator", 0);
        schema.fields[2] = FieldDescriptor("bettingVault", "address", "Optional standalone betting vault that receives BNB tax rewards for bettors", 0);
        schema.isArray = false;
    }

    function tokenCreationPolicies() public pure override returns (FactoryPolicy[] memory policies) {
        policies = new FactoryPolicy[](1);
        policies[0] = FactoryPolicy({
            target: "quoteToken",
            operator: "eq",
            value: abi.encode(address(0)),
            description: "WorldCupPolymarketVault supports native BNB quote-token launches only."
        });
    }

    function validateLaunchConfig(bytes calldata vaultData) public view returns (LaunchConfig memory config) {
        if (vaultData.length == 0) {
            return LaunchConfig({worldCupViewer: _defaultWorldCupViewer(), operator: address(0), bettingVault: address(0)});
        }
        config = abi.decode(vaultData, (LaunchConfig));
        if (config.worldCupViewer == address(0)) {
            config.worldCupViewer = _defaultWorldCupViewer();
        }
    }

    function newVault(address taxToken, address quoteToken, address creator, bytes calldata vaultData) external override onlyVaultPortal returns (address vault) {
        require(taxToken != address(0), "taxToken required");
        require(quoteToken == address(0), "quoteToken must be BNB");
        require(creator != address(0), "creator required");
        LaunchConfig memory config = validateLaunchConfig(vaultData);
        address guardianAddress = _getGuardian();
        address operatorAddress = config.operator == address(0) ? creator : config.operator;
        vault = _clone(implementation);
        WorldCupPolymarketVault(payable(vault)).initialize(taxToken, guardianAddress, config.worldCupViewer, operatorAddress, config.bettingVault);
        emit VaultDeployed(vault, taxToken, creator, guardianAddress, config.worldCupViewer, operatorAddress);
    }

    function _validateBeforeLaunch(IVaultFactoryValidationV2.LaunchValidationDataV1 memory data) internal pure override returns (bool success, string memory reason) {
        if (data.quoteToken != address(0)) {
            return (false, "quoteToken must be BNB");
        }
        return (true, "");
    }

    function _defaultWorldCupViewer() internal view returns (address) {
        if (block.chainid == 56) return BSC_WORLD_CUP_VIEWER;
        revert("viewer required on testnet");
    }

    function _clone(address target) internal returns (address clone) {
        bytes20 targetBytes = bytes20(target);
        bytes memory creationCode = abi.encodePacked(
            hex"3d602d80600a3d3981f3",
            hex"363d3d373d3d3d363d73",
            targetBytes,
            hex"5af43d82803e903d91602b57fd5bf3"
        );
        assembly {
            clone := create(0, add(creationCode, 0x20), mload(creationCode))
        }
        require(clone != address(0), "clone failed");
    }
}
