# Real World Cup betting layer plan

Status: design/implementation plan, not deployed.

## Direct answer

Yes: if users must really bet and later claim winnings, this should be a new Foundry-style smart-contract layer, not a small tweak to the current tax-revenue vault.

The current factory/vault is a Flap tax vault: token launch, tax revenue receipt, WorldCupViewer reads, and metadata. A real betting product needs escrow, market lifecycle, odds/pool accounting, settlement, claims, and stronger safety rules. Mixing that directly into the current tax vault would make it harder to audit and could risk tax revenue and user betting funds sharing unsafe logic.

## Product model

Use a pari-mutuel pooled model for MVP:

- Users bet BNB on an outcome.
- Funds stay escrowed in the betting vault.
- Bets close before the match starts.
- After WorldCupViewer resolves the match, the operator/trigger calls settlement.
- Winners claim their proportional share of the losing side minus protocol fee.

Do not claim that this trades Polymarket unless a separate off-chain Polymarket execution/custody system is designed. For now Polymarket can remain metadata/reference only.

## Contract split

Recommended new package:

```text
foundry/worldcup-betting/
  src/WorldCupBettingVault.sol
  src/WorldCupBettingVaultFactory.sol
  src/interfaces/IWorldCupViewer.sol
  test/WorldCupBettingVault.t.sol
  script/DeployWorldCupBetting.s.sol
```

If `forge` is unavailable locally, keep the same structure but compile via `solc` scripts until Foundry is installed.

## Core contract: WorldCupBettingVault

State per market:

```solidity
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
    uint256[] outcomeTeamIds;
    MarketStatus status;
    uint256 winningTeamId;
    uint256 totalPool;
    uint256 feeBps;
}
```

User accounting:

```solidity
mapping(uint256 marketId => mapping(uint256 teamId => uint256 pool)) outcomePool;
mapping(uint256 marketId => mapping(address user => mapping(uint256 teamId => uint256 amount))) userBets;
mapping(uint256 marketId => mapping(address user => bool claimed)) claimed;
```

Main functions:

```solidity
createMarket(...)
openMarket(marketId)
placeBet(marketId, teamId) payable
lockMarket(marketId)
resolveMarket(marketId)
claim(marketId)
cancelMarket(marketId)
refund(marketId)
```

UI schema must expose only user-safe methods:

Read:
- `marketCount`
- `getMarket`
- `getOutcomePool`
- `getUserBet`
- `claimable`
- `getTeamName`

Write:
- `placeBet`
- `claim`
- `refund`

Advanced/operator:
- `createMarket`
- `openMarket`
- `lockMarket`
- `resolveMarket`
- `cancelMarket`

## Settlement source

WorldCupViewer is the settlement source:

- Tournament winner: `getWorldCupWinner()` for `viewerMatchId = 1`.
- Group winner: `getGroupMatchWinners(viewerMatchId)` for `viewerMatchId` 2 through 13.
- Match winner/draw: `getMatchResult(viewerMatchId)` for normal fixtures.

Important: WorldCupViewer docs expose result fields but not match start/deadline times. Therefore `openTime`, `closeTime`, and `resolveAfter` must be operator-created metadata from official schedule research.

## Trigger Service usage

Use Flap Trigger Service only as an automation helper:

- schedule `lockMarket(marketId)` at closeTime;
- schedule `resolveMarket(marketId)` at resolveAfter;
- tolerate late execution because trigger time is a lower bound, not an exact guarantee.

The contract must also allow manual operator/guardian calls if triggers fail.

## Initial sensible events

Use early confirmed group-stage events, because they are easy to understand and have real teams/times.

Initial MVP market set:

1. Match 1: Mexico vs South Africa
   - Date: 2026-06-11
   - Venue: Estadio Azteca, Mexico City
   - Market: match winner / draw
   - Outcomes: Mexico, South Africa, Draw
   - Source found: public 2026 FIFA World Cup schedule references list Mexico vs South Africa as Match 1.

2. Match 2: South Korea vs Czechia
   - Date: 2026-06-11
   - Venue: Estadio Akron, Zapopan
   - Market: match winner / draw
   - Outcomes: South Korea, Czechia, Draw

3. Match 3: Canada vs Bosnia and Herzegovina
   - Date: 2026-06-12
   - Venue: BMO Field, Toronto
   - Market: match winner / draw
   - Outcomes: Canada, Bosnia and Herzegovina, Draw

4. Tournament winner
   - viewerMatchId: 1
   - Market: champion prediction
   - Outcomes: a curated list of top teams plus Others if needed.
   - This can be open longer, but must close before knockout/final rules chosen by product.

5. Group winners
   - viewerMatchId: 2 through 13
   - Market: group winner
   - Outcomes: teams in each group.
   - Safer than all 104 matches for MVP.

## Team IDs from WorldCupViewer docs

Known examples from docs/reference:

- Mexico: 1
- South Africa: 2
- South Korea: 3
- Czechia: 4
- Canada: 5
- Bosnia and Herzegovina: 6
- Qatar: 7
- Switzerland: 8
- Brazil: 9
- Morocco: 10
- USA: 13
- Spain: 29
- France: 33
- Argentina: 37
- Portugal: 41
- England: 45
- Others: 49
- Draw: 50

## Safety requirements

Before real user betting deploy:

- No guardian/operator can steal active user escrow.
- Emergency recovery must exclude active market pools or require cancellation/refund first.
- `placeBet` must reject after `closeTime` or non-open status.
- `resolveMarket` must reject unresolved WorldCupViewer results.
- `claim` must be idempotent and protected from reentrancy.
- Cancelled market users get principal back.
- Fee handling must be explicit and capped.
- UI must show legal/risk copy: users can lose funds; settlement depends on Flap WorldCupViewer; no Polymarket trade execution unless separately implemented.

## Next implementation tasks

1. Create Foundry-style contract package.
2. Implement `WorldCupBettingVault` with pari-mutuel BNB escrow.
3. Implement UI schema for betting methods.
4. Implement factory compatible with Flap VaultFactory V2.2 if it must be used through launch UI.
5. Add tests:
   - create/open/lock market;
   - place bet before/after close;
   - resolve winner;
   - winner claim math;
   - loser claim zero;
   - cancel/refund;
   - fee cap;
   - no active escrow emergency drain.
6. Add event seed script for initial World Cup markets.
7. Build public UI bet slip and market board.
8. Run audit pass before deploying with real user funds.
