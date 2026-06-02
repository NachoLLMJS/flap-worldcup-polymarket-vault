# Flap UI fixes - 2026-06-02

Two Flap generated-UI issues were observed on the first real token launch vault:

1. `getWorldCupWinner` returned a Solidity struct. The generated UI decoded it as flat outputs from the schema, causing a decode error like `Position '8224' is out of bounds`. The fixed implementation now exposes WorldCupViewer reads as flat return values:

```solidity
(uint256 matchId, string matchName, bool isResolved, uint256 teamId, string teamName)
```

2. `vaultDataSchema` was exposed inside `vaultUISchema`. That function belongs to the factory launch form, not the vault interaction UI. Flap's vault UI tried to decode `FieldDescriptor[]` as a literal ABI type string and showed `Type "FieldDescriptor" is not a valid decoding type`. The fixed vault UI schema no longer includes `vaultDataSchema` as a vault method.

Use the fixed factory:

```text
0x14b0b0554dc470ba4608ece98861ea7fccc76964
```

Do not use the previous factory for new launches:

```text
0xb9081094b8bf44dff3179cb4a12009b4f4a5d96d
```

The previous token's already-created vault cannot be upgraded. Launch a new test token with the fixed factory to verify the generated UI without those two errors.
