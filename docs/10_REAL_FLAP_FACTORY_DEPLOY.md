# Real Flap VaultFactory deployment

This is the Flap-compatible factory deployment for token launch UI usage.

## Why this exists

The previous address `0xf8a204353ee286c1a98776efb35510d4e489e57f` is a real vault preview, not a VaultFactory. It can be inspected and receive BNB, but it is not the correct address for `?vaultfactory=` when creating a new Flap tax token.

Flap docs say `VaultPortal` calls:

```solidity
newVault(address taxToken, address quoteToken, address creator, bytes calldata vaultData)
```

The tax token address is predicted by VaultPortal before the token is deployed, passed to the factory, and the actual token is created after the vault is created. Therefore the factory must receive `taxToken` from `newVault`; users should not type the token address manually in `vaultData`.

## Deployed contracts

Implementation contract:

- Address: `0xc24b9c62cb5f9b62ec8b9d4821bf0754c7b12674`
- Tx: `0x196be89ca066a7a70050c380bf12a2033a0382bea85bd7266b06717ea659f83c`
- On-chain code size: `22416` bytes

Factory contract:

- Address: `0x14b0b0554dc470ba4608ece98861ea7fccc76964`
- Tx: `0x164ca60297a4e6cb8790375c4d51ac572efe6940371c280dfe6dc86a80090fab`
- On-chain code size: `4774` bytes
- Implementation pointer: `0xC24b9c62cB5F9b62Ec8B9D4821bf0754c7B12674`

BscScan:

- Factory: `https://bscscan.com/address/0x14b0b0554dc470ba4608ece98861ea7fccc76964`
- Implementation: `https://bscscan.com/address/0xc24b9c62cb5f9b62ec8b9d4821bf0754c7b12674`

## Verified on-chain reads

- `factorySpecVersion()` -> `v2.2`
- `isQuoteTokenSupported(0x0000000000000000000000000000000000000000)` -> `true`
- `implementation()` -> `0x3BC98DB7251e51166c910A86B4375F48878D2263`
- `vaultDataSchema().fields` -> `worldCupViewer:address`, `operator:address`
- `tokenCreationPolicies()` -> quoteToken eq native BNB

## Use in Flap launch UI

Use this address as the `vaultfactory` parameter:

```text
0x14b0b0554dc470ba4608ece98861ea7fccc76964
```

Expected launch form fields:

- `worldCupViewer`: put `0x0000000000000000000000000000000000000000` to use default BSC WorldCupViewer, or explicitly put `0x00036192958C2aaAF9F445d3Cdc2979995EA333e`.
- `operator`: put `0x0000000000000000000000000000000000000000` to use token creator as operator.

The user should not have to type `taxToken` in the factory vaultData form. VaultPortal supplies the predicted token address to `newVault`.

## Flap addresses baked into factory

- BSC VaultPortal: `0x90497450f2a706f1951b5bdda52B4E5d16f34C06`
- BSC Guardian: `0x9e27098dcD8844bcc6287a557E0b4D09C86B8a4b`
- BSC WorldCupViewer default: `0x00036192958C2aaAF9F445d3Cdc2979995EA333e`

## Architecture

The factory uses EIP-1167 minimal proxies. This keeps factory runtime small and avoids embedding the full vault creation bytecode in the factory.

- Implementation runtime: under EVM 24576 byte limit.
- Factory runtime: far under EVM 24576 byte limit.
- Each Flap token launch gets a fresh clone initialized with:
  - predicted `taxToken` from VaultPortal;
  - Flap Guardian;
  - WorldCupViewer;
  - operator = creator unless configured otherwise.
