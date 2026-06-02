# Match timers research: Flap UI schema + World Cup vault

## Decision

Store timer/countdown data in the vault's market metadata, not in the Flap `WorldCupViewer` or `WorldCupResolver` reads.

Recommended market metadata fields:

```solidity
uint64 matchStartTime;          // scheduled match start, Unix seconds; 0 if unknown
uint64 bettingCloseTime;        // UI/operator lock time, Unix seconds; 0 if unknown
uint64 settlementEarliestTime;  // earliest safe refreshSettlement attempt, Unix seconds; 0 if unknown
```

Why: the Flap World Cup docs expose result state, not schedule state. `WorldCupViewer` returns `matchId`, `matchName`, `isResolved`, `teamId`, and `teamName`; it does not expose match start times, betting deadlines, lock times, or result timestamps. `WorldCupResolver` is older/final-winner oriented and likewise should not be treated as a timing source. The Trigger Service accepts an `executeAfter` timestamp, but that is scheduling infrastructure, not a source of sports schedule truth.

Do not fake live match times. Until an official schedule source is wired, store configurable timestamps that can be set to `0` when unknown and clearly labeled as operator-maintained metadata.

## Flap docs findings

### WorldCupViewer

Docs page: `https://docs.flap.sh/flap/developers/preview/worldcup-viewer`

Relevant on-chain surface:

```solidity
struct MatchViewResult {
    uint256 matchId;
    string matchName;
    bool isResolved;
    uint256 teamId;
    string teamName;
}

function getWorldCupWinner() external view returns (MatchViewResult memory);
function getGroupMatchWinners(uint256 matchId) external view returns (MatchViewResult memory);
function getMatchResult(uint256 matchId) external view returns (MatchViewResult memory);
function getTeamName(uint256 teamId) external view returns (string memory);
```

The viewer is the correct BSC settlement truth source for result status and winner/team data. It is not a timer oracle:

- no `matchStartTime`
- no `bettingCloseTime`
- no kickoff/deadline field
- no settlement timestamp/result timestamp in `MatchViewResult`
- no per-market countdown state

Use `isResolved` to move the UI into `resolved`; use vault metadata timestamps to determine `open`, `closing`, and `locked` before resolution.

### WorldCupResolver

Docs page: `https://docs.flap.sh/flap/developers/preview/worldcup-resolver`

The resolver is older and final-winner oriented. Existing project research already recommends using `WorldCupViewer` for new integrations. It does not solve timers/countdowns. Do not read deadlines from the resolver unless future Flap docs add explicit timing fields.

### Flap Trigger Service

Docs page: `https://docs.flap.sh/flap/developers/preview/flap-trigger-service`

The Trigger Service can schedule callbacks at or after a Unix timestamp:

```solidity
function requestTrigger(uint64 executeAfter) external payable returns (uint256 requestId);
```

The docs state that `executeAfter` is a lower bound, not a hard deadline. Callbacks can be delayed by network congestion, backend processing latency, block inclusion delays, or retry behavior. Therefore:

- use it to request a post-close/post-match `refreshSettlement(matchId)` attempt;
- never use it as the source of match timing truth;
- never assume execution happens exactly at kickoff or betting close;
- make callbacks idempotent and safe when the match is still unresolved.

## Contract recommendation

Current contract changes should make timers first-class metadata on each `MarketMapping`:

```solidity
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
```

`upsertMarket` should accept the same timestamp fields:

```solidity
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
) external onlyOperatorOrGuardian;
```

Add a focused read helper so an auto-rendered UI can show countdowns without loading every market field:

```solidity
function getMarketTiming(uint256 index)
    external
    view
    returns (
        uint64 matchStartTime,
        uint64 bettingCloseTime,
        uint64 settlementEarliestTime
    );
```

Keep `refreshSettlement(uint256 matchId)` as the settlement write, but describe it as normally called after `settlementEarliestTime` or a Trigger Service callback. The function should still query `WorldCupViewer`; it should not mark a market resolved just because a timer elapsed.

Optional future trigger bookkeeping, if the vault later directly requests Flap Trigger callbacks:

```solidity
struct PendingSettlementTrigger {
    uint256 marketIndex;
    uint256 matchId;
    uint64 executeAfter;
    bool consumed;
}

mapping(uint256 requestId => PendingSettlementTrigger) public pendingSettlementTriggers;

function scheduleSettlementRefresh(uint256 marketIndex) external payable onlyOperatorOrGuardian returns (uint256 requestId);
function trigger(uint256 requestId) external; // only FlapTriggerService
```

For the current MVP, this can stay as a design note. It requires wiring the Trigger Service interface, fee payment, request-id storage, callback auth, retry handling, and reentrancy guard. It is safer to expose timestamps first and let the operator or a later trigger integration call `refreshSettlement`.

## `vaultUISchema()` additions

Add the timer fields to `getMarket`, `getMarkets`, and `upsertMarket` descriptors. Use Flap field type `time` so the renderer can display date/time controls and countdowns.

Market output fields should become:

| Field | Type | Meaning |
| --- | --- | --- |
| `matchId` | `uint256` | WorldCupViewer match/group/champion ID. |
| `teamId` | `uint256` | WorldCupViewer team ID tied to this market. |
| `polymarketConditionId` | `bytes32` | Polymarket condition ID metadata. |
| `marketSlug` | `string` | Polymarket market slug or URL path. |
| `label` | `string` | Human-readable market label/thesis. |
| `matchStartTime` | `time` | Configurable scheduled match start; `0` if unknown. |
| `bettingCloseTime` | `time` | Configurable UI lock time; `0` if unknown. |
| `settlementEarliestTime` | `time` | Earliest recommended `refreshSettlement` attempt; `0` if unknown. |
| `active` | `bool` | Whether this mapping is active. |

Add a new read method entry:

```solidity
schema.methods[n] = _method(
    "getMarketTiming",
    "Read the configurable countdown timestamps for one market. WorldCupViewer does not provide start/deadline times, so these values are operator-maintained metadata until an official schedule source is wired.",
    _fields1("index", "uint256", "Market mapping index", 0),
    _marketTimingOutputs(),
    false,
    false,
    false
);
```

`_marketTimingOutputs()`:

```solidity
fields[0] = _field("matchStartTime", "time", "Configurable Unix timestamp for scheduled match start; 0 if unknown", 0);
fields[1] = _field("bettingCloseTime", "time", "Configurable Unix timestamp when betting UI should lock; 0 if unknown", 0);
fields[2] = _field("settlementEarliestTime", "time", "Configurable earliest timestamp to attempt refreshSettlement; 0 if unknown", 0);
```

## Trigger Service scheduling policy

Use the Trigger Service for scheduled settlement refresh attempts only after the vault has reliable configured timestamps.

Recommended policy:

1. `bettingCloseTime`: UI locks betting/copy and operator actions for that market. Do not schedule settlement from this alone unless it is also the best known post-match time.
2. `matchStartTime`: UI shows match/live-ish lock state, but it is not enough to settle.
3. `settlementEarliestTime`: schedule or manually call `refreshSettlement(matchId)` at/after this time.
4. Callback runs late-safe/idempotent logic:
   - verify caller is the Trigger Service;
   - map `requestId` to a market/match;
   - query `WorldCupViewer`;
   - if unresolved, store/emit a pending refresh result or leave state pending;
   - if resolved, store the settlement snapshot and emit `SettlementRefreshed`.

Do not batch all matches in one callback. Trigger callbacks should be bounded and fit within the documented max callback gas.

## Web UX countdown states

The web/front-end renderer should derive visible states from vault metadata plus `WorldCupViewer.isResolved`.

### Inputs

- `now`: current client or server time in Unix seconds.
- `active`: vault market active flag.
- `isResolved`: `WorldCupViewer` result or latest settlement snapshot.
- `matchStartTime`: `0` or configured kickoff/start timestamp.
- `bettingCloseTime`: `0` or configured lock timestamp.
- `settlementEarliestTime`: `0` or configured earliest refresh timestamp.

### States

| State | Condition | UI copy |
| --- | --- | --- |
| `resolved` | `isResolved == true` | Show resolved team from WorldCupViewer; countdown no longer controls status. |
| `locked` | not resolved and `bettingCloseTime > 0 && now >= bettingCloseTime` | Betting closed / waiting for result. Show `refreshSettlement` when `settlementEarliestTime == 0 || now >= settlementEarliestTime`. |
| `closing` | not resolved and `bettingCloseTime > 0 && now < bettingCloseTime && bettingCloseTime - now <= closingWindow` | Closing soon. Countdown to lock. |
| `open` | not resolved and active and either no close time or `now < bettingCloseTime` | Open. Show countdown to lock when `bettingCloseTime > 0`; otherwise show `Schedule not configured`. |
| `inactive` | `active == false` | Muted row/card; no action prompt. |
| `unknown_schedule` | active and all timestamp fields are `0` | No official schedule configured yet; do not invent a countdown. |

Suggested `closingWindow`: 24 hours for tournament markets, configurable in the web renderer.

### Display rules

- Always label timers as configured schedule metadata until an official schedule feed is wired.
- If `bettingCloseTime == 0`, do not render a fake countdown. Render `Betting close not configured`.
- If `settlementEarliestTime == 0`, keep `refreshSettlement` as a guarded/manual operator action rather than an automated timer.
- If a Trigger Service request exists in a future version, show `Refresh scheduled for <time>` plus a note that execution can be late.
- `resolved` always wins over countdown state, because Flap settlement truth is `WorldCupViewer.isResolved`.

## Implementation status in this repo

Implemented in this task:

- `contracts/WorldCupPolymarketVault.sol` now stores `matchStartTime`, `bettingCloseTime`, and `settlementEarliestTime` on `MarketMapping`.
- `upsertMarket(...)` accepts those three `uint64` timestamp fields.
- `getMarketTiming(uint256 index)` exposes focused timer reads.
- `vaultUISchema()` exposes the new timer fields with Flap `time` field descriptors.
- `schemas/vault-ui-schema.reference.json` mirrors the timer-enabled method surface.

Still intentionally not implemented:

- no official schedule feed;
- no fake default World Cup timestamps;
- no direct Trigger Service callback wiring;
- no Polymarket execution/settlement contract logic.
