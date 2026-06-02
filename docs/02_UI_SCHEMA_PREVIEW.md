# Flap vault UI schema preview

This artifact maps every method in `schemas/vault-ui-schema.reference.json` to the UI Flap can auto-render for the `WorldCupPolymarketVault` function surface. It is schema-first: no frontend app is required yet, but every card, form, table, state badge, and field below can be implemented directly from the JSON descriptors.

Source schema: `schemas/vault-ui-schema.reference.json`  
Vault type: `WorldCupPolymarketVault`  
Surface: 21 methods, 18 read cards/inspectors, 3 guarded write forms, 1 array table, plus 4 launch-form fields.

## Renderer model

A generic Flap renderer can classify each method with only the schema flags:

1. `isWriteMethod = false`: render a safe read card. Primary action is `Read` or `Refresh`; do not request wallet write confirmation.
2. `isWriteMethod = true`: render a guarded action form. Primary action is `Submit transaction`; show Operator/Guardian copy before wallet confirmation.
3. `isOutputArray = true`: render outputs as repeated table rows using the output descriptors as columns. In this reference schema, only `getMarkets(offset, limit)` does this.
4. `approvals = []`: no token approval module is needed for this MVP surface.

## Complete method map

| Method | Mode | Inputs | Outputs | Recommended UI |
|---|---:|---|---|---|
| `description` | READ | none | `summary: string` | single value card |
| `taxToken` | READ | none | `taxToken: address` | address/config card |
| `guardian` | READ | none | `guardian: address` | address/config card |
| `worldCupViewer` | READ | none | `worldCupViewer: address` | address/config card |
| `operator` | READ | none | `operator: address` | address/config card |
| `totalRevenueReceived` | READ | none | `amountWei: uint256` | single value card |
| `lastSettlementMatchId` | READ | none | `matchId: uint256` | latest settlement state chip/card |
| `lastSettlementTeamId` | READ | none | `teamId: uint256` | latest settlement state chip/card |
| `lastSettlementTeamName` | READ | none | `teamName: string` | latest settlement state chip/card |
| `lastSettlementResolved` | READ | none | `isResolved: bool` | latest settlement state chip/card |
| `getWorldCupWinner` | READ | none | `matchId: uint256`, `matchName: string`, `isResolved: bool`, `teamId: uint256`, `teamName: string` | result/detail card |
| `getGroupWinner` | READ | `matchId: uint256` | `matchId: uint256`, `matchName: string`, `isResolved: bool`, `teamId: uint256`, `teamName: string` | result/detail card |
| `getMatchResult` | READ | `matchId: uint256` | `matchId: uint256`, `matchName: string`, `isResolved: bool`, `teamId: uint256`, `teamName: string` | result/detail card |
| `getTeamName` | READ | `teamId: uint256` | `teamName: string` | single value card |
| `marketCount` | READ | none | `count: uint256` | single value card |
| `getMarket` | READ | `index: uint256` | `matchId: uint256`, `teamId: uint256`, `polymarketConditionId: bytes32`, `marketSlug: string`, `label: string`, `active: bool` | result/detail card |
| `getMarkets` | READ | `offset: uint256`, `limit: uint256` | `matchId: uint256`, `teamId: uint256`, `polymarketConditionId: bytes32`, `marketSlug: string`, `label: string`, `active: bool` | paginated array table |
| `vaultDataSchema` | READ | none | `description: string`, `fields: FieldDescriptor[]`, `isArray: bool`, `factoryNotes: string` | launch-form schema inspector |
| `setOperator` | WRITE | `newOperator: address` | none | guarded transaction form |
| `upsertMarket` | WRITE | `index: uint256`, `matchId: uint256`, `teamId: uint256`, `polymarketConditionId: bytes32`, `marketSlug: string`, `label: string`, `active: bool` | none | guarded transaction form |
| `refreshSettlement` | WRITE | `matchId: uint256` | `matchId: uint256`, `matchName: string`, `isResolved: bool`, `teamId: uint256`, `teamName: string` | guarded action form + returned result card |

## Polished UI layout

### 1. Vault header

Render a strong header before method cards:

- Title: `WorldCupPolymarketVault`
- Subtitle: World Cup-only vault for BNB tax revenue, BSC WorldCupViewer settlement checks, and Polymarket market metadata.
- Pills: `BSC truth source`, `Polymarket metadata only`, `No token approvals required`, `Operator/Guardian writes`, `Factory launch fields`.

### 2. Configuration and revenue cards

Render these read methods as the persistent vault overview strip:

- `taxToken`, `guardian`, `worldCupViewer`, `operator`: address/config cards with copy buttons.
- `totalRevenueReceived`: revenue metric card in wei, optionally formatted as BNB.
- `description`: top summary/status banner.

These cards should not invent balances, claim Polymarket positions, or imply that an address is connected unless live RPC confirms it.

### 3. Latest settlement snapshot

Combine these four single-value reads into one compact snapshot card:

- `lastSettlementMatchId`
- `lastSettlementTeamId`
- `lastSettlementTeamName`
- `lastSettlementResolved`

If `lastSettlementResolved=false`, render amber `Pending` and avoid showing a winner. If `lastSettlementResolved=true`, render green `Resolved` with `lastSettlementTeamName` and `lastSettlementTeamId`.

### 4. World Cup result cards

Render these methods as World Cup result cards:

- `getWorldCupWinner()`
- `getGroupWinner(matchId)`
- `getMatchResult(matchId)`
- `refreshSettlement(matchId)` after transaction confirmation

Shared output shape:

| Field | UI treatment | Pending state | Resolved state |
|---|---|---|---|
| `matchId` | small ID chip | selected/requested ID | settled WorldCupViewer ID |
| `matchName` | card title/subtitle | `World Cup Winner`, `Group A Winner`, or requested match | viewer-provided match name |
| `isResolved` | big status badge | `Pending` / amber | `Resolved` / green |
| `teamId` | numeric/team chip | `0` means pending | winning team ID, `49` = others, `50` = draw |
| `teamName` | main result text | empty or `Not resolved yet` | winning team name, `Others`, or `Draw` |

Pending copy:

```text
Pending World Cup result
WorldCupViewer has not settled this match yet. The vault can display linked Polymarket metadata, but no resolved winner should be implied.
```

Resolved copy:

```text
Resolved result
WorldCupViewer settled this market to <teamName> (teamId <teamId>). Off-chain Polymarket execution can use this as the BSC-grounded settlement signal.
```

### 5. Market metadata panel

Group `marketCount`, `getMarket`, `getMarkets`, and `upsertMarket` together because they operate on the same stored mapping list.

#### `marketCount()`

Metric card:

- Label: `Stored World Cup market mappings`
- Value: `count`
- Supporting copy: `Metadata mappings only; this vault does not execute Polymarket trades.`

#### `getMarket(index)`

Single-row inspector. Inputs: `index`. Output fields become a definition list:

- `matchId`: WorldCupViewer match/group/champion ID.
- `teamId`: WorldCupViewer team ID tied to this market.
- `polymarketConditionId`: bytes32 metadata, rendered monospace with copy button.
- `marketSlug`: copyable slug/link path; do not imply guaranteed executable trade URL.
- `label`: human-readable thesis.
- `active`: active/inactive badge.

#### `getMarkets(offset, limit)`

Paginated table. Inputs render as pagination controls:

- `offset`: first row index.
- `limit`: page size, with a safe default like 10 or 25.

Columns are exactly the output descriptors: `matchId`, `teamId`, `polymarketConditionId`, `marketSlug`, `label`, `active`.

Why this method has array output:

`getMarket(index)` returns one `MarketMapping`, but a dashboard needs a list view. Solidity should not return an unbounded storage array for large datasets, so `getMarkets(offset, limit)` returns a bounded page. The schema marks `isOutputArray: true` so Flap renders the six output fields as columns repeated for each row instead of as one detail object. This prevents the UI from mistaking a list of mappings for a single mapping.

#### `upsertMarket(...)`

Guarded write form for Operator/Guardian users. It should be visually separated from read cards and should state that it stores metadata only.

| Field | Control | Validation hint |
|---|---|---|
| `index` | number input | existing index updates; `marketCount()` appends |
| `matchId` | number input / selector | `1` champion, `2-13` group winners, other WorldCupViewer match IDs allowed |
| `teamId` | number input / team selector | `49` others and `50` draw are reserved labels |
| `polymarketConditionId` | bytes32 text input | require `0x` + 64 hex chars when known |
| `marketSlug` | text input | slug or URL path, copyable after save |
| `label` | text input | short human-readable market thesis |
| `active` | checkbox/switch | inactive mappings stay visible but muted |

### 6. Launch/factory preview

The top-level `vaultDataSchema` and the callable `vaultDataSchema()` method support a launch form before the vault exists.

| Launch field | Type | UI note |
|---|---|---|
| `taxToken` | `address` | Flap tax token address, or zero address if unknown at form time |
| `guardian` | `address` | Required Flap Guardian address with non-revocable backup operator permissions |
| `worldCupViewer` | `address` | Required BSC WorldCupViewer address used for settlement reads |
| `operator` | `address` | Optional initial day-to-day operator; zero address falls back to launcher |

Factory notes:

- Decode vault data as `(taxToken, guardian, worldCupViewer, operator)`.
- Require non-zero `guardian` and `worldCupViewer` before launch.
- Keep Guardian as permanent backup operator.
- Label Polymarket fields as metadata/off-chain execution only, not direct vault trading.

### 7. Operator/Guardian action zone

Write methods should live in a separate action zone:

- `setOperator(newOperator)`: rotate day-to-day operator; keep Guardian authority clear.
- `upsertMarket(...)`: create/update metadata mappings only.
- `refreshSettlement(matchId)`: query WorldCupViewer and store latest settlement snapshot.

Every write card should show wallet confirmation language and avoid token approvals because `approvals` is empty.

## Card-by-card preview spec

### 1. `description`

- Mode: **READ**
- Schema description: Dynamic vault status: revenue held plus latest World Cup settlement state.
- Inputs: none
- Outputs: `summary: string`
- Array output: `false`
- Recommended UI: single value card

### 2. `taxToken`

- Mode: **READ**
- Schema description: Read the configured Flap tax token address for this vault.
- Inputs: none
- Outputs: `taxToken: address`
- Array output: `false`
- Recommended UI: address/config card
- Address handling: render as a short checksummed address with copy button; never label it as a wallet balance.

### 3. `guardian`

- Mode: **READ**
- Schema description: Read the immutable Flap Guardian/backup operator address.
- Inputs: none
- Outputs: `guardian: address`
- Array output: `false`
- Recommended UI: address/config card
- Address handling: render as a short checksummed address with copy button; never label it as a wallet balance.

### 4. `worldCupViewer`

- Mode: **READ**
- Schema description: Read the WorldCupViewer contract address used as the BSC settlement truth source.
- Inputs: none
- Outputs: `worldCupViewer: address`
- Array output: `false`
- Recommended UI: address/config card
- Address handling: render as a short checksummed address with copy button; never label it as a wallet balance.

### 5. `operator`

- Mode: **READ**
- Schema description: Read the current day-to-day operator address.
- Inputs: none
- Outputs: `operator: address`
- Array output: `false`
- Recommended UI: address/config card
- Address handling: render as a short checksummed address with copy button; never label it as a wallet balance.

### 6. `totalRevenueReceived`

- Mode: **READ**
- Schema description: Read the cumulative BNB amount received through the payable receive hook.
- Inputs: none
- Outputs: `amountWei: uint256`
- Array output: `false`
- Recommended UI: single value card
- Value handling: render as wei by default and optionally add a formatted BNB display if RPC/formatting utilities are available.

### 7. `lastSettlementMatchId`

- Mode: **READ**
- Schema description: Read the match/group/champion ID from the latest stored settlement refresh.
- Inputs: none
- Outputs: `matchId: uint256`
- Array output: `false`
- Recommended UI: latest settlement state chip/card
- State handling: combine these four latest-settlement methods into one compact snapshot card instead of four unrelated rows.

### 8. `lastSettlementTeamId`

- Mode: **READ**
- Schema description: Read the team ID from the latest stored settlement refresh.
- Inputs: none
- Outputs: `teamId: uint256`
- Array output: `false`
- Recommended UI: latest settlement state chip/card
- State handling: combine these four latest-settlement methods into one compact snapshot card instead of four unrelated rows.

### 9. `lastSettlementTeamName`

- Mode: **READ**
- Schema description: Read the team name from the latest stored settlement refresh.
- Inputs: none
- Outputs: `teamName: string`
- Array output: `false`
- Recommended UI: latest settlement state chip/card
- State handling: combine these four latest-settlement methods into one compact snapshot card instead of four unrelated rows.

### 10. `lastSettlementResolved`

- Mode: **READ**
- Schema description: Read whether the latest stored settlement refresh was resolved.
- Inputs: none
- Outputs: `isResolved: bool`
- Array output: `false`
- Recommended UI: latest settlement state chip/card
- State handling: combine these four latest-settlement methods into one compact snapshot card instead of four unrelated rows.

### 11. `getWorldCupWinner`

- Mode: **READ**
- Schema description: Read the current 2026 FIFA World Cup champion result from Flap WorldCupViewer.
- Inputs: none
- Outputs: `matchId: uint256`, `matchName: string`, `isResolved: bool`, `teamId: uint256`, `teamName: string`
- Array output: `false`
- Recommended UI: result/detail card
- State handling: use the shared World Cup result block. Show `Pending` when `isResolved=false` or `teamId=0`; show `Resolved` with `teamName` when `isResolved=true`. Reserved `teamId` values are `49 = others` and `50 = draw`.

### 12. `getGroupWinner`

- Mode: **READ**
- Schema description: Read a Group A-L winner from Flap WorldCupViewer. Group A starts at matchId 2; Group L is 13.
- Inputs: `matchId: uint256`
- Outputs: `matchId: uint256`, `matchName: string`, `isResolved: bool`, `teamId: uint256`, `teamName: string`
- Array output: `false`
- Recommended UI: result/detail card
- State handling: use the shared World Cup result block. Show `Pending` when `isResolved=false` or `teamId=0`; show `Resolved` with `teamName` when `isResolved=true`. Reserved `teamId` values are `49 = others` and `50 = draw`.

### 13. `getMatchResult`

- Mode: **READ**
- Schema description: Read any WorldCupViewer match result by matchId.
- Inputs: `matchId: uint256`
- Outputs: `matchId: uint256`, `matchName: string`, `isResolved: bool`, `teamId: uint256`, `teamName: string`
- Array output: `false`
- Recommended UI: result/detail card
- State handling: use the shared World Cup result block. Show `Pending` when `isResolved=false` or `teamId=0`; show `Resolved` with `teamName` when `isResolved=true`. Reserved `teamId` values are `49 = others` and `50 = draw`.

### 14. `getTeamName`

- Mode: **READ**
- Schema description: Resolve a WorldCupViewer team ID into a team name. Reserved: 49 = others, 50 = draw.
- Inputs: `teamId: uint256`
- Outputs: `teamName: string`
- Array output: `false`
- Recommended UI: single value card

### 15. `marketCount`

- Mode: **READ**
- Schema description: Return how many World Cup Polymarket mappings are stored.
- Inputs: none
- Outputs: `count: uint256`
- Array output: `false`
- Recommended UI: single value card

### 16. `getMarket`

- Mode: **READ**
- Schema description: Read one stored Polymarket market mapping.
- Inputs: `index: uint256`
- Outputs: `matchId: uint256`, `teamId: uint256`, `polymarketConditionId: bytes32`, `marketSlug: string`, `label: string`, `active: bool`
- Array output: `false`
- Recommended UI: result/detail card

### 17. `getMarkets`

- Mode: **READ**
- Schema description: Read a paginated list of Polymarket market mappings.
- Inputs: `offset: uint256`, `limit: uint256`
- Outputs: `matchId: uint256`, `teamId: uint256`, `polymarketConditionId: bytes32`, `marketSlug: string`, `label: string`, `active: bool`
- Array output: `true`
- Recommended UI: paginated array table
- Special rendering: repeat the output fields as table columns for each returned market mapping row. This is the only method with `isOutputArray=true`.

### 18. `vaultDataSchema`

- Mode: **READ**
- Schema description: Read launch-form data schema and factory notes for deploying this vault. The form keeps Guardian/operator requirements explicit and states Polymarket is metadata-only.
- Inputs: none
- Outputs: `description: string`, `fields: FieldDescriptor[]`, `isArray: bool`, `factoryNotes: string`
- Array output: `false`
- Recommended UI: launch-form schema inspector
- Launch handling: render the four launch fields (`taxToken`, `guardian`, `worldCupViewer`, `operator`) as a factory/deployment form preview; emphasize non-zero Guardian and WorldCupViewer requirements.

### 19. `setOperator`

- Mode: **WRITE**
- Schema description: Operator/Guardian: update the day-to-day operator. Guardian access is non-revocable backup control.
- Inputs: `newOperator: address`
- Outputs: none
- Array output: `false`
- Recommended UI: guarded transaction form
- Write safety: place in an Operator/Guardian section, show a transaction confirmation step, and do not imply Polymarket trading execution.

### 20. `upsertMarket`

- Mode: **WRITE**
- Schema description: Operator/Guardian: add or update a World Cup-only Polymarket mapping. This does not trade; it stores metadata for UI/executor workflows.
- Inputs: `index: uint256`, `matchId: uint256`, `teamId: uint256`, `polymarketConditionId: bytes32`, `marketSlug: string`, `label: string`, `active: bool`
- Outputs: none
- Array output: `false`
- Recommended UI: guarded transaction form
- Write safety: place in an Operator/Guardian section, show a transaction confirmation step, and do not imply Polymarket trading execution.

### 21. `refreshSettlement`

- Mode: **WRITE**
- Schema description: Operator/Guardian: query WorldCupViewer and store the latest settlement snapshot for a match/group/champion.
- Inputs: `matchId: uint256`
- Outputs: `matchId: uint256`, `matchName: string`, `isResolved: bool`, `teamId: uint256`, `teamName: string`
- Array output: `false`
- Recommended UI: guarded action form + returned result card
- State handling: use the shared World Cup result block. Show `Pending` when `isResolved=false` or `teamId=0`; show `Resolved` with `teamName` when `isResolved=true`. Reserved `teamId` values are `49 = others` and `50 = draw`.
- Write safety: place in an Operator/Guardian section, show a transaction confirmation step, and do not imply Polymarket trading execution.

## Implementation notes for a future React renderer

```ts
type MethodCardKind = 'read-card' | 'write-form' | 'array-table';

function classify(method) {
  if (method.isOutputArray) return 'array-table';
  if (method.isWriteMethod) return 'write-form';
  return 'read-card';
}
```

Field type mapping:

| Schema `fieldType` | UI input/output treatment |
|---|---|
| `address` | address field with checksum display and copy button |
| `uint256` | numeric input for forms; monospaced numeric chip in results |
| `string` | text input / copyable text result |
| `bool` | switch for inputs; green/amber/red badge for outputs |
| `bytes32` | fixed-width hex input; truncated monospace cell with copy button |
| `FieldDescriptor[]` | nested schema table; render each descriptor as field name/type/description |

The renderer should not invent balances, Polymarket positions, trades, or settlement results. If live RPC data is unavailable, display honest loading/empty states based on the schema only.
