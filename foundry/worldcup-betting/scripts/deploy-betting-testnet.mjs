import fs from "node:fs";
import path from "node:path";
import solc from "solc";
import {createPublicClient, createWalletClient, http, parseEther} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {bscTestnet} from "viem/chains";

const root = new URL("../", import.meta.url).pathname;
const repoRoot = new URL("../../../", import.meta.url).pathname;
const bettingMain = path.join(root, "src/WorldCupBettingVault.sol");
const mockMain = path.join(root, "src/MockWorldCupViewer.sol");
const ifaceMain = path.join(root, "src/interfaces/IWorldCupViewer.sol");
const seedPath = path.join(root, "seed/initial-markets.json");
const outDir = path.join(root, "deployments");
const envPath = path.join(repoRoot, ".env.local");

const RPC_URL = process.env.BSC_TESTNET_RPC_URL ?? process.env.VITE_BSC_TESTNET_RPC_URL ?? "https://data-seed-prebsc-1-s1.binance.org:8545";
const rawKey = process.env.BSC_TESTNET_PRIVATE_KEY ?? process.env.BSC_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
const GUARDIAN = process.env.GUARDIAN_ADDRESS;
const OPERATOR = process.env.OPERATOR_ADDRESS ?? GUARDIAN;
const PROVIDED_VIEWER = process.env.WORLD_CUP_VIEWER_ADDRESS;
const DEPLOY_MOCK_VIEWER = process.env.DEPLOY_MOCK_VIEWER !== "false" && !PROVIDED_VIEWER;
const SHOULD_SEED = process.env.SEED_MARKETS !== "false";
const SHOULD_OPEN = process.env.OPEN_MARKETS !== "false";
const MAX_SEED_MARKETS = process.env.MAX_SEED_MARKETS ? Number(process.env.MAX_SEED_MARKETS) : Infinity;
const MIN_BALANCE_BNB = process.env.MIN_BALANCE_BNB ? Number(process.env.MIN_BALANCE_BNB) : 0.02;

if (!rawKey) throw new Error("Set BSC_TESTNET_PRIVATE_KEY, BSC_PRIVATE_KEY, or PRIVATE_KEY for the deployer wallet");
if (!GUARDIAN) throw new Error("Set GUARDIAN_ADDRESS; OPERATOR_ADDRESS is optional and defaults to guardian");
if (!OPERATOR) throw new Error("Set OPERATOR_ADDRESS or GUARDIAN_ADDRESS");
if (Number.isNaN(MAX_SEED_MARKETS) || MAX_SEED_MARKETS <= 0) throw new Error("MAX_SEED_MARKETS must be a positive number when set");

function findImports(importPath) {
  const candidates = [
    path.join(root, importPath),
    path.join(root, "src", importPath),
    path.join(path.dirname(bettingMain), importPath.replace(/^\.\//, "")),
    path.join(path.dirname(mockMain), importPath.replace(/^\.\//, "")),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return {contents: fs.readFileSync(p, "utf8")};
  }
  return {error: `Import not found: ${importPath}`};
}

function compile() {
  const input = {
    language: "Solidity",
    sources: {
      "src/WorldCupBettingVault.sol": {content: fs.readFileSync(bettingMain, "utf8")},
      "src/MockWorldCupViewer.sol": {content: fs.readFileSync(mockMain, "utf8")},
      "src/interfaces/IWorldCupViewer.sol": {content: fs.readFileSync(ifaceMain, "utf8")},
    },
    settings: {
      optimizer: {enabled: true, runs: 50},
      viaIR: true,
      outputSelection: {"*": {"*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"]}},
    },
  };
  const out = JSON.parse(solc.compile(JSON.stringify(input), {import: findImports}));
  for (const e of out.errors ?? []) {
    console[e.severity === "error" ? "error" : "warn"](e.formattedMessage);
  }
  const errors = (out.errors ?? []).filter((e) => e.severity === "error");
  if (errors.length) throw new Error("Solidity compile failed");
  const betting = out.contracts["src/WorldCupBettingVault.sol"].WorldCupBettingVault;
  const mock = out.contracts["src/MockWorldCupViewer.sol"].MockWorldCupViewer;
  for (const [name, c] of Object.entries({WorldCupBettingVault: betting, MockWorldCupViewer: mock})) {
    const deployedBytes = c.evm.deployedBytecode.object.length / 2;
    console.log(`${name}: deployed bytecode ${deployedBytes} bytes`);
    if (deployedBytes > 24576) throw new Error(`${name} deployed bytecode too large: ${deployedBytes}`);
  }
  return {betting, mock};
}

function patchEnv(values) {
  if (!fs.existsSync(envPath)) return;
  let current = fs.readFileSync(envPath, "utf8");
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${value}`;
    current = current.includes(`${key}=`) ? current.replace(new RegExp(`^${key}=.*$`, "m"), line) : `${current.trimEnd()}\n${line}\n`;
  }
  fs.writeFileSync(envPath, current);
}

async function wait(publicClient, hash, label) {
  console.log(`${label} tx: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({hash});
  if (receipt.status !== "success") throw new Error(`${label} failed: ${hash}`);
  return receipt;
}

const account = privateKeyToAccount(rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`);
const publicClient = createPublicClient({chain: bscTestnet, transport: http(RPC_URL)});
const walletClient = createWalletClient({account, chain: bscTestnet, transport: http(RPC_URL)});

console.log(`Deploying on BNB Testnet from ${account.address}`);
console.log(`RPC: ${RPC_URL}`);
console.log(`Guardian: ${GUARDIAN}`);
console.log(`Operator: ${OPERATOR}`);

const balance = await publicClient.getBalance({address: account.address});
console.log(`Deployer balance: ${Number(balance) / 1e18} tBNB`);
if (balance < parseEther(String(MIN_BALANCE_BNB))) {
  throw new Error(`Balance below MIN_BALANCE_BNB=${MIN_BALANCE_BNB}; fund ${account.address} with BNB testnet first`);
}

const {betting, mock} = compile();

let worldCupViewer = PROVIDED_VIEWER;
let mockViewerAddress = null;
if (DEPLOY_MOCK_VIEWER) {
  const mockHash = await walletClient.deployContract({
    abi: mock.abi,
    bytecode: `0x${mock.evm.bytecode.object}`,
    args: [account.address],
  });
  const mockReceipt = await wait(publicClient, mockHash, "MockWorldCupViewer deploy");
  mockViewerAddress = mockReceipt.contractAddress;
  worldCupViewer = mockViewerAddress;
  console.log(`MockWorldCupViewer: ${mockViewerAddress}`);
} else {
  console.log(`Using provided WorldCupViewer: ${worldCupViewer}`);
}

const deployHash = await walletClient.deployContract({
  abi: betting.abi,
  bytecode: `0x${betting.evm.bytecode.object}`,
  args: [worldCupViewer, GUARDIAN, OPERATOR],
});
const deployReceipt = await wait(publicClient, deployHash, "WorldCupBettingVault deploy");
const bettingVault = deployReceipt.contractAddress;
console.log(`WorldCupBettingVault: ${bettingVault}`);

let seeded = 0;
let opened = 0;
if (SHOULD_SEED) {
  const allMarkets = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const markets = allMarkets.slice(0, Number.isFinite(MAX_SEED_MARKETS) ? MAX_SEED_MARKETS : allMarkets.length);
  console.log(`Seeding ${markets.length}/${allMarkets.length} markets${SHOULD_OPEN ? " and opening them" : ""}...`);
  const marketType = {MatchWinner: 0n, GroupWinner: 1n, TournamentWinner: 2n};
  for (const m of markets) {
    const outcomeTeamIds = m.outcomes.map((o) => BigInt(o.teamId));
    const tx = await walletClient.writeContract({
      address: bettingVault,
      abi: betting.abi,
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
    await wait(publicClient, tx, `createMarket ${m.marketId}`);
    seeded++;
    if (SHOULD_OPEN) {
      const openTx = await walletClient.writeContract({address: bettingVault, abi: betting.abi, functionName: "openMarket", args: [BigInt(m.marketId)]});
      await wait(publicClient, openTx, `openMarket ${m.marketId}`);
      opened++;
    }
    console.log(`OK market ${m.marketId}: ${m.label}`);
  }
}

const reads = {
  worldCupViewer: await publicClient.readContract({address: bettingVault, abi: betting.abi, functionName: "worldCupViewer"}),
  guardian: await publicClient.readContract({address: bettingVault, abi: betting.abi, functionName: "guardian"}),
  operator: await publicClient.readContract({address: bettingVault, abi: betting.abi, functionName: "operator"}),
  marketCount: (await publicClient.readContract({address: bettingVault, abi: betting.abi, functionName: "marketCount"})).toString(),
};

fs.mkdirSync(outDir, {recursive: true});
const deployment = {
  chain: "bsc-testnet",
  chainId: 97,
  rpcUrl: RPC_URL,
  deployer: account.address,
  mockWorldCupViewer: mockViewerAddress,
  worldCupViewer,
  bettingVault,
  guardian: GUARDIAN,
  operator: OPERATOR,
  seededMarkets: seeded,
  openedMarkets: opened,
  deployedAt: new Date().toISOString(),
  reads,
};
const deploymentPath = path.join(outDir, `bsc-testnet-${Date.now()}.json`);
fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
patchEnv({
  VITE_BSC_CHAIN_ID: "97",
  VITE_BSC_RPC_URL: RPC_URL,
  VITE_BETTING_VAULT_ADDRESS: bettingVault,
  VITE_WORLD_CUP_VIEWER_ADDRESS: worldCupViewer,
});

console.log("Verified reads:", reads);
console.log(`Deployment saved: ${deploymentPath}`);
console.log("Done");
console.log(`VITE_BETTING_VAULT_ADDRESS=${bettingVault}`);
console.log(`VITE_WORLD_CUP_VIEWER_ADDRESS=${worldCupViewer}`);
