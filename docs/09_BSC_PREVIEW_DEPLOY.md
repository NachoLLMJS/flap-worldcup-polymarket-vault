# BSC preview deployment

This is a real BSC mainnet preview deployment of `WorldCupPolymarketVault`.

## Deployment

- Contract: `0xf8a204353ee286c1a98776efb35510d4e489e57f`
- Transaction: `0x5e9aee10124f7e4f7b8ccdfc90822e0d5cb09219f67610ba8a1eafbe9f3a0972`
- Deployer / Guardian: `0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e`
- Operator: `0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e` (constructor fallback because operator was zero)
- WorldCupViewer: `0x00036192958C2aaAF9F445d3Cdc2979995EA333e`
- taxToken: `0x0000000000000000000000000000000000000000`
- Gas used: `5,140,997`

## Important limitation

This historical preview was deployed with `taxToken = address(0)` before the real Flap tax token launched. Therefore:

- `recoverNative(recipient, amountWei)` is usable by the Guardian for native BNB recovery.
- `recoverTaxToken(recipient, amount)` is intentionally disabled by `tax token not configured` until a future deployment with the real tax token.
- This deployment is a real BSC preview/staging vault, not the final tax-token vault.

## Verified reads after deployment

- `taxToken()` -> `0x0000000000000000000000000000000000000000`
- `guardian()` -> `0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e`
- `operator()` -> `0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e`
- `worldCupViewer()` -> `0x00036192958C2aaAF9F445d3Cdc2979995EA333e`
- `marketCount()` -> `0`
- `description()` -> `World Cup-only Polymarket metadata vault. Revenue held: 0 wei. Winner/group settlement is still pending.`
- deployed code size read from chain: `23407` bytes

## Frontend env

`.env.local` was updated with:

- `VITE_FLAP_VAULT_ADDRESS=0xf8a204353ee286c1a98776efb35510d4e489e57f`
- `VITE_BSC_RPC_URL=https://bsc-dataseed.binance.org`

Do not put private keys in repo or docs.
