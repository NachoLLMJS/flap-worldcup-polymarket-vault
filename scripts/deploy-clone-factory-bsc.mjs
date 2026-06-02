import fs from "node:fs";
import solc from "solc";
import { createPublicClient, createWalletClient, http, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

const rawKey = process.env.DEPLOYER_PRIVATE_KEY ?? "";
const PRIVATE_KEY = rawKey.startsWith("0x") ? rawKey : rawKey ? `0x${rawKey}` : "";
if (!/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
  throw new Error("Set DEPLOYER_PRIVATE_KEY to a 32-byte hex private key. Do not commit it.");
}

const source = fs.readFileSync(new URL("../contracts/WorldCupPolymarketVault.sol", import.meta.url), "utf8");
const input = {
  language: "Solidity",
  sources: { "WorldCupPolymarketVault.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 20 },
    viaIR: true,
    outputSelection: { "*": { "WorldCupPolymarketVault": ["abi", "evm.bytecode.object"], "WorldCupPolymarketVaultFactory": ["abi", "evm.bytecode.object"] } }
  }
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors ?? []).filter((e) => e.severity === "error");
if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join("\n"));

const account = privateKeyToAccount(PRIVATE_KEY);
const rpcUrl = process.env.BSC_RPC_URL ?? "https://bsc-dataseed.binance.org";
const publicClient = createPublicClient({ chain: bsc, transport: http(rpcUrl) });
const walletClient = createWalletClient({ account, chain: bsc, transport: http(rpcUrl) });
const balance = await publicClient.getBalance({ address: account.address });
console.log(`Deployer=${account.address}`);
console.log(`BalanceBNB=${formatEther(balance)}`);

const impl = output.contracts["WorldCupPolymarketVault.sol"].WorldCupPolymarketVault;
const factory = output.contracts["WorldCupPolymarketVault.sol"].WorldCupPolymarketVaultFactory;
console.log(`ImplementationBytes=${impl.evm.bytecode.object.length / 2}`);
console.log(`FactoryBytes=${factory.evm.bytecode.object.length / 2}`);

const implHash = await walletClient.deployContract({
  abi: impl.abi,
  bytecode: `0x${impl.evm.bytecode.object}`,
  args: []
});
console.log(`ImplementationTx=${implHash}`);
const implReceipt = await publicClient.waitForTransactionReceipt({ hash: implHash, timeout: 180_000 });
if (implReceipt.status !== "success" || !implReceipt.contractAddress) throw new Error(`Implementation deploy failed: ${implReceipt.status}`);
console.log(`ImplementationAddress=${implReceipt.contractAddress}`);
console.log(`ImplementationGasUsed=${implReceipt.gasUsed}`);

const factoryHash = await walletClient.deployContract({
  abi: factory.abi,
  bytecode: `0x${factory.evm.bytecode.object}`,
  args: [implReceipt.contractAddress]
});
console.log(`FactoryTx=${factoryHash}`);
const factoryReceipt = await publicClient.waitForTransactionReceipt({ hash: factoryHash, timeout: 180_000 });
if (factoryReceipt.status !== "success" || !factoryReceipt.contractAddress) throw new Error(`Factory deploy failed: ${factoryReceipt.status}`);
console.log(`FactoryAddress=${factoryReceipt.contractAddress}`);
console.log(`FactoryGasUsed=${factoryReceipt.gasUsed}`);

const codeImpl = await publicClient.getCode({ address: implReceipt.contractAddress });
const codeFactory = await publicClient.getCode({ address: factoryReceipt.contractAddress });
console.log(`ImplementationCodeBytes=${(codeImpl.length - 2) / 2}`);
console.log(`FactoryCodeBytes=${(codeFactory.length - 2) / 2}`);
