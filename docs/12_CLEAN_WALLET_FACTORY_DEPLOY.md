# Clean-wallet Flap factory deployment

Deployed with the new wallet so the public factory address is not tied to the earlier testing wallet.

## Deployer

- Deployer: `0xEB155312Eeca8Bbb3600f6e64B09fAd04FeBf9D1`

## Contracts

Implementation:

- Address: `0x28eb637368cb07c658dc20d2852665de81e340a7`
- Tx: `0xf9d38af50ed802b6b88469b157804593e9c2b2614a2d2e0ef2e98ab5e2982856`
- Code size: `22416` bytes
- BscScan: `https://bscscan.com/address/0x28eb637368cb07c658dc20d2852665de81e340a7`

Factory:

- Address: `0xc6f9e1e06699209507c95e4eb23b6ee68901afa3`
- Tx: `0x566e15160e93bbc4f7ab881905fbb2f63be912d0feecbbd0fe95fa02d438c448`
- Code size: `4774` bytes
- BscScan: `https://bscscan.com/address/0xc6f9e1e06699209507c95e4eb23b6ee68901afa3`

## Use in Flap launch

Use this factory address:

```text
0xc6f9e1e06699209507c95e4eb23b6ee68901afa3
```

Launch URL:

```text
https://flap.sh/launch?vaultfactory=0xc6f9e1e06699209507c95e4eb23b6ee68901afa3
```

Expected generated fields:

- `worldCupViewer`: `0x0000000000000000000000000000000000000000`
- `operator`: `0x0000000000000000000000000000000000000000`

Do not put the implementation address in `vaultfactory`.

## On-chain verification

Verified after deploy:

- `implementation()` -> `0x28eb637368cB07c658DC20d2852665De81E340a7`
- `factorySpecVersion()` -> `v2.2`
- `isQuoteTokenSupported(0x0000000000000000000000000000000000000000)` -> `true`
- `vaultDataSchema().fields` -> `worldCupViewer:address`, `operator:address`
- `tokenCreationPolicies()` -> `quoteToken:eq`
