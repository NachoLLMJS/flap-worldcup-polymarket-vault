# Polyflap / WorldCup Flap Mainnet Handoff

Status: ready to deploy once the deployer key is provided in the shell. This repo does not currently expose a deploy key in the agent environment.

## Scope

There are two separate contracts:

1. `WorldCupBettingVault`
   - Standalone betting escrow.
   - Not submitted as the Flap vault.
   - Receives BNB tax rewards from the Flap vault through `depositTaxRewards()`.
   - Bettors claim tax rewards with `claimTaxRewards()`.

2. `WorldCupPolymarketVault` + `WorldCupPolymarketVaultFactory`
   - Flap V2-compatible vault/factory surface.
   - Receives Flap tax revenue.
   - Stores WorldCupViewer settlement metadata.
   - Forwards BNB rewards to the standalone betting vault with `forwardTaxRewardsToBetting(amountWei)`.

## Verified locally

Run from repo root:

```bash
cd /mnt/c/Users/nacho/Desktop/flap-worldcup-polymarket-vault
npm run compile:clone-factory
npm run compile:betting
npm run validate:schema
npm run test:worldcup
node --check scripts/deploy-clone-factory-bsc.mjs
node --check foundry/worldcup-betting/scripts/deploy-betting-bsc.mjs
node --check scripts/encode-flap-vault-data.mjs
```

Expected key outputs:

```text
WorldCupPolymarketVault deployed bytecode: 23386 bytes
WorldCupPolymarketVaultFactory deployed bytecode: 4883 bytes
WorldCupBettingVault deployed bytecode: 10502 bytes
WorldCupPolymarketVault exposes 26 UI-schema methods plus 3 vaultData fields
```

`forge` is not installed in this WSL. If using Foundry locally:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
cd /mnt/c/Users/nacho/Desktop/flap-worldcup-polymarket-vault/foundry/worldcup-betting
forge test -vv
```

## Mainnet deploy order

Use a dedicated deployer wallet. Do not commit private keys.

### 1. Deploy updated betting vault

Recommended first smoke deploy with no seeding:

```bash
cd /mnt/c/Users/nacho/Desktop/flap-worldcup-polymarket-vault

BSC_PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY \
GUARDIAN_ADDRESS=0xYOUR_GUARDIAN_OR_TEAM_WALLET \
OPERATOR_ADDRESS=0xYOUR_OPERATOR_OR_TEAM_WALLET \
SEED_MARKETS=false \
OPEN_MARKETS=false \
npm run deploy:betting:bsc
```

For a one-market app smoke test:

```bash
BSC_PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY \
GUARDIAN_ADDRESS=0xYOUR_GUARDIAN_OR_TEAM_WALLET \
OPERATOR_ADDRESS=0xYOUR_OPERATOR_OR_TEAM_WALLET \
MAX_SEED_MARKETS=1 \
OPEN_MARKETS=true \
npm run deploy:betting:bsc
```

For the full 85-market catalog:

```bash
BSC_PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY \
GUARDIAN_ADDRESS=0xYOUR_GUARDIAN_OR_TEAM_WALLET \
OPERATOR_ADDRESS=0xYOUR_OPERATOR_OR_TEAM_WALLET \
OPEN_MARKETS=true \
npm run deploy:betting:bsc
```

Output to keep:

```text
VITE_BETTING_VAULT_ADDRESS=0x...
DeploymentJson=foundry/worldcup-betting/deployments/bsc-mainnet-0x....json
```

### 2. Deploy Flap vault implementation + factory

```bash
cd /mnt/c/Users/nacho/Desktop/flap-worldcup-polymarket-vault

DEPLOYER_PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY \
BSC_RPC_URL=https://bsc-dataseed.binance.org \
npm run deploy:clone-factory:bsc
```

Output to keep:

```text
VITE_FLAP_VAULT_IMPLEMENTATION_ADDRESS=0x...
VITE_FLAP_VAULT_FACTORY_ADDRESS=0x...
DeploymentJson=deployments/bsc-mainnet-flap-factory-0x....json
```

The factory address is the address to provide/use in Flap's launch flow.

## Flap app launch fields

Factory `vaultDataSchema()` exposes exactly 3 fields:

1. `worldCupViewer`
   - Use `0x0000000000000000000000000000000000000000` on BNB mainnet to use default Flap WorldCupViewer:
   - Default mainnet viewer: `0x00036192958C2aaAF9F445d3Cdc2979995EA333e`

2. `operator`
   - Use your operator/team wallet.
   - Or `0x0000000000000000000000000000000000000000` to default to the token creator.

3. `bettingVault`
   - Use the new deployed `WorldCupBettingVault` address from step 1.
   - This is required if tax rewards should be claimable by bettors.

To generate raw `vaultData` if the Flap UI asks for encoded bytes:

```bash
BETTING_VAULT_ADDRESS=0xNEW_BETTING_VAULT \
WORLD_CUP_VIEWER_ADDRESS=0x0000000000000000000000000000000000000000 \
OPERATOR_ADDRESS=0x0000000000000000000000000000000000000000 \
npm run encode:flap-vault-data
```

## After token launch

Once Flap creates the actual vault clone for the launched token, save the clone address as:

```text
VITE_FLAP_VAULT_ADDRESS=0xTHE_CLONE_VAULT_CREATED_BY_FLAP
```

Then rewards flow is:

1. Token tax sends BNB to the Flap vault clone.
2. Operator or Guardian calls on the Flap vault clone:

```solidity
forwardTaxRewardsToBetting(amountWei)
```

3. Bettors call on the betting vault:

```solidity
claimTaxRewards()
```

## Audit notes for Flap owner

- The Flap-submitted contract is `WorldCupPolymarketVault` via `WorldCupPolymarketVaultFactory`, not the standalone betting escrow.
- The vault inherits official Flap `VaultBaseV2` and the factory inherits official Flap `VaultFactoryBaseV2`.
- `receive()` only increments accounting and emits an event; no loops or external calls.
- Guardian access is canonical via `_getGuardian()`.
- Emergency functions follow Rule 009 shape:
  - `emergencyWithdrawNative(address to)`
  - `emergencyWithdrawToken(address token, address to)`
  - Guardian-only, full-balance drains, nonReentrant.
- Factory `newVault()` is gated by VaultPortal only.
- Quote token support is native BNB only.
- Betting reward forwarding is explicit, not automatic inside `receive()`, keeping `receive()` gas-safe.
