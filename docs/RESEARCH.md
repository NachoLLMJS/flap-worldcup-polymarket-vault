# Research notes: Flap World Cup Polymarket Vault

Sources checked
- Vault and VaultFactory spec, especially UI Schema Reference: https://docs.flap.sh/flap/developers/vault-developers/vault-and-vaultfactory-specification#ui-schema-reference-ivaultschemasv1
- WorldCup Viewer: https://docs.flap.sh/flap/developers/preview/worldcup-viewer
- WorldCup Resolver: https://docs.flap.sh/flap/developers/preview/worldcup-resolver
- Flap AI Oracle: https://docs.flap.sh/flap/developers/preview/flap-ai-oracle
- Flap Trigger Service: https://docs.flap.sh/flap/developers/preview/flap-trigger-service

## Flap Vault requirements that matter

New vaults should target V2/V2.2:
- Vault should extend/implement the V2 surface and expose `vaultUISchema()`.
- Factory should expose `vaultDataSchema()` for `vaultData` form generation.
- New factories should prefer the V2.2 `onBeforeLaunch(bytes)` flow / `_validateBeforeLaunch(...)` instead of legacy V6-only hooks.
- `description()` must return a dynamic human-readable description of current vault state.
- `receive()` must accept BNB tax revenue and process it according to vault logic.
- Permissioned functions must include Flap Guardian as a non-revocable backup operator.

UI schema structs from Flap spec:

```solidity
struct FieldDescriptor {
  string name;
  string fieldType;
  string description;
  uint8 decimals;
}

struct VaultDataSchema {
  string description;
  FieldDescriptor[] fields;
  bool isArray;
}

struct FactoryPolicy {
  string target;
  string operator; // eq | neq | gt | gte | lt | lte | in | notIn
  bytes value;
  string description;
}

struct ApproveAction {
  string tokenType;       // taxToken or lpToken
  string amountFieldName;
}

struct VaultMethodSchema {
  string name;
  string description;
  FieldDescriptor[] inputs;
  FieldDescriptor[] outputs;
  ApproveAction[] approvals;
  bool isInputArray;
  bool isOutputArray;
  bool isWriteMethod;
}

struct VaultUISchema {
  string vaultType;
  string description;
  VaultMethodSchema[] methods;
}
```

## WorldCupViewer

BSC mainnet deployed address:
- `0x00036192958C2aaAF9F445d3Cdc2979995EA333e`

All query methods return:

```solidity
struct MatchViewResult {
  uint256 matchId;
  string matchName;
  bool isResolved;
  uint256 teamId;
  string teamName;
}
```

Methods to expose/use:
- `getWorldCupWinner()` returns match ID 1 champion status.
- `getGroupMatchWinners(uint256 matchId)` for groups, docs say Group A = 2 through Group L = 13.
- `getMatchResult(uint256 matchId)` for any match ID.
- `getTeamName(uint256 teamId)` maps team IDs; reserved: 49 = others, 50 = draw.

## WorldCupResolver

Older solution; docs recommend new integrations prefer WorldCupViewer.
BSC mainnet deployed address:
- `0x134C6b9562E226096947e018ddEe4804c9146921`

Useful fallback for final-winner style logic, but MVP should use WorldCupViewer because it gives a cleaner high-level match result surface.

## Flap AI Oracle

BSC mainnet deployed address:
- `0xaEe3a7Ca6fe6b53f6c32a3e8407eC5A9dF8B7E39`

Capabilities:
- On-chain prompt request with BNB fee.
- Off-chain LLM gives numeric choice `[0, numOfChoices)`.
- On-chain reveal stores IPFS proof CID and invokes callback.

For this vault:
- Useful for optional research/opinion flows, not as final sports settlement truth.
- Good candidate function: ask AI to rank World Cup/Polymarket opportunities and store auditable reasoning CID.

## Flap Trigger Service

BSC mainnet deployed address:
- `0xcf4EE25035CF883895110f367F5BA8172416a7F9`
- Fee noted in docs: 0.0002 BNB per trigger request.
- Callback gas max: 2,000,000.

For this vault:
- Useful for scheduled refresh/check callbacks after key match dates.
- Timing is lower-bound only, not exact. Contract must handle late execution gracefully.

## Product design decision

The clean MVP is not “trade on Polymarket directly from BSC”. Instead:
1. Flap vault receives BNB revenue.
2. Vault stores World Cup-only Polymarket market metadata: slug, condition ID, teamId/matchId, thesis.
3. Vault exposes state and WorldCupViewer query functions through Flap `vaultUISchema()`.
4. A later off-chain/bridge executor can use the metadata to place Polymarket trades, but this requires separate custody, compliance, and bridge/security design.
5. Settlement/claim UI should be based on Flap WorldCupViewer result, not arbitrary Polymarket pages.
