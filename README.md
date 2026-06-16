# Flap World Cup Polymarket Vault

Custom Flap Vault concept for a 2026 FIFA World Cup-only prediction-market treasury.

Goal: make a Flap custom vault whose functions are clearly exposed through `vaultUISchema()` so Flap can auto-render a polished interaction UI. The vault is World Cup-only: it reads Flap WorldCupViewer/Resolver data and keeps Polymarket market metadata/links as an off-chain execution and research surface, while settlement signals stay grounded on BSC through Flap's World Cup contracts.

Important design constraint:
- Flap vaults run on BSC and receive BNB tax-token revenue.
- Polymarket markets are not native BSC vault contracts. Treat Polymarket integration as metadata/off-chain execution unless a later bridge/executor is explicitly designed and audited.
- The on-chain World Cup truth source for the MVP is Flap `WorldCupViewer` on BSC mainnet.

Current package includes:
- `contracts/WorldCupPolymarketVault.sol`: self-contained Solidity MVP/stub implementing the relevant Flap UI schema structs, World Cup viewer integration interfaces, an in-vault `vaultDataSchema()` launch-form note, and a minimal `WorldCupPolymarketVaultFactoryStub` validator/deployer.
- `schemas/vault-ui-schema.reference.json`: JSON mirror of the intended `vaultUISchema()` plus `vaultDataSchema`/factory notes so UI/research can review the function and launch-form surface without compiling/deploying.
- `docs/RESEARCH.md`: grounded notes from Flap docs.
- `docs/KANBAN_SPEC.md`: task graph and acceptance criteria.
- `docs/05_PRIVY_RESEARCH.md`: current Privy research for Gmail login, embedded wallet creation, BSC chain config, funding, viem/ethers integration, and safe env-var split.
- `docs/07_MATCH_TIMERS_RESEARCH.md`: Flap timer/deadline research plus contract/UI-schema recommendations for configurable market countdown fields.
- `docs/02_UI_SCHEMA_PREVIEW.md`: UI renderer/preview plan mapping every schema method to cards, forms, tables, and pending/resolved states.
- `docs/ui-schema-preview.html`: small static visual preview of the auto-rendered function surface.
- `scripts/validate-ui-schema.mjs`: schema/function-surface validation.

## Live BSC contracts

Fixed Flap launch factory:

```text
0x1f7A242CdF77C5beD1F80E9Fa421C691B7aA6aCe
```

Launch URL for the next final launch:

```text
https://flap.sh/launch?vaultfactory=0x1f7A242CdF77C5beD1F80E9Fa421C691B7aA6aCe
```

Current configured contracts:

- Vault implementation: `0x95005A1c1A737c0CdF32df3fb893EA3c2E2934e3`
- Vault beacon: `0xFa2aB705f0e4998cc5bC9aCE7EeB2E32953a64Da`
- Flap launch factory: `0x1f7A242CdF77C5beD1F80E9Fa421C691B7aA6aCe`
- Betting vault: `0x9a2cEe430A7dE1A0b56e12Af2B313f643d5b5FF3`
- WorldCupViewer: `0x00036192958C2aaAF9F445d3Cdc2979995EA333e`
- Active Flap token: unset until the final token launch.
- Active Flap vault clone: unset until the final token/vault launch.

Do not use any temporary token/vault launched during testing. Keep `VITE_FLAP_TOKEN_ADDRESS` and `VITE_FLAP_VAULT_ADDRESS` empty until the final launch creates the real token and concrete vault clone.

ABI-encoded vaultData for the final token launch:

```text
0x00000000000000000000000000036192958c2aaaf9f445d3cdc2979995ea333e000000000000000000000000eb155312eeca8bbb3600f6e64b09fad04febf9d10000000000000000000000009a2cee430a7de1a0b56e12af2b313f643d5b5ff3
```

Latest auxiliary betting vault seed status: 85 markets created, 28 currently open, 57 past markets intentionally left closed/draft by on-chain timing guards.


Old/deprecated addresses:

- `0x8257f357cee6c3ee77f5b89818d9ee9bfecd72f6`: do not use; it produced malformed EIP-1167 clone bytecode and generic ThirdParty UI fallback.
- `0xc6f9e1e06699209507c95e4eb23b6ee68901afa3`: older visual-good factory, but not the current fixed three-field factory.
- `0xbf4fc44eedc13aff33633d29383323068d348125`: old admin-heavy UI implementation/factory path.

## Frontend setup

```bash
cp .env.example .env.local
npm ci
npm run dev
```

## Verification

```bash
npm run validate:schema
npm run test:worldcup
npm run build
```

## Collaboration

This repo is ready for frontend collaboration. Production deploys are handled by Vercel from the `main` branch once the Vercel project is connected to this GitHub repo.
