# Polyflap World Cup V2 Mainnet Handoff

## Status

V2 is deployed on BNB Smart Chain mainnet, seeded, connected to the final Flap token/vault launch, and verified by RPC readback.

## Current Final Launch Addresses

Network: BNB Smart Chain mainnet
Chain ID: 56

POLYFLAP token:

`0xed6dd658F936CcE7bE097C98eA79Bcd36Cb37777`

Flap vault clone:

`0x82fa3c8d11B3E7A26Ab6C8dDb7B8d8281192a4f6`

WorldCupBettingVault V2:

`0x5E14Fd7faC9a3D4386621c1F44BDdB631ee00D7b`

WorldCupPolymarketVault implementation V2:

`0x6B31fA70f11558B226f6eE929CbB4dE407b5B38a`

WorldCupPolymarketVaultBeacon V2:

`0x894bfDA41620D0837cAcB4393968a177519F5D40`

WorldCupPolymarketVaultFactory V2:

`0x7Afff3D66e62B597c9C0431228407F3a0Cf7dbbD`

WorldCupViewer:

`0x00036192958C2aaAF9F445d3Cdc2979995EA333e`

Operator/deployer:

`0xEB155312Eeca8Bbb3600f6e64B09fAd04FeBf9D1`

Guardian:

`0x9e27098dcD8844bcc6287a557E0b4D09C86B8a4b`

Fee wallet:

`0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e`

## Why V2

- Previous deployment did not have the final seeded/live market state.
- V2 adds Flap UI-compatible betting reward claim wrappers:
  - `claimBettingTaxRewards()`
  - `claimBettingEpochTaxRewards(uint256 epoch)`
- V2 BettingVault adds claim-for helpers that always pay the target user:
  - `claimTaxRewardsFor(address user)`
  - `claimEpochTaxRewardsFor(uint256 epoch, address user)`
- The reward eligibility logic requires:
  - more than / at least 1000 POLYFLAP per contract threshold, and
  - at least one active bet.

## Deploy Transactions

WorldCupBettingVault V2:

`0x3da5ed9891f89d523f4a091be520a217873b781648f29a3c5cef888b4f399f6e`

WorldCupPolymarketVault implementation V2:

`0xb14b35ec883dae2f945b3fec0fd0599c68f1976d80a957626f685b9d0409e978`

WorldCupPolymarketVaultBeacon V2:

`0xea14a4f8be4cb2bed2689012acfcd18a1aad924a4371c9c6026095f5b70f1d93`

WorldCupPolymarketVaultFactory V2:

`0x24216b0c9de47646ba4c27ffc0df52366952e1381da581f2b94c0b2ac5e1c189`

setPolyflapToken transaction:

`0x76307c930539a1716cfd02eea3a01407a8c40cab0ec283605a7a19bc5173ade8`

## RPC Verification Snapshot

Verified after final token/vault launch:

- `beacon.implementation()` = `0x6B31fA70f11558B226f6eE929CbB4dE407b5B38a`
- `factory.beacon()` = `0x894bfDA41620D0837cAcB4393968a177519F5D40`
- `factory.isQuoteTokenSupported(address(0))` = `true`
- `bettingVault.marketCount()` = `85`
- market status counts:
  - `Open`: 61
  - `Locked`: 24
- tradable markets: 61
- `bettingVault.operator()` = `0xEB155312Eeca8Bbb3600f6e64B09fAd04FeBf9D1`
- `bettingVault.polyflapToken()` = `0xed6dd658F936CcE7bE097C98eA79Bcd36Cb37777`
- Flap vault `vaultUISchema()`:
  - `vaultType`: `WorldCupPolymarketVault`
  - method count: 28
  - includes `claimableBettingTaxRewards`
  - includes `claimBettingTaxRewards`
  - includes `claimBettingEpochTaxRewards`

## Final Web Env

```text
VITE_FLAP_TOKEN_ADDRESS=0xed6dd658F936CcE7bE097C98eA79Bcd36Cb37777
VITE_FLAP_VAULT_ADDRESS=0x82fa3c8d11B3E7A26Ab6C8dDb7B8d8281192a4f6
VITE_FLAP_VAULT_FACTORY_ADDRESS=0x7Afff3D66e62B597c9C0431228407F3a0Cf7dbbD
VITE_FLAP_VAULT_IMPLEMENTATION_ADDRESS=0x6B31fA70f11558B226f6eE929CbB4dE407b5B38a
VITE_FLAP_VAULT_BEACON_ADDRESS=0x894bfDA41620D0837cAcB4393968a177519F5D40
VITE_BETTING_VAULT_ADDRESS=0x5E14Fd7faC9a3D4386621c1F44BDdB631ee00D7b
VITE_WORLD_CUP_VIEWER_ADDRESS=0x00036192958C2aaAF9F445d3Cdc2979995EA333e
VITE_BETTING_VAULT_DEPLOY_BLOCK=104644915
```

## Flap Launch Inputs Used

Factory:

`0x7Afff3D66e62B597c9C0431228407F3a0Cf7dbbD`

worldCupViewer:

`0x00036192958C2aaAF9F445d3Cdc2979995EA333e`

operator:

`0xEB155312Eeca8Bbb3600f6e64B09fAd04FeBf9D1`

bettingVault:

`0x5E14Fd7faC9a3D4386621c1F44BDdB631ee00D7b`

Raw ABI-encoded vaultData:

`0x00000000000000000000000000036192958c2aaaf9f445d3cdc2979995ea333e000000000000000000000000eb155312eeca8bbb3600f6e64b09fad04febf9d10000000000000000000000005e14fd7fac9a3d4386621c1f44bddb631ee00d7b`

## Verification Commands Used

```bash
npm run build
npm run test:worldcup
```

Both passed after final token/vault env update.

A read-only `placeBet` simulation against the first tradable market succeeded.
