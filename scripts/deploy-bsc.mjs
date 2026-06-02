import fs from "node:fs";
import solc from "solc";
import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY?.startsWith("0x")
  ? process.env.DEPLOYER_PRIVATE_KEY
  : process.env.DEPLOYER_PRIVATE_KEY
    ? `0x${process.env.DEPLOYER_PRIVATE_KEY}`
    : "";

if (!PRIVATE_KEY || !/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
  throw new Error("Set DEPLOYER_PRIVATE_KEY to a 32-byte hex private key. Do not commit it.");
}

const WORLD_CUP_VIEWER = process.env.WORLD_CUP_VIEWER ?? "0x00036192958C2aaAF9F445d3Cdc2979995EA333e";
const TAX_TOKEN = process.env.TAX_TOKEN ?? "0x0000000000000000000000000000000000000000";
const GUARDIAN = process.env.GUARDIAN;
const OPERATOR = process.env.OPERATOR ?? "0x0000000000000000000000000000000000000000";
const MIN_BALANCE_BNB = process.env.MIN_BALANCE_BNB ?? "0.0005";

const account = privateKeyToAccount(PRIVATE_KEY);
const guardian = GUARDIAN ?? account.address;

const source = fs.readFileSync(new URL("../contracts/WorldCupPolymarketVault.sol", import.meta.url), "utf8");
const input = {
  language: "Solidity",
  sources: { "WorldCupPolymarketVault.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 20 },
    viaIR: true,
    outputSelection: { "*": { "WorldCupPolymarketVault": ["abi", "evm.bytecode.object"] } }
  }
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors ?? []).filter((e) => e.severity === "error");
if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
const warnings = (output.errors ?? []).filter((e) => e.severity !== "error");
for (const warning of warnings) console.warn(warning.formattedMessage);
const contract = output.contracts["WorldCupPolymarketVault.sol"].WorldCupPolymarketVault;
const bytecode = `0x${contract.evm.bytecode.object}`;
const bytecodeBytes = contract.evm.bytecode.object.length / 2;
console.log(`Deploying WorldCupPolymarketVault bytecodeBytes=${bytecodeBytes}`);
if (bytecodeBytes > 24576) throw new Error(`Vault bytecode too large for EVM deployment: ${bytecodeBytes} bytes`);

const rpcUrl = process.env.BSC_RPC_URL ?? "https://bsc-dataseed.binance.org";
const publicClient = createPublicClient({ chain: bsc, transport: http(rpcUrl) });
const walletClient = createWalletClient({ account, chain: bsc, transport: http(rpcUrl) });

const balance = await publicClient.getBalance({ address: account.address });
console.log(`Deployer=${account.address}`);
console.log(`BalanceWei=${balance}`);
if (balance < parseEther(MIN_BALANCE_BNB)) {
  throw new Error(`Balance below MIN_BALANCE_BNB=${MIN_BALANCE_BNB}; not deploying.`);
}
console.log(`Constructor taxToken=${TAX_TOKEN} guardian=${guardian} worldCupViewer=${WORLD_CUP_VIEWER} operator=${OPERATOR}`);

const hash = await walletClient.deployContract({
  abi: contract.abi,
  bytecode,
  args: [TAX_TOKEN, guardian, WORLD_CUP_VIEWER, OPERATOR]
});
console.log(`TxHash=${hash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 180_000 });
console.log(`Status=${receipt.status}`);
console.log(`ContractAddress=${receipt.contractAddress}`);
console.log(`GasUsed=${receipt.gasUsed}`);
