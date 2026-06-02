# Real betting fee route and web connection

## Betting fee

The BNB betting vault now uses a fixed protocol fee:

- `PROTOCOL_FEE_BPS = 100`
- fee = 1% of every `placeBet` transaction
- recipient = `0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e`
- the fee is sent directly inside `placeBet`, not accrued for later guardian withdrawal
- the pari-mutuel pool stores only the net stake after the 1% fee

Example:

- user sends `1.00 BNB`
- `0.01 BNB` goes directly to `0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e`
- `0.99 BNB` enters the market pool

## Web connection

The frontend now reads:

- `VITE_FLAP_VAULT_ADDRESS` for the Flap/UI-schema/tax vault
- `VITE_BETTING_VAULT_ADDRESS` for the real BNB betting vault

When `VITE_BETTING_VAULT_ADDRESS` is configured and the user has a Privy embedded EVM wallet, the bet slip calls:

```solidity
placeBet(uint256 marketId, uint256 teamId)
```

on BSC with native BNB value.

If the betting vault address is empty, the UI still renders the Chinese-style market floor and fee preview, but disables signing honestly.

## UI changes

Removed the client-facing `Real integration status` section.

Added a more client-facing Chinese/animated style:

- red/gold dragon theme
- floating lantern animation
- Chinese market labels
- simplified wallet + market + schema sections
- visible `Vault UI Schema` appendix for the Flap vault functions

## Verification

Commands run successfully:

```bash
npm run test:worldcup
npm run compile:solc
cd foundry/worldcup-betting && node scripts/compile-betting.mjs
npm run validate:schema
npm run build
```

Observed results:

- product regression checks passed
- `WorldCupPolymarketVault` compiled: ABI entries 35, bytecode bytes 22461
- `WorldCupBettingVault` compiled: creation 8969 bytes, deployed 8442 bytes, ABI entries 35
- schema validation passed: 23 UI-schema methods + 4 vaultData fields
- Vite production build completed successfully

Note: the browser tool timed out loading the local Vite page in this session, but direct HTTP health check returned 200 and the production build completed.
