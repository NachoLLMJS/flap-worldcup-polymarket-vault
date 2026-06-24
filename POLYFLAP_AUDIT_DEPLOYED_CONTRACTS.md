# Polyflap final audited production contracts

Network: BNB Smart Chain mainnet (chainId 56)

These are the audited production contracts deployed for the live Flap launch. The final POLYFLAP token and final Flap vault clone are now live and configured in the web placeholders.

## Active production contracts

| Contract | Address | Tx |
| --- | --- | --- |
| WorldCupPolymarketVault implementation | `0x71FF865C9477DFd3D40e3AC21fcbcc8c24B64CC6` | `0x9f8f6f606ceebcbb5deea08d7db4cd8bd2baede73903a5d6f77fe543bd9a95f8` |
| WorldCupPolymarketVaultBeacon | `0x7eb082a4f8461f1Ede14D63155a5da9Da3145Ae1` | `0x16eb7d08e1d6e6a7c46f160aab21e5b42109134c648732fc32c5c2fa702f71d7` |
| WorldCupPolymarketVaultFactory | `0x173F25D505A73c2A0C3922BbD29f5feB28fd829b` | `0x6e328bbc7187a1faa0f0e3c4648c16ccf50d775c804c2c6f19f01463cfe1a4ea` |
| WorldCupBettingVault auxiliary game logic | `0x6013Cdc9A6300CE133B418283bBfe206B0aE858d` | `0xc246a5fbea50d364c5c28341f45956e5298eed9302c00f32e1bb96e71134005c` |
| WorldCupViewer | `0x00036192958C2aaAF9F445d3Cdc2979995EA333e` | existing viewer |
| Dev / deployer / operator | `0x0358D3d32F4967FeB373325E20412F494071c5dA` | n/a |
| Guardian | `0x9e27098dcD8844bcc6287a557E0b4D09C86B8a4b` | n/a |
| Fee wallet | `0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e` | n/a |

## Final Flap launch values

```env
VITE_FLAP_TOKEN_ADDRESS=0x45f9Aa71935DbCBF0D122283B52d6C421C6f7777
VITE_FLAP_VAULT_ADDRESS=0x770171B5E6CDe9eFD9D0bAa7aed393395A2872e8
```

setPolyflapToken was executed on the betting vault and verified on-chain:

```text
0x8e440732f6cbdd742137c61b1b489c2e7e92aa1619937f39e4ef52674f1c5889
```

## Flap launch data

Factory:

```text
0x173F25D505A73c2A0C3922BbD29f5feB28fd829b
```

Vault data ABI type:

```text
tuple(address worldCupViewer,address operator,address bettingVault)
```

Vault data decoded:

```json
{
  "worldCupViewer": "0x00036192958C2aaAF9F445d3Cdc2979995EA333e",
  "operator": "0x0358D3d32F4967FeB373325E20412F494071c5dA",
  "bettingVault": "0x6013Cdc9A6300CE133B418283bBfe206B0aE858d"
}
```

Vault data encoded:

```text
0x00000000000000000000000000036192958c2aaaf9f445d3cdc2979995ea333e0000000000000000000000000358d3d32f4967feb373325e20412f494071c5da0000000000000000000000006013cdc9a6300ce133b418283bbfe206b0ae858d
```

## On-chain verification

Local report:

- `C:\Users\nacho\Desktop\POLYFLAP CONTRACTS 1.2\ONCHAIN_VERIFICATION_FINAL_DEPLOYMENT_2026-06-22.md`
- `C:\Users\nacho\Desktop\POLYFLAP CONTRACTS 1.2\ONCHAIN_VERIFICATION_FINAL_DEPLOYMENT_2026-06-22.json`

Verification result: PASS.

## Launch-day completion

1. `VITE_FLAP_TOKEN_ADDRESS` filled.
2. `VITE_FLAP_VAULT_ADDRESS` filled.
3. `setPolyflapToken` called on `0x6013Cdc9A6300CE133B418283bBfe206B0aE858d` and readback verified.
4. Frontend rebuild/redeploy is ready from this repository.
5. Next external step: ask Flap for the Low Risk badge now that the real token is live.
