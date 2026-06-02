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

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @notice Minimal Flap-style UI schema structs, mirrored from IVaultSchemasV1 docs.
/// In production, replace these local declarations with imports from the official FlapTaxVaults repo.
contract WorldCupPolymarketVault {
    struct FieldDescriptor {
        string name;
        string fieldType;
        string description;
        uint8 decimals;
    }

    struct ApproveAction {
        string tokenType;
        string amountFieldName;
    }

    struct VaultMethodSchema {
        string name;
        string description;
        FieldDescriptor[] inputs;
        FieldDescriptor[] outputs;
        ApproveAction[] approvals;
        bool isInputArray;
        bool isOutputArray;
        bool isWriteMethod;
    }

    struct VaultUISchema {
        string vaultType;
        string description;
        VaultMethodSchema[] methods;
    }

    struct VaultDataSchema {
        string description;
        FieldDescriptor[] fields;
        bool isArray;
        string factoryNotes;
    }

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

    address public taxToken;
    address public guardian;
    IWorldCupViewer public worldCupViewer;

    address public operator;
    bool private initialized;
    uint256 public totalRevenueReceived;
    uint256 public lastSettlementMatchId;
    uint256 public lastSettlementTeamId;
    string public lastSettlementTeamName;
    bool public lastSettlementResolved;

    MarketMapping[] private markets;

    event RevenueReceived(address indexed from, uint256 amount);
    event Initialized(address indexed taxToken, address indexed guardian, address indexed worldCupViewer, address operator);
    event OperatorUpdated(address indexed operator);
    event MarketUpserted(uint256 indexed index, uint256 indexed matchId, uint256 indexed teamId, bytes32 conditionId, string marketSlug, uint64 matchStartTime, uint64 bettingCloseTime, uint64 settlementEarliestTime);
    event SettlementRefreshed(uint256 indexed matchId, bool isResolved, uint256 indexed teamId, string teamName);
    event EmergencyNativeRecovered(address indexed guardian, address indexed recipient, uint256 amountWei);
    event EmergencyTaxTokenRecovered(address indexed guardian, address indexed recipient, address indexed token, uint256 amount);

    modifier onlyOperatorOrGuardian() {
        require(msg.sender == operator || msg.sender == guardian, "not operator or guardian");
        _;
    }

    modifier onlyGuardian() {
        require(msg.sender == guardian, "not guardian");
        _;
    }

    constructor() {
        initialized = true;
    }

    function initialize(address _taxToken, address _guardian, address _worldCupViewer, address _operator) external {
        require(!initialized, "already initialized");
        require(_guardian != address(0), "guardian required");
        require(_worldCupViewer != address(0), "viewer required");
        require(_operator != address(0), "operator required");
        initialized = true;
        taxToken = _taxToken;
        guardian = _guardian;
        worldCupViewer = IWorldCupViewer(_worldCupViewer);
        operator = _operator;
        emit Initialized(_taxToken, _guardian, _worldCupViewer, _operator);
    }

    receive() external payable {
        if (msg.value == 0) return;
        totalRevenueReceived += msg.value;
        emit RevenueReceived(msg.sender, msg.value);
    }

    function description() external view returns (string memory) {
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

    /// @notice Guardian-only emergency recovery for BNB/tax revenue held by this vault.
    /// @dev Intended for stuck revenue or shutdown scenarios. It must not be used to bypass settled user claims in a future betting escrow version.
    function recoverNative(address payable recipient, uint256 amountWei) external onlyGuardian {
        require(recipient != address(0), "recipient required");
        require(amountWei <= address(this).balance, "insufficient native balance");
        (bool ok, ) = recipient.call{value: amountWei}("");
        require(ok, "native transfer failed");
        emit EmergencyNativeRecovered(msg.sender, recipient, amountWei);
    }

    /// @notice Guardian-only emergency recovery for the configured Flap tax token.
    /// @dev This recovers only the immutable taxToken configured at launch, not arbitrary user assets.
    function recoverTaxToken(address recipient, uint256 amount) external onlyGuardian {
        require(taxToken != address(0), "tax token not configured");
        require(recipient != address(0), "recipient required");
        require(amount <= IERC20(taxToken).balanceOf(address(this)), "insufficient token balance");
        require(IERC20(taxToken).transfer(recipient, amount), "token transfer failed");
        emit EmergencyTaxTokenRecovered(msg.sender, recipient, taxToken, amount);
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

    function vaultUISchema() external pure returns (VaultUISchema memory schema) {
        schema.vaultType = "WorldCupPolymarketVault";
        schema.description = "World Cup-only vault for Flap tax revenue, WorldCupViewer settlement checks, and Polymarket market metadata. Polymarket execution is off-chain/metadata-only in this MVP.";
        schema.methods = new VaultMethodSchema[](23);

        schema.methods[0] = _method("description", "Dynamic vault status: revenue held plus latest World Cup settlement state.", new FieldDescriptor[](0), _fields1("summary", "string", "Human-readable vault status", 0), false, false, false);
        schema.methods[1] = _method("taxToken", "Read the configured Flap tax token address for this vault.", new FieldDescriptor[](0), _fields1("taxToken", "address", "Configured tax token address", 0), false, false, false);
        schema.methods[2] = _method("guardian", "Read the immutable Flap Guardian/backup operator address.", new FieldDescriptor[](0), _fields1("guardian", "address", "Guardian address that can always operate the vault", 0), false, false, false);
        schema.methods[3] = _method("worldCupViewer", "Read the WorldCupViewer contract address used as the BSC settlement truth source.", new FieldDescriptor[](0), _fields1("worldCupViewer", "address", "WorldCupViewer contract address", 0), false, false, false);
        schema.methods[4] = _method("operator", "Read the current day-to-day operator address.", new FieldDescriptor[](0), _fields1("operator", "address", "Current operator address", 0), false, false, false);
        schema.methods[5] = _method("totalRevenueReceived", "Read the cumulative BNB amount received through the payable receive hook.", new FieldDescriptor[](0), _fields1("amountWei", "uint256", "Total BNB revenue received, in wei", 0), false, false, false);
        schema.methods[6] = _method("lastSettlementMatchId", "Read the match/group/champion ID from the latest stored settlement refresh.", new FieldDescriptor[](0), _fields1("matchId", "uint256", "Latest settlement match ID", 0), false, false, false);
        schema.methods[7] = _method("lastSettlementTeamId", "Read the team ID from the latest stored settlement refresh.", new FieldDescriptor[](0), _fields1("teamId", "uint256", "Latest settlement team ID", 0), false, false, false);
        schema.methods[8] = _method("lastSettlementTeamName", "Read the team name from the latest stored settlement refresh.", new FieldDescriptor[](0), _fields1("teamName", "string", "Latest settlement team name", 0), false, false, false);
        schema.methods[9] = _method("lastSettlementResolved", "Read whether the latest stored settlement refresh was resolved.", new FieldDescriptor[](0), _fields1("isResolved", "bool", "Whether the latest settlement result is resolved", 0), false, false, false);
        schema.methods[10] = _method("getWorldCupWinner", "Read the current 2026 FIFA World Cup champion result from Flap WorldCupViewer.", new FieldDescriptor[](0), _matchOutputs(), false, false, false);
        schema.methods[11] = _method("getGroupWinner", "Read a Group A-L winner from Flap WorldCupViewer. Group A starts at matchId 2; Group L is 13.", _fields1("matchId", "uint256", "WorldCupViewer group match ID, 2 through 13", 0), _matchOutputs(), false, false, false);
        schema.methods[12] = _method("getMatchResult", "Read any WorldCupViewer match result by matchId.", _fields1("matchId", "uint256", "WorldCupViewer match ID", 0), _matchOutputs(), false, false, false);
        schema.methods[13] = _method("getTeamName", "Resolve a WorldCupViewer team ID into a team name. Reserved: 49 = others, 50 = draw.", _fields1("teamId", "uint256", "WorldCupViewer team ID", 0), _fields1("teamName", "string", "Team name or reserved label", 0), false, false, false);
        schema.methods[14] = _method("marketCount", "Return how many World Cup Polymarket mappings are stored.", new FieldDescriptor[](0), _fields1("count", "uint256", "Number of market mappings", 0), false, false, false);
        schema.methods[15] = _method("getMarket", "Read one stored Polymarket market mapping.", _fields1("index", "uint256", "Market mapping index", 0), _marketOutputs(), false, false, false);
        schema.methods[16] = _method("getMarkets", "Read a paginated list of Polymarket market mappings.", _fields2("offset", "uint256", "First index to return", 0, "limit", "uint256", "Maximum items to return", 0), _marketOutputs(), false, true, false);
        schema.methods[17] = _method("getMarketTiming", "Read the configurable countdown timestamps for one market. WorldCupViewer does not provide start/deadline times, so these values are operator-maintained metadata until an official schedule source is wired.", _fields1("index", "uint256", "Market mapping index", 0), _marketTimingOutputs(), false, false, false);
        schema.methods[18] = _method("setOperator", "Operator/Guardian: update the day-to-day operator. Guardian access is non-revocable backup control.", _fields1("newOperator", "address", "New non-zero operator address", 0), new FieldDescriptor[](0), false, false, true);
        schema.methods[19] = _method("upsertMarket", "Operator/Guardian: add or update a World Cup-only Polymarket mapping plus configurable countdown timestamps. This does not trade and does not fake official match times.", _upsertInputs(), new FieldDescriptor[](0), false, false, true);
        schema.methods[20] = _method("refreshSettlement", "Operator/Guardian: query WorldCupViewer and store the latest settlement snapshot for a match/group/champion, usually after settlementEarliestTime or a scheduled trigger.", _fields1("matchId", "uint256", "1 for champion, 2-13 for groups, or any WorldCupViewer match ID", 0), _matchOutputs(), false, false, true);
        schema.methods[21] = _method("recoverNative", "Guardian emergency only: recover BNB/tax revenue held by the vault if funds are stuck or the vault must be shut down. This must not bypass user claims in a future escrow version.", _fields2("recipient", "address", "Recipient that receives recovered BNB", 0, "amountWei", "uint256", "Amount of BNB to recover, in wei", 0), new FieldDescriptor[](0), false, false, true);
        schema.methods[22] = _method("recoverTaxToken", "Guardian emergency only: recover the configured Flap tax token from this vault if funds are stuck or the vault must be shut down. This only recovers taxToken, not arbitrary assets, and must not bypass user claims in a future escrow version.", _fields2("recipient", "address", "Recipient that receives recovered tax tokens", 0, "amount", "uint256", "Amount of taxToken to recover", 0), new FieldDescriptor[](0), false, false, true);
    }

    /// @notice Launch-form schema for a Flap VaultFactory V2.2-style vaultData/onBeforeLaunch flow.
    /// The factory should decode these fields, require a non-zero Guardian and WorldCupViewer,
    /// and wire Guardian as the permanent backup operator.
    function vaultDataSchema() external pure returns (VaultDataSchema memory schema) {
        schema.description = "Launch WorldCupPolymarketVault with BSC WorldCupViewer, Guardian backup control, optional operator, and optional tax token address. Polymarket fields remain metadata; this factory must not imply direct Polymarket trading.";
        schema.fields = new FieldDescriptor[](4);
        schema.fields[0] = _field("taxToken", "address", "Flap tax token address, or zero address if unknown at form time", 0);
        schema.fields[1] = _field("guardian", "address", "Required Flap Guardian address with non-revocable backup operator permissions", 0);
        schema.fields[2] = _field("worldCupViewer", "address", "Required BSC WorldCupViewer address used for settlement reads", 0);
        schema.fields[3] = _field("operator", "address", "Optional initial day-to-day operator; zero address falls back to launcher", 0);
        schema.isArray = false;
        schema.factoryNotes = "Factory stub should decode these same four launch fields, require non-zero Guardian and WorldCupViewer, deploy WorldCupPolymarketVault, and emit the vault address plus Guardian/operator/viewer. The launch UI must label Polymarket as metadata/off-chain execution only, not direct vault trading.";
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

    function _vaultDataSchemaOutputs() private pure returns (FieldDescriptor[] memory fields) {
        fields = new FieldDescriptor[](4);
        fields[0] = _field("description", "string", "Launch-form purpose and constraints", 0);
        fields[1] = _field("fields", "FieldDescriptor[]", "Constructor fields: taxToken, guardian, worldCupViewer, operator", 0);
        fields[2] = _field("isArray", "bool", "False: launch form submits one constructor tuple", 0);
        fields[3] = _field("factoryNotes", "string", "Factory stub/launch UI notes, including no direct Polymarket trading", 0);
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
        fields[4] = _field("marketSlug", "string", "Polymarket market slug or URL path", 0);
        fields[5] = _field("label", "string", "UI label or short thesis", 0);
        fields[6] = _field("matchStartTime", "time", "Configurable Unix timestamp for scheduled match start; 0 if unknown", 0);
        fields[7] = _field("bettingCloseTime", "time", "Configurable Unix timestamp when betting UI should lock; 0 if unknown", 0);
        fields[8] = _field("settlementEarliestTime", "time", "Configurable earliest timestamp to attempt refreshSettlement; 0 if unknown", 0);
        fields[9] = _field("active", "bool", "Enable/disable this mapping", 0);
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
contract WorldCupPolymarketVaultFactory {
    struct LaunchConfig {
        address worldCupViewer;
        address operator;
    }

    struct FactoryPolicy {
        string target;
        string operator;
        bytes value;
        string description;
    }

    address public constant BSC_VAULT_PORTAL = 0x90497450f2a706f1951b5bdda52B4E5d16f34C06;
    address public constant BSC_TESTNET_VAULT_PORTAL = 0x027e3704fC5C16522e9393d04C60A3ac5c0d775f;
    address public constant BSC_GUARDIAN = 0x9e27098dcD8844bcc6287a557E0b4D09C86B8a4b;
    address public constant BSC_TESTNET_GUARDIAN = 0x76Fa8C526f8Bc27ba6958B76DeEf92a0dbE46950;
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

    function factorySpecVersion() public pure returns (string memory) {
        return "v2.2";
    }

    function isQuoteTokenSupported(address quoteToken) external pure returns (bool supported) {
        return quoteToken == address(0);
    }

    function vaultDataSchema() public pure returns (WorldCupPolymarketVault.VaultDataSchema memory schema) {
        schema.description = "Launches an EIP-1167 clone of WorldCupPolymarketVault for the predicted Flap tax token. VaultPortal supplies taxToken; zero worldCupViewer uses Flap's BSC WorldCupViewer; zero operator uses the token creator.";
        schema.fields = new WorldCupPolymarketVault.FieldDescriptor[](2);
        schema.fields[0] = WorldCupPolymarketVault.FieldDescriptor("worldCupViewer", "address", "Optional WorldCupViewer address; use zero address for Flap BSC mainnet default", 0);
        schema.fields[1] = WorldCupPolymarketVault.FieldDescriptor("operator", "address", "Optional day-to-day operator; zero address falls back to token creator", 0);
        schema.isArray = false;
        schema.factoryNotes = "vaultData = abi.encode((address worldCupViewer, address operator)). VaultPortal passes the predicted taxToken into newVault(); users should not enter taxToken manually. Quote token must be native BNB. The factory runtime contains only minimal-proxy clone code, not full vault creation bytecode.";
    }

    function tokenCreationPolicies() public pure returns (FactoryPolicy[] memory policies) {
        policies = new FactoryPolicy[](1);
        policies[0] = FactoryPolicy({
            target: "quoteToken",
            operator: "eq",
            value: abi.encode(address(0)),
            description: "WorldCupPolymarketVault currently supports native BNB quote-token launches only."
        });
    }

    function onBeforeLaunch(bytes calldata vaultData) external pure returns (bool success, string memory reason) {
        validateLaunchConfig(vaultData);
        return (true, "");
    }

    function validateLaunchConfig(bytes calldata vaultData) public pure returns (LaunchConfig memory config) {
        if (vaultData.length == 0) {
            return LaunchConfig({worldCupViewer: BSC_WORLD_CUP_VIEWER, operator: address(0)});
        }
        config = abi.decode(vaultData, (LaunchConfig));
        if (config.worldCupViewer == address(0)) {
            config.worldCupViewer = BSC_WORLD_CUP_VIEWER;
        }
    }

    function newVault(address taxToken, address quoteToken, address creator, bytes calldata vaultData) external onlyVaultPortal returns (address vault) {
        require(taxToken != address(0), "taxToken required");
        require(quoteToken == address(0), "quoteToken must be BNB");
        require(creator != address(0), "creator required");
        LaunchConfig memory config = validateLaunchConfig(vaultData);
        address guardian = _getGuardian();
        address operator = config.operator == address(0) ? creator : config.operator;
        vault = _clone(implementation);
        WorldCupPolymarketVault(payable(vault)).initialize(taxToken, guardian, config.worldCupViewer, operator);
        emit VaultDeployed(vault, taxToken, creator, guardian, config.worldCupViewer, operator);
    }

    function _clone(address target) internal returns (address clone) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, target))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            clone := create(0, ptr, 0x37)
        }
        require(clone != address(0), "clone failed");
    }

    function _getVaultPortal() internal view returns (address) {
        if (block.chainid == 56) return BSC_VAULT_PORTAL;
        if (block.chainid == 97) return BSC_TESTNET_VAULT_PORTAL;
        revert("unsupported chain");
    }

    function _getGuardian() internal view returns (address) {
        if (block.chainid == 56) return BSC_GUARDIAN;
        if (block.chainid == 97) return BSC_TESTNET_GUARDIAN;
        revert("unsupported chain");
    }
}
