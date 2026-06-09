# Flap WorldCupPolymarketVault - Fixed Clone Factory Handoff

Network: BNB Smart Chain mainnet
Chain ID: 56
Timestamp: 2026-06-09

## Root cause of POLYTEST2 UI issue

POLYTEST2 token:
0xc81754eb38c9235cd1c06d7afc5d19c90aa47777

Vault recorded by VaultPortal:
0xee0069B36407EC772eB6c0Bf87bE089df13cB43f

Factory recorded by VaultPortal:
0x8257f357cee6c3EE77f5B89818D9eE9bFecd72f6

The factory address was correct, but its EIP-1167 clone bytecode was malformed. The deployed clone runtime was:

0x363d3d373d3d3d363d730911b91091baca955d1b71ccf5295daa788380350005af43d82803e903d91602b57fd5

The bad part is the extra `00` before `5af4...`. Calls to vaultUISchema(), description(), taxToken(), etc. returned no data, so Flap fell back to the generic ThirdParty display.

This POLYTEST2 vault cannot be fixed in-place because the clone runtime is already deployed. Launch a new token with the fixed factory below.

## Fixed contracts to use

### 1. Existing betting vault auxiliary contract

Address:
0x0729614f2775b99d7825bf76405e38b10529ddb0

Deploy tx:
0xc5762a25a02f9dce1d445ebf81f1e5cbbae9bea1854b460b5c5205e7a2c6e8ab

Status:
- marketCount: 0
- worldCupViewer: 0x00036192958C2aaAF9F445d3Cdc2979995EA333e
- guardian/operator: 0xEB155312Eeca8Bbb3600f6e64B09fAd04FeBf9D1

### 2. New fixed WorldCupPolymarketVault implementation

Address:
0xf9f63eb4c0ce81a1edd1f517b3247103867f8e04

Deploy tx:
0x777062c3eced47e4123ec273462207b3a34fa67b1444711e21b6b3cda2126358

On-chain vaultUISchema():
- vaultType: WorldCupPolymarketVault
- methodCount: 18

### 3. New fixed WorldCupPolymarketVaultFactory

USE THIS FACTORY FOR THE NEXT FLAP LAUNCH:
0x35dd03331ca995e90ca6304f45d60705c596e65d

Deploy tx:
0x331b6b16be1ae6a662d75c00f340b6ee790bfcf5d935506d25ef97fa90192f15

Deployment JSON:
deployments/bsc-mainnet-flap-factory-0x35dd03331ca995e90ca6304f45d60705c596e65d.json

Factory verification:
- implementation(): 0xf9f63EB4C0Ce81A1eDd1F517B3247103867F8E04
- factory code bytes: 4921
- implementation code bytes: 19571
- vaultDataSchema fields:
  1. worldCupViewer address
  2. operator address
  3. bettingVault address
- eth_call simulation of newVault from VaultPortal succeeded and returned a clone address.

Expected correct clone runtime pattern:
0x363d3d373d3d3d363d73f9f63eb4c0ce81a1edd1f517b3247103867f8e045af43d82803e903d91602b57fd5bf3

## Flap launch inputs

Launch with factory:
0x35dd03331ca995e90ca6304f45d60705c596e65d

Recommended form fields:

worldCupViewer:
0x0000000000000000000000000000000000000000

operator:
0x0000000000000000000000000000000000000000

bettingVault:
0x0729614f2775b99d7825bf76405e38b10529ddb0

Raw vaultData if needed:
0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000729614f2775b99d7825bf76405e38b10529ddb0

## Do not use

Do not use these for the next launch:

- 0x8257f357cee6c3ee77f5b89818d9ee9bfecd72f6: bad clone bytecode factory. Produced POLYTEST2 generic ThirdParty UI.
- 0xbf4fc44eedc13aff33633d29383323068d348125: old admin-heavy UI implementation.

The older GitHub factory 0xc6f9e1e06699209507c95e4eb23b6ee68901afa3 works visually because its clones delegate correctly, but it only supports the old two-field vaultData and old betting vault wiring. The fixed factory above keeps the new bettingVault field while fixing the clone bytecode.
