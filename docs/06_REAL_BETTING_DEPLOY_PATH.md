# Real betting deploy path

## Executive answer

The current repository is a strong MVP for a Flap auto-renderable World Cup vault, but it is not yet a real-betting system.

For real betting, deploy the product in two clearly separated layers:

1. **BSC / Flap layer:** a production `WorldCupPolymarketVault` plus a production `WorldCupPolymarketVaultFactory` integrated with Flap's real V2/V2.2 Vault/Factory base contracts. This layer receives BNB tax-token revenue, exposes `vaultUISchema()`, stores World Cup market metadata, reads `WorldCupViewer`, and lets users/operators submit BSC transactions through Privy embedded wallets.
2. **Polymarket execution layer:** a separate Polygon/Polymarket executor or manual operations process with USDC custody, CLOB/order handling, compliance controls, reconciliation, and audit coverage. This layer is **not** provided by the current BSC vault and must not be implied by the MVP.

The first production deploy should therefore be honest: Flap users can launch and interact with a World Cup betting-themed vault on BSC, but actual Polymarket order placement remains off-chain / outside the vault until a separate audited executor exists.

## Current MVP inventory

The current contract package contains:

- `contracts/WorldCupPolymarketVault.sol`
  - Implements local Flap-style UI schema structs.
  - Accepts BNB through `receive()` and tracks `totalRevenueReceived`.
  - Stores curated World Cup Polymarket metadata through `MarketMapping` rows.
  - Reads BSC `WorldCupViewer` through `getWorldCupWinner`, `getGroupWinner`, `getMatchResult`, and `getTeamName`.
  - Stores the latest settlement snapshot through `refreshSettlement(matchId)`.
  - Exposes `vaultUISchema()` with 21 auto-renderable methods.
  - Exposes a local `vaultDataSchema()` note for launch-form fields.
- `WorldCupPolymarketVaultFactoryStub`
  - Decodes `LaunchConfig` from `vaultData`.
  - Requires non-zero `guardian` and `worldCupViewer`.
  - Deploys the MVP vault.
  - Documents the desired V2.2 factory validation path, but does not inherit Flap's real factory base.

This is enough for schema review, UI preview, and local Solidity compilation. It is not enough for a production Flap launch or real Polymarket betting.

## Contracts needed before real betting

### 1. Production `WorldCupPolymarketVault`

Replace the MVP's local schema declarations with official imports from the Flap vault repository once the exact Flap package/address set is locked.

Production duties:

- Extend the correct Flap `VaultBaseV2` / current vault base instead of being a standalone contract.
- Keep required Flap vault behavior:
  - `description()` dynamic status.
  - `receive()` for BNB revenue.
  - Flap Guardian as a non-revocable backup authority for permissioned operations.
  - `vaultUISchema()` for auto-rendered read/write UI.
- Keep World Cup-specific behavior:
  - Immutable `worldCupViewer` address.
  - `MarketMapping` metadata rows with `matchId`, `teamId`, `polymarketConditionId`, `marketSlug`, `label`, and `active`.
  - `refreshSettlement(matchId)` that reads `WorldCupViewer` and stores a latest BSC settlement snapshot.
- Keep Polymarket wording strict:
  - The vault stores Polymarket metadata only.
  - It does not place orders, custody positions, bridge assets, or claim winnings.

Recommended production additions before mainnet:

- Explicit event coverage for every state-changing action.
- Optional mapping validation helpers, for example rejecting empty slugs or impossible match/team IDs where possible.
- Clear role model: `guardian` as permanent backup, `operator` as day-to-day metadata/settlement curator.
- Optional pause/disable flag for market curation if Flap base contracts do not already provide a safety pause.
- Optional withdraw/routing logic only if Flap's vault model expects it; do not invent payout logic without Flap review.

### 2. Production `WorldCupPolymarketVaultFactory`

The MVP stub must become a real Flap factory.

Production duties:

- Extend the correct Flap `VaultFactoryBaseV2` / V2.2 factory base.
- Expose `vaultDataSchema()` so Flap's launch UI can render the required launch form.
- Implement V2.2 validation through `onBeforeLaunch(bytes)` / `_validateBeforeLaunch(bytes)` rather than relying only on informational policy structs.
- Deploy `WorldCupPolymarketVault` with decoded launch config.
- Emit deployment metadata that makes the new vault discoverable by Flap and the app.

Recommended `vaultData` shape:

```solidity
struct LaunchConfig {
  address taxToken;
  address guardian;
  address worldCupViewer;
  address operator;
}
```

Minimum validation:

- `guardian != address(0)`.
- `worldCupViewer != address(0)`.
- `worldCupViewer` should equal the approved BSC mainnet Viewer address for production unless a testnet/staging config is explicitly being deployed.
- `operator` can be zero, but then the factory or vault must deterministically fall back to the launcher or configured operator.
- If `taxToken` is known at launch, require it to match the Flap-launched token context.
- If launch-time market mappings are added later, validate tuple shape and reject obviously empty or non-World-Cup rows; do not treat a slug as proof of Polymarket legitimacy.

Recommended launch-form copy:

> Launches a World Cup-only Flap vault on BSC. The vault receives BNB tax revenue, reads Flap WorldCupViewer for settlement state, and stores Polymarket market metadata. It does not trade or settle Polymarket positions from BSC.

### 3. Optional initial-market seeder

If the app wants markets preloaded at launch, add either:

- Factory support for an array of initial `MarketMapping` tuples in `vaultData`, with `VaultDataSchema.isArray = true`, or
- A post-deploy operator script that calls `upsertMarket(...)` for each curated market.

For the first safer deploy, prefer a post-deploy seeder. It keeps the factory simple and lets the operator fix metadata without redeploying the vault.

### 4. Optional Trigger Service consumer

Only add this if scheduled refreshes are needed before launch.

The Trigger Service can coordinate BSC callbacks after match dates, but it does not give precise timing and it should not execute Polymarket trades. If added, the vault should store trigger request metadata and expose a bounded callback that only calls `refreshSettlement(matchId)` or an equivalent internal refresh.

Flap Trigger facts to preserve:

- BSC mainnet Trigger Service: `0xcf4EE25035CF883895110f367F5BA8172416a7F9`.
- Current documented trigger request fee: `0.0002 BNB`.
- Max callback gas: `2,000,000`.
- `executeAfter` is a lower bound; callbacks can be late or retried.

### 5. Separate Polymarket executor or manual operations system

This is required for actual Polymarket betting.

A real executor must be designed separately because Polymarket is not a BSC-native Flap vault. At minimum it needs:

- Polygon / Polymarket-compatible wallet custody.
- USDC funding and accounting.
- CLOB API / order placement integration.
- Position custody and reconciliation.
- Market-condition mapping from the BSC vault's metadata to Polymarket's market/condition IDs.
- Human approval or audited automation policy for every trade.
- Post-trade records written somewhere verifiable: database, signed report, event log, or a separate on-chain attestation bridge.
- Claims/settlement workflow on Polymarket's side.
- Compliance/legal review for betting, custody, and user-facing financial claims.

This executor can read BSC vault events and metadata, but it should not be represented as part of the BSC vault until it exists and passes security review.

## Deploy sequence

### Phase 0 — lock external addresses and roles

Before deploying anything, lock these values:

- BSC mainnet `WorldCupViewer`: `0x00036192958C2aaAF9F445d3Cdc2979995EA333e`.
- Real Flap Guardian address for BSC.
- Flap vault/factory base package and deployed registry expectations.
- Day-to-day operator address.
- Whether `taxToken` is known at factory launch time or injected by Flap's token-launch flow.
- Whether initial market mappings are seeded at launch or after deployment.

### Phase 1 — productionize and audit the factory/vault

1. Replace local Flap schema structs with official Flap imports.
2. Make the vault inherit the correct Flap vault base.
3. Make the factory inherit the correct Flap factory base.
4. Implement `vaultDataSchema()` on the factory.
5. Implement V2.2 validation through `onBeforeLaunch(bytes)` / `_validateBeforeLaunch(bytes)`.
6. Keep `vaultUISchema()` complete and auto-renderable.
7. Compile and run schema validation.
8. Security review the role model, `receive()`, settlement refresh path, and all write methods.

### Phase 2 — staging deploy

1. Deploy the production factory to a BSC testnet/staging target if Flap supports that environment.
2. Use the Flap launch UI or a scripted equivalent to encode `vaultData`:
   - `taxToken`.
   - `guardian`.
   - `worldCupViewer`.
   - `operator`.
3. Launch a staging vault through the factory.
4. Confirm `description()`, `vaultUISchema()`, `vaultDataSchema()`, and every read method work.
5. Confirm unauthorized wallets cannot call `setOperator`, `upsertMarket`, or `refreshSettlement` if those are intended to be operator/Guardian-only.
6. Seed one or two market mappings through `upsertMarket(...)` from an authorized operator.
7. Refresh a known match/group/champion ID and verify events and stored state.

### Phase 3 — BSC mainnet deploy

1. Deploy the audited production factory to BSC mainnet.
2. Register/connect it with Flap according to Flap's factory process.
3. Launch the token/vault through the Flap launch flow using the production `vaultData`.
4. Verify the deployed vault address and constructor values:
   - `guardian()`.
   - `operator()`.
   - `worldCupViewer()`.
   - `taxToken()`.
5. Verify `vaultUISchema()` returns the expected method set.
6. Publish the vault ABI/address to the frontend config.
7. Seed curated World Cup market mappings, if approved.
8. Announce clearly that Polymarket execution is not direct/on-chain in this deploy.

### Phase 4 — only then design real Polymarket execution

Do not start taking real Polymarket bets until the separate executor/custody path is designed.

A safe next milestone would be:

1. Operator exports BSC vault metadata and planned trade intent.
2. Human approves the trade plan.
3. Executor places Polymarket orders with a segregated Polygon/USDC wallet.
4. Executor records order IDs/fills/positions in an auditable backend.
5. App shows those records as external execution records, not as BSC contract state.
6. Settlement/claiming on Polymarket is handled by that executor, while BSC `WorldCupViewer` remains the Flap vault's sports-result reference.

## What transaction functions users will call

### Read-only calls: no wallet required

These should be called through a public BSC RPC client, not through Privy signing:

- `description()` — show dynamic vault summary.
- `vaultUISchema()` — render the Flap interaction UI.
- `vaultDataSchema()` / factory `vaultDataSchema()` — render launch form.
- `taxToken()` — show configured tax token.
- `guardian()` — show backup authority.
- `worldCupViewer()` — show settlement source.
- `operator()` — show day-to-day operator.
- `totalRevenueReceived()` — show cumulative BNB revenue received.
- `lastSettlementMatchId()` / `lastSettlementTeamId()` / `lastSettlementTeamName()` / `lastSettlementResolved()` — show stored settlement snapshot.
- `getWorldCupWinner()` — read champion result, match ID `1`.
- `getGroupWinner(matchId)` — read group winner, match IDs `2` through `13`.
- `getMatchResult(matchId)` — read any WorldCupViewer match result.
- `getTeamName(teamId)` — resolve a team label.
- `marketCount()` — count curated metadata rows.
- `getMarket(index)` — read one metadata row.
- `getMarkets(offset, limit)` — read paginated metadata rows.

### User / launcher write calls

Normal app users should generally not mutate vault metadata. The write calls they may encounter are:

#### Launching through the production factory

Caller: token launcher / Flap launch flow.

Function shape:

```solidity
factory.launch(bytes vaultData)
```

or the equivalent official Flap token-launch function that calls the factory internally.

Expected user action:

1. User fills the launch form rendered from `vaultDataSchema()`.
2. App encodes `LaunchConfig` as `vaultData`.
3. Privy embedded wallet switches to BSC chain ID `56`.
4. User reviews the transaction.
5. User signs with the embedded wallet.
6. Transaction pays BSC gas in BNB and deploys/attaches the vault.

#### Sending BNB to the vault

Caller: token revenue routing contract, Flap tax-token flow, or explicit test deposit.

Function shape:

```solidity
receive() external payable
```

Expected user action:

- Most real revenue should arrive automatically through Flap/tax-token routing, not through manual user deposits.
- If the app exposes a test deposit button, it must be labeled as a BNB deposit to the vault, not as a Polymarket bet.
- The transaction requires BNB for gas and `msg.value` for the deposited amount.

### Operator / Guardian write calls

Only authorized operator/Guardian wallets should be able to call these:

#### `setOperator(address newOperator)`

Purpose: rotate day-to-day operator.

Required signer: current `operator` or `guardian`.

User-facing copy:

> Updates who can curate World Cup market metadata and refresh settlement snapshots. Does not affect Polymarket custody or orders.

#### `upsertMarket(...)`

Function:

```solidity
upsertMarket(
  uint256 index,
  uint256 matchId,
  uint256 teamId,
  bytes32 polymarketConditionId,
  string marketSlug,
  string label,
  bool active
)
```

Purpose: add/update a curated market metadata row.

Required signer: `operator` or `guardian`.

Important product rule:

- This is not a bet.
- This is not an order.
- This does not bridge USDC.
- This does not create or settle a Polymarket position.
- It only stores a World Cup market mapping for UI/research/executor workflows.

#### `refreshSettlement(uint256 matchId)`

Purpose: read Flap `WorldCupViewer` and store the latest settlement snapshot.

Required signer: `operator` or `guardian` in the current MVP.

Match IDs:

- `1` means overall World Cup winner via `getWorldCupWinner()`.
- `2` through `13` mean Group A through Group L via `getGroupMatchWinners(matchId)`.
- Other IDs call `getMatchResult(matchId)`.

Important product rule:

- This updates BSC-visible settlement state from Flap's viewer.
- It does not claim Polymarket winnings.
- It does not prove that Polymarket's market wording exactly matches the Flap result.

## How Privy embedded wallets sign and pay

Privy is the frontend wallet/auth layer, not a betting engine.

Recommended production flow:

1. User clicks `Continue with Google`.
2. Privy authenticates through Google OAuth.
3. Privy creates or loads an embedded EVM wallet with `embeddedWallets.ethereum.createOnLogin: 'users-without-wallets'`.
4. App finds the embedded wallet through `useWallets()`.
5. App switches the wallet to BSC:

```ts
await wallet.switchChain(56)
```

6. App checks BNB balance on BSC.
7. If balance is too low, app shows a funding flow or deposit address.
8. For read-only vault state, app uses a public BSC client and does not ask the user to sign.
9. For write calls, app uses the Privy EIP-1193 provider with viem or ethers.
10. User reviews the exact method, arguments, and expected effect.
11. User signs and pays BSC gas in BNB.

Viem write skeleton:

```ts
import {createWalletClient, custom} from 'viem';
import {bsc} from 'viem/chains';

async function writeVault(wallet, address, abi, functionName, args, value) {
  await wallet.switchChain(bsc.id);
  const provider = await wallet.getEthereumProvider();
  const client = createWalletClient({chain: bsc, transport: custom(provider)});
  const [account] = await client.getAddresses();

  return client.writeContract({
    account,
    address,
    abi,
    functionName,
    args,
    value,
  });
}
```

Funding rules:

- Users need BNB on BSC for gas.
- Users need extra BNB if a function sends `msg.value`.
- The current metadata writes do not require ERC-20 approvals.
- Do not ask users to approve USDC/Polygon/Polymarket spending from the BSC vault UI; that would be a separate executor flow.
- Never auto-submit a transaction immediately after login. Login and wallet creation are not transaction consent.

## How WorldCupViewer settlement is used

`WorldCupViewer` is the BSC truth source for the vault's World Cup result display.

Production address for BSC mainnet:

```text
0x00036192958C2aaAF9F445d3Cdc2979995EA333e
```

Returned struct:

```solidity
struct MatchViewResult {
  uint256 matchId;
  string matchName;
  bool isResolved;
  uint256 teamId;
  string teamName;
}
```

Vault usage:

- `getWorldCupWinner()` proxies `worldCupViewer.getWorldCupWinner()` for match ID `1`.
- `getGroupWinner(matchId)` proxies `worldCupViewer.getGroupMatchWinners(matchId)` for group IDs `2` through `13`.
- `getMatchResult(matchId)` proxies `worldCupViewer.getMatchResult(matchId)` for arbitrary match IDs.
- `getTeamName(teamId)` proxies `worldCupViewer.getTeamName(teamId)`.
- `refreshSettlement(matchId)` queries the right Viewer method, stores the result in `lastSettlement*`, and emits `SettlementRefreshed`.

Settlement policy:

- The BSC vault follows Flap `WorldCupViewer` for its visible settlement state.
- If a stored Polymarket market has wording that does not exactly match the Viewer result, show a mismatch warning and require operator review.
- Do not let the vault infer a Polymarket claimable outcome from a slug alone.
- Do not use the Flap AI Oracle as final settlement truth; it can be advisory research only.
- If Trigger Service is added, triggers should only refresh BSC settlement state and must tolerate late/retry behavior.

## What is impossible or unsafe about direct Polymarket trading from BSC

Direct Polymarket trading from the current BSC Flap vault is impossible/unsafe for these reasons:

1. **Different venue and chain assumptions.** The vault runs on BSC. Polymarket trading is not a native BSC Flap contract call.
2. **Different asset.** The BSC vault receives/holds BNB tax-token revenue. Polymarket betting requires the correct Polymarket-side USDC/collateral flow, not raw BNB held by a BSC vault.
3. **No bridge/custody contract exists.** The MVP does not bridge BNB to Polygon/USDC, custody Polymarket positions, or manage withdrawals/claims.
4. **No orderbook integration exists.** The vault has no CLOB API integration, order signing, fill tracking, slippage controls, or cancellation logic.
5. **No settlement proof bridge exists.** `WorldCupViewer` proves Flap/BSC World Cup state for this product, not Polymarket's market-resolution state on BSC.
6. **Market wording can differ.** A Polymarket slug/condition may not match the exact `matchId`/`teamId` semantics from Flap's viewer.
7. **Compliance/custody risk.** Taking user funds for betting and executing trades requires legal, custody, and security review. A metadata vault cannot safely imply it handles that.
8. **Privy does not solve Polymarket execution.** Privy gives users an embedded EVM wallet that can sign BSC transactions. It does not automatically give a compliant Polygon/Polymarket trading stack, USDC custody, or order reconciliation.

Therefore, user-facing copy must say:

> The BSC vault stores World Cup market metadata and reads Flap WorldCupViewer settlement state. Actual Polymarket order placement, position custody, and claiming require a separate audited executor and are not included in the current vault deploy.

## Minimal production checklist

Before claiming real betting support:

- [ ] Production vault inherits official Flap vault base.
- [ ] Production factory inherits official Flap factory base.
- [ ] Factory exposes `vaultDataSchema()` and validates launch config through the official V2.2 hook.
- [ ] Real BSC Guardian address is confirmed.
- [ ] BSC `WorldCupViewer` address is confirmed and locked.
- [ ] `vaultUISchema()` renders every read/write function correctly.
- [ ] Unauthorized users cannot mutate operator/market/settlement state.
- [ ] Privy frontend uses BSC-only `defaultChain` / `supportedChains` for the vault flow.
- [ ] Users see BNB gas/funding state before write calls.
- [ ] UI copy labels `upsertMarket` as metadata curation, not betting.
- [ ] UI copy labels `refreshSettlement` as Flap WorldCupViewer refresh, not Polymarket claiming.
- [ ] A separate Polymarket executor/custody design exists if actual order placement is promised.
- [ ] Executor has USDC custody, CLOB/order handling, reconciliation, legal/compliance review, and audit coverage.
- [ ] Public docs explicitly separate BSC settlement state from Polymarket execution.

## Recommended next engineering tasks

1. Replace `WorldCupPolymarketVaultFactoryStub` with a real Flap V2/V2.2 factory once official base imports are available.
2. Add a deploy script that encodes `LaunchConfig` and verifies constructor values after deployment.
3. Add frontend contract-call examples using Privy + viem for launch, read, and authorized writes.
4. Add a metadata seeder script for `upsertMarket(...)` rows.
5. Write a separate Polymarket executor architecture doc before any real order-placement work.
6. Run security review before mainnet deploy.
