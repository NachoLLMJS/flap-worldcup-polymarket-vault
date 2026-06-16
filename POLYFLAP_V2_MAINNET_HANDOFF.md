# Polyflap World Cup V2 Mainnet Handoff

## Status

V2 deployed and seeded on BNB Smart Chain mainnet.

This V2 replaces the previous unseeded betting vault/factory for a serious test.

## Why V2

- Previous new BettingVault had `marketCount = 0`, so all `getMarket(id)` calls reverted with `market missing`.
- Website can show the catalog, but real betting requires on-chain markets.
- V2 adds Flap UI-compatible reward claim wrappers:
  - `claimBettingTaxRewards()`
  - `claimBettingEpochTaxRewards(uint256 epoch)`
- V2 BettingVault adds permissionless claim-for helpers that always pay the target user:
  - `claimTaxRewardsFor(address user)`
  - `claimEpochTaxRewardsFor(uint256 epoch, address user)`

## Deployed Contracts

Network: BNB Smart Chain mainnet
Chain ID: 56
Deployer/operator: `0xEB155312Eeca8Bbb3600f6e64B09fAd04FeBf9D1`
WorldCupViewer: `0x00036192958C2aaAF9F445d3Cdc2979995EA333e`
Guardian: `0x9e27098dcD8844bcc6287a557E0b4D09C86B8a4b`

### WorldCupBettingVault V2

`0x5E14Fd7faC9a3D4386621c1F44BDdB631ee00D7b`

Deploy tx:

`0x3da5ed9891f89d523f4a091be520a217873b781648f29a3c5cef888b4f399f6e`

### WorldCupPolymarketVault implementation V2

`0x6B31fA70f11558B226f6eE929CbB4dE407b5B38a`

Deploy tx:

`0xb14b35ec883dae2f945b3fec0fd0599c68f1976d80a957626f685b9d0409e978`

### WorldCupPolymarketVaultBeacon V2

`0x894bfDA41620D0837cAcB4393968a177519F5D40`

Deploy tx:

`0xea14a4f8be4cb2bed2689012acfcd18a1aad924a4371c9c6026095f5b70f1d93`

### WorldCupPolymarketVaultFactory V2

`0x7Afff3D66e62B597c9C0431228407F3a0Cf7dbbD`

Deploy tx:

`0x24216b0c9de47646ba4c27ffc0df52366952e1381da581f2b94c0b2ac5e1c189`

## Seed Verification

On-chain BettingVault V2 readback:

- `marketCount`: 85
- `Open`: 23
- `Draft`: 62
- `polyflapToken`: `0x0000000000000000000000000000000000000000` pending token launch

Open markets currently:

- 1: 2026 FIFA World Cup Winner
- 2-13: Group A-L Winner
- 76: Cape Verde vs Saudi Arabia
- 77: Uruguay vs Spain
- 78: Egypt vs Iran
- 79: New Zealand vs Belgium
- 80: Croatia vs Ghana
- 81: Panama vs England
- 82: Colombia vs Portugal
- 83: DR Congo vs Uzbekistan
- 84: Jordan vs Argentina
- 85: Algeria vs Austria

## Flap Launch Inputs

Use this factory for the new token launch:

`0x7Afff3D66e62B597c9C0431228407F3a0Cf7dbbD`

Factory form fields:

worldCupViewer:

`0x00036192958C2aaAF9F445d3Cdc2979995EA333e`

operator:

`0xEB155312Eeca8Bbb3600f6e64B09fAd04FeBf9D1`

bettingVault:

`0x5E14Fd7faC9a3D4386621c1F44BDdB631ee00D7b`

Raw ABI-encoded vaultData:

`0x00000000000000000000000000036192958c2aaaf9f445d3cdc2979995ea333e000000000000000000000000eb155312eeca8bbb3600f6e64b09fad04febf9d10000000000000000000000005e14fd7fac9a3d4386621c1f44bddb631ee00d7b`

## After token/vault launch

After launching the token through Flap/Foundry, provide:

- new Flap token address
- new Flap vault address

Then run:

```bash
cast send 0x5E14Fd7faC9a3D4386621c1F44BDdB631ee00D7b \
  "setPolyflapToken(address)" TOKEN_ADDRESS \
  --rpc-url "https://bsc-dataseed.binance.org" \
  --private-key "$PRIVATE_KEY"
```

Also update website env:

```text
VITE_FLAP_TOKEN_ADDRESS=TOKEN_ADDRESS
VITE_FLAP_VAULT_ADDRESS=FLAP_VAULT_ADDRESS
```

## Website env currently updated

- `VITE_FLAP_VAULT_FACTORY_ADDRESS=0x7Afff3D66e62B597c9C0431228407F3a0Cf7dbbD`
- `VITE_FLAP_VAULT_IMPLEMENTATION_ADDRESS=0x6B31fA70f11558B226f6eE929CbB4dE407b5B38a`
- `VITE_FLAP_VAULT_BEACON_ADDRESS=0x894bfDA41620D0837cAcB4393968a177519F5D40`
- `VITE_BETTING_VAULT_ADDRESS=0x5E14Fd7faC9a3D4386621c1F44BDdB631ee00D7b`
- `VITE_WORLD_CUP_VIEWER_ADDRESS=0x00036192958C2aaAF9F445d3Cdc2979995EA333e`
- `VITE_BETTING_VAULT_DEPLOY_BLOCK=104644915`

Token/vault fields are intentionally blank until the new Flap launch is complete.
