# Guardian emergency recovery security review

Task: review the direct patch that added `recoverNative(recipient, amountWei)` and `recoverTaxToken(recipient, amount)` to `contracts/WorldCupPolymarketVault.sol`, plus the matching Flap UI/reference schema.

## Verdict

The recovery surface is acceptable for the current tax-revenue MVP as an emergency/shutdown control, with one deploy blocker: the contract still exceeds the Spurious Dragon 24,576-byte runtime-bytecode limit and should not be deployed as-is.

## Recovery controls reviewed

| Requirement | Status | Evidence |
| --- | --- | --- |
| Only Guardian can recover | Pass | Both recovery functions use `onlyGuardian`, which requires `msg.sender == guardian`. Operator access is not enough. |
| Recipient must be non-zero | Pass | `recoverNative` and `recoverTaxToken` both require `recipient != address(0)`. |
| Amount is bounded by current balance | Pass | Native recovery checks `amountWei <= address(this).balance`; token recovery checks `amount <= IERC20(taxToken).balanceOf(address(this))`. |
| Tax-token recovery only, no arbitrary asset drain | Pass | `recoverTaxToken` transfers only immutable `taxToken`; there is no function that accepts an arbitrary token address. |
| Events emitted | Pass | `EmergencyNativeRecovered` and `EmergencyTaxTokenRecovered` include Guardian, recipient, and amount; token recovery also includes the token address. |
| UI schema is emergency-only | Pass | `vaultUISchema()` and `schemas/vault-ui-schema.reference.json` label both methods `Guardian emergency only`. |
| UI schema warns about future user escrow claims | Pass after review patch | `recoverNative` already warned not to bypass future user claims. `recoverTaxToken` now carries the same warning in the contract schema and reference JSON. |

## Notes and residual risks

- Current MVP describes tax revenue and metadata, not user escrow. If a later version holds user stakes/claims, recovery must be redesigned with explicit claim accounting, timelock/multisig governance, pause state, and public incident procedure before it is enabled.
- `recoverNative` makes an external call to the recipient. Because the only authorization is `msg.sender == guardian` and no mutable accounting is updated after the call, the reentrancy surface is limited for this MVP. Still, a production escrow version should add a reentrancy guard and/or pull-pattern recovery governance.
- `recoverTaxToken` assumes a standard ERC-20 that returns `bool` from `transfer`. If the configured Flap tax token is non-standard, production code should use audited `SafeERC20` or a known-good token interface.
- The constructor allows `taxToken == address(0)` so launch can proceed when unknown; this is safe because token recovery reverts with `tax token not configured`, but production launch UI should strongly prefer a verified tax token address.
- Do not deploy using private keys pasted into chat. Use local/Vercel/GitHub secrets or wallet tooling, rotate any key previously pasted into chat, and keep deployer/Guardian credentials separate.

## Deploy-size blocker

`npm run compile:solc` currently compiles but reports runtime bytecode above the Spurious Dragon limit:

- `WorldCupPolymarketVault`: warning around 26,628 bytes
- `WorldCupPolymarketVaultFactoryStub`: warning around 28,231 bytes
- script summary for the vault bytecode: 27,169 bytes

Before any real deploy, reduce runtime bytecode below 24,576 bytes. Recommended split:

1. Move large `vaultUISchema()`/`vaultDataSchema()` string-heavy helpers to a separate schema/adaptor contract or off-chain reference consumed by Flap tooling.
2. Remove the in-file factory stub from the production vault artifact; keep it as a dev-only contract or real Flap factory integration in a separate file/deploy.
3. Replace long revert strings/descriptions with custom errors and keep detailed copy in the schema/reference layer.
4. Re-run `npm run validate:schema` and `npm run compile:solc`; deployment is blocked until compile output no longer reports the 24,576-byte warning.

## Validation added in this review

`validate-ui-schema.mjs` now fails if:

- either recovery method is not labeled `Guardian emergency only`;
- either recovery method lacks the `must not bypass user claims` warning;
- `recoverTaxToken` does not state that it only recovers `taxToken`, not arbitrary assets.
