import fs from "node:fs";
import solc from "solc";

const source = fs.readFileSync(new URL("../contracts/WorldCupPolymarketVault.sol", import.meta.url), "utf8");

function findImports(importPath) {
  const candidates = [
    new URL(`../contracts/${importPath.replace(/^\.\//, "")}`, import.meta.url),
    new URL(`../contracts/${importPath}`, import.meta.url)
  ];
  for (const url of candidates) {
    try {
      if (fs.existsSync(url)) return { contents: fs.readFileSync(url, "utf8") };
    } catch {}
  }
  return { error: `Import not found: ${importPath}` };
}
const input = {
  language: "Solidity",
  sources: { "WorldCupPolymarketVault.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 20 },
    viaIR: true,
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"]
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (output.errors ?? []).filter((e) => e.severity === "error");
if (errors.length) {
  for (const e of errors) console.error(e.formattedMessage);
  process.exit(1);
}
for (const e of output.errors ?? []) {
  console.warn(e.formattedMessage);
}

const contracts = output.contracts?.["WorldCupPolymarketVault.sol"];
if (!contracts) throw new Error("No compiled contracts returned");

const names = ["WorldCupPolymarketVault", "WorldCupPolymarketVaultFactory"];
const maxDeployedBytes = 24576;

for (const name of names) {
  const contract = contracts[name];
  if (!contract) throw new Error(`Missing ${name}`);
  const creationBytes = (contract.evm.bytecode.object.length || 0) / 2;
  const deployedBytes = (contract.evm.deployedBytecode.object.length || 0) / 2;
  if (!creationBytes || !deployedBytes) throw new Error(`${name}: empty bytecode`);
  const status = deployedBytes <= maxDeployedBytes ? "OK" : "TOO LARGE";
  console.log(`${status}: ${name}: creation=${creationBytes} bytes, deployed=${deployedBytes} bytes, ABI entries=${contract.abi.length}`);
  if (deployedBytes > maxDeployedBytes) {
    console.warn(`DEPLOY BLOCKED: ${name} deployed bytecode is ${deployedBytes} bytes, above ${maxDeployedBytes}`);
  }
}

console.log("OK: clone/factory Solidity compile completed with optimizer + viaIR.");
