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

Flap launch factory:

```text
0xc6f9e1e06699209507c95e4eb23b6ee68901afa3
```

Launch URL:

```text
https://flap.sh/launch?vaultfactory=0xc6f9e1e06699209507c95e4eb23b6ee68901afa3
```

Other current contracts:

- Vault implementation: `0x28eb637368cb07c658dc20d2852665de81e340a7`
- Preview vault: `0xf8a204353ee286c1a98776efb35510d4e489e57f`
- Betting vault: `0x2c194de4fc820128044b4b405a5e8e5bd1e91358`
- WorldCupViewer: `0x00036192958C2aaAF9F445d3Cdc2979995EA333e`

Do not use the preview vault as `vaultfactory`; use the factory address above.

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
