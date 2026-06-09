# Flap WorldCupPolymarketVault - Clean UI Mainnet Handoff

Network: BNB Smart Chain mainnet
Chain ID: 56
Timestamp: 2026-06-09

## Deployer / temporary operator

0xEB155312Eeca8Bbb3600f6e64B09fAd04FeBf9D1

WARNING: the deployer/private key used for this launch was pasted into chat and must be treated as compromised. Do not fund it beyond the launch flow. Rotate operator/guardian roles after launch where possible.

## Contracts to use

### 1. WorldCupBettingVault auxiliary betting/reward contract

Address:
0x0729614f2775b99d7825bf76405e38b10529ddb0

Deploy tx:
0xc5762a25a02f9dce1d445ebf81f1e5cbbae9bea1854b460b5c5205e7a2c6e8ab

Source:
foundry/worldcup-betting/src/WorldCupBettingVault.sol

Constructor config:
- worldCupViewer: 0x00036192958C2aaAF9F445d3Cdc2979995EA333e
- guardian: 0xEB155312Eeca8Bbb3600f6e64B09fAd04FeBf9D1
- operator: 0xEB155312Eeca8Bbb3600f6e64B09fAd04FeBf9D1

Deployment JSON:
foundry/worldcup-betting/deployments/bsc-mainnet-0x0729614f2775b99d7825bf76405e38b10529ddb0.json

Seed status:
- seeded: false
- opened: false
- marketCount: 0

### 2. WorldCupPolymarketVault implementation with clean user UI schema

Address:
0x0911b91091baca955d1b71ccf5295daa78838035

Deploy tx:
0xeb310052a8fd8d7208c2a9240f19486b236ce3d49fd625d673c97a002c04cd8a

Source:
contracts/WorldCupPolymarketVault.sol

On-chain UI schema:
- vaultType: WorldCupPolymarketVault
- methodCount: 18
- clean user-facing methods only; admin/emergency functions intentionally hidden from vaultUISchema().

### 3. WorldCupPolymarketVaultFactory - give this to Flap / use for launch

Address:
0x8257f357cee6c3ee77f5b89818d9ee9bfecd72f6

Deploy tx:
0x87675e967f562433180b3e7a1467d985be9e6ecd203e7752f059b8dbd442d0e7

Source:
contracts/WorldCupPolymarketVault.sol
contract WorldCupPolymarketVaultFactory

Deployment JSON:
deployments/bsc-mainnet-flap-factory-0x8257f357cee6c3ee77f5b89818d9ee9bfecd72f6.json

Factory readback:
- implementation(): 0x0911B91091bACa955D1b71ccF5295DAa78838035
- isQuoteTokenSupported(0x0000000000000000000000000000000000000000): true
- vaultDataSchema fields:
  1. worldCupViewer address
  2. operator address
  3. bettingVault address
- vaultDataSchema.isArray: false
- tokenCreationPolicies count: 1

## On-chain verification

Code sizes read back from BSC mainnet:
- betting: 10502 bytes
- implementation: 19571 bytes
- factory: 4883 bytes

Implementation vaultUISchema() readback methods:
1. description
2. totalRevenueReceived
3. taxToken
4. bettingVault
5. bettingMarketCount
6. totalBettingRewardShares
7. totalTaxRewardsReceivedByBetting
8. claimableBettingTaxRewards
9. lastSettlementResolved
10. lastSettlementTeamName
11. getWorldCupWinner
12. getGroupWinner
13. getMatchResult
14. getTeamName
15. marketCount
16. getMarket
17. getMarkets
18. getMarketTiming

Betting vault readback:
- worldCupViewer: 0x00036192958C2aaAF9F445d3Cdc2979995EA333e
- guardian: 0xEB155312Eeca8Bbb3600f6e64B09fAd04FeBf9D1
- operator: 0xEB155312Eeca8Bbb3600f6e64B09fAd04FeBf9D1
- marketCount: 0
- totalTaxRewardsReceived: 0

## Flap launch inputs

Use factory address:
0x8257f357cee6c3ee77f5b89818d9ee9bfecd72f6

Recommended form fields:

worldCupViewer:
0x0000000000000000000000000000000000000000

operator:
0x0000000000000000000000000000000000000000

bettingVault:
0x0729614f2775b99d7825bf76405e38b10529ddb0

Meaning:
- worldCupViewer zero -> factory uses default BSC WorldCupViewer 0x00036192958C2aaAF9F445d3Cdc2979995EA333e
- operator zero -> clone operator becomes the token creator
- bettingVault -> connected betting/reward vault above

Raw vaultData if using zero worldCupViewer and creator-as-operator:
0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000729614f2775b99d7825bf76405e38b10529ddb0

Raw vaultData if using deployer as explicit operator:
0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000eb155312eeca8bbb3600f6e64b09fad04febf9d10000000000000000000000000729614f2775b99d7825bf76405e38b10529ddb0

## Local checks passed before/after deploy

npm run validate:schema
npm run compile:betting
npm run compile:clone-factory

Results:
- schema validator passed with 18 UI methods + 3 vaultData fields
- betting compile passed: creation=11022 bytes, deployed=10502 bytes, abi=51
- Flap implementation/factory compile passed: implementation deployed=19571 bytes, factory deployed=4883 bytes

## Important notes

- The old factory 0xbf4fc44eedc13aff33633d29383323068d348125 points to the old admin-heavy UI implementation. Do not use it for the final launch.
- Use the new factory 0x8257f357cee6c3ee77f5b89818d9ee9bfecd72f6.
- Betting markets were not seeded this time to save gas and avoid demo clutter. Create real markets separately after the token/vault launch.
- Because the deployer key is compromised, rotate operator after launch if the created clone/operator model allows it.
