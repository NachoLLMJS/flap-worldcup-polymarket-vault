# Mainnet deployment addresses

Network: BNB Chain mainnet (chainId 56)
Deployer / current operator wallet: `0xEB155312Eeca8Bbb3600f6e64B09fAd04FeBf9D1`

## Deployed contracts

### Standalone betting vault

`WorldCupBettingVault`

Address:

```text
0xb5d939b361fcd2ca16cda6d9c32b952c8a7ebd8b
```

Deploy tx:

```text
0xc672dea7ee3da08f1f6ba74bace1fe0e6462a2a889db6710dd5f17ebbecb975b
```

Deployment JSON:

```text
/mnt/c/Users/nacho/Desktop/flap-worldcup-polymarket-vault/foundry/worldcup-betting/deployments/bsc-mainnet-0xb5d939b361fcd2ca16cda6d9c32b952c8a7ebd8b.json
```

Purpose:

- Handles user bets.
- Receives tax rewards from the Flap vault via `depositTaxRewards()`.
- Bettors claim rewards via `claimTaxRewards()`.

Initial demo market seeded and opened:

```text
CreateMarketTx=0x6853eceffc7214096cc88f34f1c4eb6c942fb7c782a011828829266233064aba
OpenMarketTx=0xcd695c8931f032f5e1e14660e0258c8bb64b0bd67d758f7ad0f783786ba4f03e
marketCount=1
```

### Flap vault implementation

`WorldCupPolymarketVault`

Address:

```text
0xb5e6ecd590bb03db5b1caf15a1bcf3f80e01bf71
```

Deploy tx:

```text
0x0dbbc2fce0bf5965a9018f3f82b1d2d185178714a77b20053a3f34c9c315f365
```

### Flap vault factory

`WorldCupPolymarketVaultFactory`

Address to give/use in Flap app:

```text
0xbf4fc44eedc13aff33633d29383323068d348125
```

Deploy tx:

```text
0xa8adaad35173686090e7743dc747c19ba7e1e2381f7eea51fdaf19214981ded6
```

Deployment JSON:

```text
/mnt/c/Users/nacho/Desktop/flap-worldcup-polymarket-vault/deployments/bsc-mainnet-flap-factory-0xbf4fc44eedc13aff33633d29383323068d348125.json
```

## Flap launch values

If Flap asks for fields:

```text
worldCupViewer = 0x0000000000000000000000000000000000000000
operator       = 0x0000000000000000000000000000000000000000
bettingVault   = 0xb5d939b361fcd2ca16cda6d9c32b952c8a7ebd8b
```

`worldCupViewer = zero` means the factory uses the default BNB mainnet Flap WorldCupViewer:

```text
0x00036192958C2aaAF9F445d3Cdc2979995EA333e
```

`operator = zero` means the token creator becomes the operator for the Flap vault clone.

If Flap asks for raw encoded `vaultData`:

```text
0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b5d939b361fcd2ca16cda6d9c32b952c8a7ebd8b
```

## Verified on-chain code sizes

```text
betting        codeBytes=10502 hasCode=true
implementation codeBytes=23386 hasCode=true
factory        codeBytes=4883  hasCode=true
```

## After Flap token launch

Flap will create a new vault clone through the factory. Save that clone address as the live Flap vault address.

Reward flow:

1. Flap token tax sends BNB to the Flap vault clone.
2. Operator/Guardian calls on the Flap vault clone:

```solidity
forwardTaxRewardsToBetting(amountWei)
```

3. Bettors claim on the betting vault:

```solidity
claimTaxRewards()
```

## Important security note

The deploy key was pasted in chat and should now be considered burned/compromised. Do not send more funds to it. Use it only for this tiny deploy/test session or rotate immediately.
