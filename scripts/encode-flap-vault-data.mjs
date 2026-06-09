import { encodeAbiParameters, isAddress, getAddress } from "viem";

const worldCupViewer = process.env.WORLD_CUP_VIEWER_ADDRESS ?? "0x0000000000000000000000000000000000000000";
const operator = process.env.OPERATOR_ADDRESS ?? "0x0000000000000000000000000000000000000000";
const bettingVault = process.env.BETTING_VAULT_ADDRESS ?? process.env.VITE_BETTING_VAULT_ADDRESS;

if (!bettingVault || !isAddress(bettingVault)) {
  throw new Error("Set BETTING_VAULT_ADDRESS to the deployed WorldCupBettingVault address");
}
for (const [name, value] of Object.entries({ WORLD_CUP_VIEWER_ADDRESS: worldCupViewer, OPERATOR_ADDRESS: operator })) {
  if (!isAddress(value)) throw new Error(`${name} is not a valid address: ${value}`);
}

const vaultData = encodeAbiParameters(
  [{
    type: "tuple",
    components: [
      { name: "worldCupViewer", type: "address" },
      { name: "operator", type: "address" },
      { name: "bettingVault", type: "address" }
    ]
  }],
  [{
    worldCupViewer: getAddress(worldCupViewer),
    operator: getAddress(operator),
    bettingVault: getAddress(bettingVault)
  }]
);

console.log(`WORLD_CUP_VIEWER_ADDRESS=${getAddress(worldCupViewer)}`);
console.log(`OPERATOR_ADDRESS=${getAddress(operator)}`);
console.log(`BETTING_VAULT_ADDRESS=${getAddress(bettingVault)}`);
console.log(`VAULT_DATA=${vaultData}`);
console.log("Flap app fields:");
console.log("- worldCupViewer: use 0x0000000000000000000000000000000000000000 on BNB mainnet to use default Flap WorldCupViewer");
console.log("- operator: use 0x0000000000000000000000000000000000000000 to default to token creator, or your operator wallet");
console.log("- bettingVault: the deployed WorldCupBettingVault address above");
