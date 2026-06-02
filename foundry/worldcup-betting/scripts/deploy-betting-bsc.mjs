import fs from "node:fs";
import path from "node:path";
import solc from "solc";
import {createPublicClient, createWalletClient, encodeFunctionData, http, parseAbiItem} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {bsc} from "viem/chains";

const root = new URL("../", import.meta.url).pathname;
const repoRoot = new URL("../../../", import.meta.url).pathname;
const main = path.join(root, "src/WorldCupBettingVault.sol");
const seedPath = path.join(root, "seed/initial-markets.json");
const envPath = path.join(repoRoot, ".env.local");

const WORLD_CUP_VIEWER = process.env.WORLD_CUP_VIEWER_ADDRESS ?? "0x00036192958C2aaAF9F445d3Cdc2979995EA333e";
const RPC_URL = process.env.BSC_RPC_URL ?? process.env.VITE_BSC_RPC_URL ?? "https://bsc-dataseed.binance.org";
const rawKey = process.env.BSC_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
const GUARDIAN = process.env.GUARDIAN_ADDRESS;
const OPERATOR = process.env.OPERATOR_ADDRESS ?? GUARDIAN;
const SHOULD_SEED = process.env.SEED_MARKETS !== "false";
const SHOULD_OPEN = process.env.OPEN_MARKETS !== "false";

if (!rawKey) throw new Error("Set BSC_PRIVATE_KEY or PRIVATE_KEY for the deployer wallet");
if (!GUARDIAN) throw new Error("Set GUARDIAN_ADDRESS; OPERATOR_ADDRESS is optional and defaults to guardian");
if (!OPERATOR) throw new Error("Set OPERATOR_ADDRESS or GUARDIAN_ADDRESS");

function findImports(importPath) {
  const candidates = [
    path.join(root, importPath),
    path.join(root, "src", importPath),
    path.join(path.dirname(main), importPath.replace(/^\.\//, "")),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return {contents: fs.readFileSync(p, "utf8")};
  }
  return {error: `Import not found: ${importPath}`};
}

function compile() {
  const input = {
    language: "Solidity",
    sources: {"src/WorldCupBettingVault.sol": {content: fs.readFileSync(main, "utf8")}},
    settings: {
      optimizer: {enabled: true, runs: 50},
      viaIR: true,
      outputSelection: {"*": {"*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"]}},
    },
  };
  const out = JSON.parse(solc.compile(JSON.stringify(input), {import: findImports}));
  for (const e of out.errors ?? []) {
    if (e.severity === "error") console.error(e.formattedMessage);
  }
  const errors = (out.errors ?? []).filter((e) => e.severity === "error");
  if (errors.length) throw new Error("Solidity compile failed");
  return out.contracts["src/WorldCupBettingVault.sol"].WorldCupBettingVault;
}

function patchEnv(address) {
  if (!fs.existsSync(envPath)) return;
  const current = fs.readFileSync(envPath, "utf8");
  const next = current.includes("VITE_BETTING_VAULT_ADDRESS=")
    ? current.replace(/VITE_BETTING_VAULT_ADDRESS=.*/g, `VITE_BETTING_VAULT_ADDRESS=${address}`)
    : `${current.trimEnd()}\nVITE_BETTING_VAULT_ADDRESS=${address}\n`;
  fs.writeFileSync(envPath, next);
}

const account = privateKeyToAccount(rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`);
const publicClient = createPublicClient({chain: bsc, transport: http(RPC_URL)});
const walletClient = createWalletClient({account, chain: bsc, transport: http(RPC_URL)});

console.log(`Deploying WorldCupBettingVault from ${account.address}`);
console.log(`WorldCupViewer: ${WORLD_CUP_VIEWER}`);
console.log(`Guardian: ${GUARDIAN}`);
console.log(`Operator: ${OPERATOR}`);

const c = compile();
const hash = await walletClient.deployContract({
  abi: c.abi,
  bytecode: `0x${c.evm.bytecode.object}`,
  args: [WORLD_CUP_VIEWER, GUARDIAN, OPERATOR],
});
console.log(`Deploy tx: ${hash}`);
const receipt = await publicClient.waitForTransactionReceipt({hash});
if (receipt.status !== "success") throw new Error(`Deploy failed: ${hash}`);
const address = receipt.contractAddress;
console.log(`Betting vault: ${address}`);
patchEnv(address);

if (SHOULD_SEED) {
  const markets = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  console.log(`Seeding ${markets.length} markets${SHOULD_OPEN ? " and opening them" : ""}...`);
  const marketType = {MatchWinner: 0n, GroupWinner: 1n, TournamentWinner: 2n};
  for (const m of markets) {
    const outcomeTeamIds = m.outcomes.map((o) => BigInt(o.teamId));
    const tx = await walletClient.writeContract({
      address,
      abi: c.abi,
      functionName: "createMarket",
      args: [
        BigInt(m.viewerMatchId),
        marketType[m.type],
        m.label,
        BigInt(m.openTime),
        BigInt(m.closeTime),
        BigInt(m.resolveAfter),
        outcomeTeamIds,
        BigInt(m.feeBps),
      ],
    });
    const created = await publicClient.waitForTransactionReceipt({hash: tx});
    if (created.status !== "success") throw new Error(`createMarket failed for ${m.label}: ${tx}`);
    if (SHOULD_OPEN) {
      const openTx = await walletClient.writeContract({address, abi: c.abi, functionName: "openMarket", args: [BigInt(m.marketId)]});
      const opened = await publicClient.waitForTransactionReceipt({hash: openTx});
      if (opened.status !== "success") throw new Error(`openMarket failed for ${m.label}: ${openTx}`);
    }
    console.log(`OK market ${m.marketId}: ${m.label}`);
  }
}

console.log("Done");
console.log(`VITE_BETTING_VAULT_ADDRESS=${address}`);
