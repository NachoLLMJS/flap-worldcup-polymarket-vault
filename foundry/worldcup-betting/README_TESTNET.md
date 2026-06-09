# WorldCupBettingVault BNB Testnet launch notes

This folder is the standalone betting system, separate from the Flap token/tax vault.

The betting vault lets users bet BNB on:

- tournament winner
- group winner
- match winner

Settlement comes from a `WorldCupViewer`-compatible contract.

## Files

- `src/WorldCupBettingVault.sol` — real BNB pari-mutuel betting escrow.
- `src/MockWorldCupViewer.sol` — BNB Testnet-only WorldCupViewer-compatible mock if Flap has no real testnet viewer yet.
- `test/WorldCupBettingVault.t.sol` — Foundry tests for the core lifecycle.
- `foundry.toml` — Foundry config for this subproject.
- `scripts/compile-betting.mjs` — npm/solc compile check.
- `scripts/deploy-betting-testnet.mjs` — BNB Testnet deploy script using viem.
- `seed/initial-markets.json` — 85 World Cup markets.

## Important separation

This is not the Flap token launch factory.

- Flap token/tax launch happens on Flap's platform.
- This betting vault is our app's BNB betting escrow.
- Token tax distribution to holders should be handled separately from user betting pools.
- Do not mix token taxes with user betting stakes.

## Foundry usage

Install Foundry if needed:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Run tests from this folder:

```bash
cd /mnt/c/Users/nacho/Desktop/flap-worldcup-polymarket-vault/foundry/worldcup-betting
forge test -vv
```

If you run from Windows PowerShell, use the Windows path equivalent.

## NPM compile check

From repo root:

```bash
cd /mnt/c/Users/nacho/Desktop/flap-worldcup-polymarket-vault
npm run compile:betting
```

## Deploy to BNB Testnet

### Option A: Deploy with mock WorldCupViewer

Use this if there is no official Flap WorldCupViewer on BNB Testnet yet.

The script deploys:

1. `MockWorldCupViewer`
2. `WorldCupBettingVault` pointing to that mock viewer
3. optional seeded/opened markets from `seed/initial-markets.json`

Command:

```bash
cd /mnt/c/Users/nacho/Desktop/flap-worldcup-polymarket-vault
BSC_TESTNET_PRIVATE_KEY=0xYOUR_TESTNET_KEY \
GUARDIAN_ADDRESS=0xYOUR_GUARDIAN_OR_TEST_WALLET \
OPERATOR_ADDRESS=0xYOUR_OPERATOR_OR_TEST_WALLET \
MAX_SEED_MARKETS=5 \
npm run deploy:betting:testnet
```

For full seed of all 85 markets, omit `MAX_SEED_MARKETS=5`.

```bash
BSC_TESTNET_PRIVATE_KEY=0xYOUR_TESTNET_KEY \
GUARDIAN_ADDRESS=0xYOUR_GUARDIAN_OR_TEST_WALLET \
OPERATOR_ADDRESS=0xYOUR_OPERATOR_OR_TEST_WALLET \
npm run deploy:betting:testnet
```

### Option B: Use a real Flap WorldCupViewer testnet address

If Flap gives us an official BNB Testnet WorldCupViewer address, pass it explicitly:

```bash
cd /mnt/c/Users/nacho/Desktop/flap-worldcup-polymarket-vault
BSC_TESTNET_PRIVATE_KEY=0xYOUR_TESTNET_KEY \
GUARDIAN_ADDRESS=0xYOUR_GUARDIAN_OR_TEST_WALLET \
OPERATOR_ADDRESS=0xYOUR_OPERATOR_OR_TEST_WALLET \
WORLD_CUP_VIEWER_ADDRESS=0xREAL_TESTNET_WORLD_CUP_VIEWER \
DEPLOY_MOCK_VIEWER=false \
npm run deploy:betting:testnet
```

## Useful env flags

- `BSC_TESTNET_RPC_URL` — custom BNB Testnet RPC. Defaults to Binance public testnet RPC.
- `BSC_TESTNET_PRIVATE_KEY` — deployer key. Do not commit it.
- `GUARDIAN_ADDRESS` — guardian role.
- `OPERATOR_ADDRESS` — operator role. Defaults to guardian if omitted.
- `WORLD_CUP_VIEWER_ADDRESS` — use a real viewer instead of deploying mock.
- `DEPLOY_MOCK_VIEWER=false` — disable mock deploy.
- `SEED_MARKETS=false` — deploy vault only, no markets.
- `OPEN_MARKETS=false` — seed markets but leave them Draft.
- `MAX_SEED_MARKETS=5` — seed only first N markets for smoke testing.
- `MIN_BALANCE_BNB=0.02` — minimum deployer testnet balance before script proceeds.

## What the script writes

After deployment, the script writes a JSON record under:

```text
foundry/worldcup-betting/deployments/bsc-testnet-<timestamp>.json
```

If `.env.local` exists in the repo root, it also updates:

```text
VITE_BSC_CHAIN_ID=97
VITE_BSC_RPC_URL=<rpc>
VITE_BETTING_VAULT_ADDRESS=<betting vault>
VITE_WORLD_CUP_VIEWER_ADDRESS=<viewer or mock viewer>
```

## BNB Testnet faucet

Fund the deployer wallet with BNB testnet before running the script.

Chain:

```text
BNB Smart Chain Testnet
chainId: 97
native: tBNB
```

## After deploy smoke test

1. Confirm deployment JSON has:
   - `bettingVault`
   - `worldCupViewer`
   - `guardian`
   - `operator`
   - `marketCount`
2. If using mock viewer, use `setMatchResult`, `setGroupWinner`, or `setWorldCupWinner` from the mock owner wallet to resolve test markets.
3. Place a tiny BNB testnet bet from the frontend.
4. Resolve the market.
5. Claim as winner or refund if cancelled.

## Notes

- This contract currently charges 1% betting fee on entry and refunds net stake on cancellation.
- For production fairness, consider escrowing fees until resolution or refunding gross deposits on cancellation.
- The outcome list is large for tournament winner. For production, consider adding a hard `MAX_OUTCOMES` cap.
