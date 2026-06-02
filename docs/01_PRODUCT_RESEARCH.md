# Product research: World Cup-only Flap vault + Polymarket metadata

## Executive thesis

Build the vault as a BSC-native Flap custom vault for a 2026 FIFA World Cup prediction-market treasury, not as a cross-chain Polymarket trading contract.

The clean product is:

1. A Flap tax token routes BNB revenue into a custom vault on BSC.
2. The vault exposes its full interaction surface through Flap `vaultUISchema()` so Flap can auto-render the UI without bespoke frontend code.
3. The vault reads Flap's BSC `WorldCupViewer` as the on-chain sports-result truth source.
4. The vault stores World Cup-only Polymarket metadata (`conditionId`, slug/path, label/thesis, `matchId`, `teamId`, active flag) so humans or a later audited off-chain executor can connect the BSC state to Polymarket markets.
5. Any Polymarket order placement, portfolio custody, USDC movement, claiming, or execution remains off-chain / outside this BSC vault MVP until a separate bridge/executor/custody design is specified and audited.

This lets the first product be useful and honest: Flap users can launch a World Cup-themed tax-token vault, inspect BNB revenue held by the vault, query World Cup settlement state, and see which Polymarket markets the vault's thesis points at, while avoiding the false claim that a BSC Flap vault can directly settle or execute Polymarket positions.

## Primary Flap docs read

- Vault and VaultFactory spec, especially `IVaultSchemasV1` UI schema: https://docs.flap.sh/flap/developers/vault-developers/vault-and-vaultfactory-specification#ui-schema-reference-ivaultschemasv1
- WorldCup Viewer: https://docs.flap.sh/flap/developers/preview/worldcup-viewer
- WorldCup Resolver: https://docs.flap.sh/flap/developers/preview/worldcup-resolver
- Flap AI Oracle: https://docs.flap.sh/flap/developers/preview/flap-ai-oracle
- Flap Trigger Service: https://docs.flap.sh/flap/developers/preview/flap-trigger-service

## Flap vault specification implications

The current Flap docs describe two vault generations plus V2.1/V2.2 factory extensions. For a new implementation, the relevant target is V2/V2.2:

- New vaults should extend `VaultBaseV2`, which keeps all V1 duties and adds `vaultUISchema()`.
- New factories should extend `VaultFactoryBaseV2`, expose `vaultDataSchema()`, and generally target the V2.2 `onBeforeLaunch(bytes)` validation hook.
- V1 duties still matter: implement a dynamic `description()`, implement `receive()` to accept/process BNB revenue, and include Flap Guardian as a non-revocable backup caller for permissioned functions.
- Flap's docs state that `vaultUISchema()` is meant to make future vaults auto-renderable: the UI reads the schema, displays `vaultType`/`description`, polls `vault.description()` as a dynamic status banner, renders read methods as query cards, renders write methods as transaction forms, and runs any declared `ApproveAction`s before write transactions.
- Factory `tokenCreationPolicies()` are informational only; actual enforcement must live in the relevant validation hook. For this product, policies should mirror any World Cup-only launch constraints enforced by `_validateBeforeLaunch(...)` / `onBeforeLaunch(bytes)`.

## UI schema structs to cite and implement

Flap's `IVaultSchemasV1` schema model is the main product enabler because it gives the vault an auto-rendered interaction UI.

Core structs from the Flap UI schema reference:

```solidity
struct FieldDescriptor {
  string name;
  string fieldType;
  string description;
  uint8 decimals;
}

struct VaultDataSchema {
  string description;
  FieldDescriptor[] fields;
  bool isArray;
}

struct FactoryPolicy {
  string target;
  string operator; // eq | neq | gt | gte | lt | lte | in | notIn
  bytes value;
  string description;
}

struct ApproveAction {
  string tokenType;       // taxToken or lpToken
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
```

Field-type details that matter for this vault:

- Supported field types include strings, addresses, unsigned integers, booleans, bytes/bytes32, `time`, and special write-only `msg.value`.
- Non-numeric fields should use `decimals = 0`.
- Numeric inputs with `decimals > 0` are scaled before ABI encoding; numeric outputs with `decimals > 0` are scaled down for display.
- `VaultDataSchema.isArray = true` makes the UI render dynamic array entries and ABI-encode a tuple array. This is useful if the future factory wants launch-time market mappings.
- `VaultMethodSchema.isOutputArray = true` should be used for paginated market lists such as `getMarkets(offset, limit)`.
- `ApproveAction` is not needed for the current metadata MVP because no method spends a token. If a later version adds tax-token or LP-token actions, approvals must name `taxToken` or `lpToken` and the input field containing the amount.

Recommended `vaultUISchema()` shape for the MVP:

| Method | UI type | Inputs | Outputs | Product role |
| --- | --- | --- | --- | --- |
| `description()` | read | none | `summary:string` | Dynamic status banner: BNB held + latest settlement snapshot. |
| `getWorldCupWinner()` | read | none | `MatchViewResult` fields | Champion settlement card for match ID 1. |
| `getGroupWinner(uint256 matchId)` | read | `matchId:uint256` | `MatchViewResult` fields | Group A-L winner lookup; Group A = 2 through Group L = 13. |
| `getMatchResult(uint256 matchId)` | read | `matchId:uint256` | `MatchViewResult` fields | General WorldCupViewer result lookup. |
| `getTeamName(uint256 teamId)` | read | `teamId:uint256` | `teamName:string` | Team-ID helper; 49 = others, 50 = draw. |
| `marketCount()` | read | none | `count:uint256` | Stored Polymarket-mapping count. |
| `getMarket(uint256 index)` | read | `index:uint256` | market metadata fields | Read one metadata mapping. |
| `getMarkets(uint256 offset,uint256 limit)` | read array output | `offset`, `limit` | market metadata fields | Paginated market table. |
| `upsertMarket(...)` | write | index, matchId, teamId, conditionId, slug, label, active | none | Operator/Guardian metadata curation; no trade execution. |
| `refreshSettlement(uint256 matchId)` | write | matchId | `MatchViewResult` fields | Store a latest BSC settlement snapshot after querying WorldCupViewer. |

## WorldCupViewer facts and product relevance

`WorldCupViewer` is the preferred on-chain World Cup read surface for this vault.

Docs facts:

- BSC mainnet address: `0x00036192958C2aaAF9F445d3Cdc2979995EA333e`.
- It is read-only; querying match state requires no transaction.
- It gives a high-level view of 2026 FIFA World Cup results without making integrators understand the lower-level oracle mapping.
- All query methods return:

```solidity
struct MatchViewResult {
  uint256 matchId;     // match ID queried
  string matchName;    // human-readable match name
  bool isResolved;     // true once oracle has settled the match
  uint256 teamId;      // 0 pending, 49 others, 50 draw/tie, otherwise team ID
  string teamName;     // empty pending, "draw"/tie message for ties, "others" for unlisted teams, otherwise team name
}
```

Methods to cite and use:

- `getWorldCupWinner()` returns the 2026 FIFA World Cup winner for match ID `1`.
- `getGroupMatchWinners(uint256 matchId)` returns a group winner. Docs map Group A to match ID `2`, Group B to `3`, continuing through Group L at `13`.
- `getMatchResult(uint256 matchId)` returns a resolved result for any match ID from the underlying oracle mapping.
- `getTeamName(uint256 teamId)` maps standard team IDs `1` through `48`; reserved IDs are `49 = others` and `50 = draw`; unknown IDs return an empty string.

Product interpretation:

- The vault should use `WorldCupViewer` for final visible settlement state because it is BSC-native and aligned with Flap.
- The vault should store `matchId` and `teamId` alongside Polymarket metadata so the UI can connect each off-chain market to an on-chain WorldCupViewer lookup.
- The vault should not infer Polymarket settlement from a slug alone. A mapping is only a thesis/metadata row unless a later executor explicitly proves how Polymarket settlement maps to WorldCupViewer outcomes.

## WorldCupResolver facts and product relevance

`WorldCupResolver` is useful context, but not the primary MVP integration.

Docs facts:

- BSC mainnet address: `0x134C6b9562E226096947e018ddEe4804c9146921`.
- Docs call it an older solution and recommend new integrations prefer `WorldCupViewer`.
- It reads 2026 World Cup outcomes from the on-chain oracle system and exposes them downstream.
- It covers 43 entries: 32 tournament teams, selected additional national teams with odds, and an `Other` catch-all.
- Each team maps to an oracle question of the form `Will [Team] win the 2026 FIFA World Cup?`.
- `resolveWinner()` reads the oracle live; result state is not stored inside the resolver.
- A final winner is confirmed only when the oracle has reported, the result is YES, and the result is not flagged/disputed.

Product interpretation:

- Use `WorldCupResolver` as a fallback/reference for champion-only research and security review, especially if the product needs to explain lower-level oracle semantics.
- Prefer `WorldCupViewer` in the contract and UI because it exposes champion, group, and arbitrary match reads through one clean `MatchViewResult` struct.
- If there is disagreement between Polymarket and the Flap oracle stack, the BSC vault's settlement copy should explicitly say it follows Flap `WorldCupViewer`, not Polymarket.

## Flap AI Oracle relevance

The Flap AI Oracle is not the sports truth source. It is useful for optional research/reasoning workflows.

Docs facts:

- BSC mainnet address: `0xaEe3a7Ca6fe6b53f6c32a3e8407eC5A9dF8B7E39`.
- BSC testnet address: `0xFfddcE44e8cFf7703Fd85118524bfC8B2f70b744`.
- Max callback gas limit: `2,000,000`.
- The oracle uses a commit-and-reveal pattern: the consumer calls `reason()` with a prompt and BNB fee, the off-chain backend runs the selected LLM, and `fulfillReasoning()` stores the result plus an IPFS CID for the full reasoning proof.
- The on-chain AI result is a numeric choice in `[0, numOfChoices)`.
- The IPFS proof can include raw LLM inputs, outputs, model version, temperature, and salt.

Product interpretation:

- Do not let the AI Oracle decide who won a match or whether a Polymarket position should be claimed. WorldCupViewer is the sports-result truth source for the MVP.
- Useful optional functions for a later V2:
  - `requestMarketRanking(...)`: ask the AI Oracle to rank stored World Cup market mappings by research attractiveness.
  - `recordOracleThesis(...)`: store the returned numeric choice and IPFS CID as auditable research metadata.
  - `explainSettlementMismatch(...)`: if Polymarket wording and Flap WorldCupViewer state differ, ask for a human-readable explanation, while still requiring operator/Guardian review before action.
- Any AI Oracle function should be framed as advisory/research, not autonomous financial execution.

## Flap Trigger Service relevance

The Trigger Service is useful for scheduled refreshes, but it does not give precise timing or free execution.

Docs facts:

- BSC mainnet address: `0xcf4EE25035CF883895110f367F5BA8172416a7F9`.
- BSC testnet address: `0x560E9830926C9e0EB98a59c6b9902383Fc0D9Eb2`.
- Max callback gas limit: `2,000,000`.
- Current trigger price: `0.0002 BNB per request`, paid upfront in `msg.value`; overpayment is not refunded.
- A requester calls `requestTrigger()` with an `executeAfter` timestamp or `0` for immediate execution.
- The backend later calls `trigger(requestId)`, which calls back `requester.trigger(requestId)` with bounded gas.
- `executeAfter` is a lower bound, not a hard deadline. Integrators must handle late execution due to congestion, backend latency, block inclusion, and MEV protection overhead.
- Failed callbacks enter `FAILED`; failed requests can be retried with `retryTrigger(requestId)`.

Product interpretation:

- Use the Trigger Service for scheduled/after-match refresh attempts such as `refreshSettlement(matchId)` after known World Cup dates.
- The vault must remain safe if a trigger runs late, repeats after a retry, or the match is still unresolved.
- Trigger callbacks should not be large batch jobs. Keep callback work bounded: identify the match/request, query WorldCupViewer, store a snapshot, emit an event.
- Trigger Service should not execute Polymarket trades in this MVP. It can only coordinate BSC callbacks; off-chain Polymarket execution still needs a separate executor with custody and compliance controls.

## BSC settlement vs Polymarket execution: hard separation

This is the central product constraint.

### On-chain BSC / Flap side

The vault can safely do these things on BSC:

- Receive BNB tax revenue via `receive()`.
- Hold or route BNB according to Flap vault logic.
- Expose a dynamic `description()`.
- Expose `vaultUISchema()` so Flap can auto-render the vault.
- Store World Cup-only market metadata in contract storage.
- Query `WorldCupViewer` and store latest settlement snapshots.
- Emit events for revenue, metadata updates, and settlement refreshes.
- Allow operator + non-revocable Guardian access for permissioned metadata/refresh functions.
- Optionally request AI Oracle reasoning or Trigger Service callbacks in later versions.

### Off-chain / Polymarket side

The vault must not claim to do these things in the MVP:

- It does not place Polymarket orders.
- It does not bridge BNB to Polygon/USDC.
- It does not custody Polymarket positions.
- It does not claim or settle Polymarket winnings.
- It does not prove Polymarket market resolution on BSC.
- It does not reconcile CLOB fills, Polymarket portfolio state, or USDC balances.

The stored Polymarket fields should be described as metadata:

```solidity
struct MarketMapping {
  uint256 matchId;                 // Flap WorldCupViewer match/group/champion ID
  uint256 teamId;                  // Flap WorldCupViewer team ID tied to the thesis
  bytes32 polymarketConditionId;   // Polymarket metadata, not an on-chain BSC settlement proof
  string marketSlug;               // Polymarket market slug/path for UI/executor lookup
  string label;                    // Human-readable market label/thesis
  bool active;                     // UI/executor curation flag
}
```

A later executor product could read vault events/metadata, use a custody wallet, operate against Polymarket off-chain/on its native venue, and report results back through a separate, audited channel. That is a different system from this first Flap vault.

## Proposed product copy

Short version:

> A Flap custom vault for a World Cup-only prediction-market treasury. It receives BNB tax revenue on BSC, reads Flap's WorldCupViewer for on-chain match settlement, and stores curated Polymarket market metadata for research or later off-chain execution. The MVP does not trade on Polymarket from BSC.

UI subtitle:

> BSC settlement state from Flap WorldCupViewer; Polymarket fields are metadata only.

Permissioned write warning:

> Operator/Guardian may curate market mappings and refresh settlement snapshots. These writes do not place trades or settle Polymarket positions.

## Factory launch thesis

A future `WorldCupPolymarketVaultFactory` should make the World Cup-only nature explicit at launch:

- `vaultDataSchema()` can either be empty for a simple launch or accept an array of initial `MarketMapping` tuples.
- If it accepts mappings, use `VaultDataSchema.isArray = true` so the UI renders dynamic mapping rows.
- `tokenCreationPolicies()` should disclose launch constraints such as BNB quote-token only and any tax/dividend constraints the factory enforces.
- The V2.2 `onBeforeLaunch(bytes)` validation hook must enforce the same constraints; policy structs alone are not enforcement.
- Launch-time mapping validation should reject obviously non-World-Cup metadata where possible, but avoid pretending a slug string proves market legitimacy. Human/operator curation remains part of the MVP.

## Open risks for downstream security/review

- Guardian address must be the actual Flap Guardian address for the target chain, and its permission must not be revocable by the operator.
- `upsertMarket` is a curation power; bad metadata can mislead users even though it cannot trade. The UI should label it clearly and show update events.
- `refreshSettlement` should not become an unrestricted expensive callback path. If public, it must be safe; if permissioned, Guardian must be included.
- WorldCupViewer result semantics and Polymarket market wording may not match exactly. The UI needs a mismatch warning rather than silently treating them as equivalent.
- Trigger callbacks must be idempotent and tolerate late execution.
- AI Oracle outputs are numeric/advisory and should not be used as final settlement or autonomous trading authority.
- Any bridge/executor that actually interacts with Polymarket is a separate custody, compliance, and audit scope.

## Acceptance checklist mapping

- UI schema structs cited: `FieldDescriptor`, `VaultDataSchema`, `FactoryPolicy`, `ApproveAction`, `VaultMethodSchema`, `VaultUISchema`.
- WorldCupViewer cited: BSC mainnet address `0x00036192958C2aaAF9F445d3Cdc2979995EA333e`, `MatchViewResult`, `getWorldCupWinner`, `getGroupMatchWinners`, `getMatchResult`, `getTeamName`, reserved team IDs.
- WorldCupResolver cited: BSC mainnet address `0x134C6b9562E226096947e018ddEe4804c9146921`, older solution, champion-resolution semantics.
- AI Oracle cited: BSC mainnet address `0xaEe3a7Ca6fe6b53f6c32a3e8407eC5A9dF8B7E39`, commit/reveal, numeric choice, IPFS proof, advisory relevance.
- Trigger Service cited: BSC mainnet address `0xcf4EE25035CF883895110f367F5BA8172416a7F9`, fee `0.0002 BNB`, callback gas max `2,000,000`, lower-bound timing.
- BSC settlement and off-chain Polymarket execution explicitly separated.
