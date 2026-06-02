import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const root = new URL("../", import.meta.url).pathname;
const main = path.join(root, "src/WorldCupBettingVault.sol");

function findImports(importPath) {
  const candidates = [
    path.join(root, importPath),
    path.join(root, "src", importPath),
    path.join(path.dirname(main), importPath.replace(/^\.\//, "")),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return { contents: fs.readFileSync(p, "utf8") };
  }
  return { error: `Import not found: ${importPath}` };
}

const input = {
  language: "Solidity",
  sources: {
    "src/WorldCupBettingVault.sol": { content: fs.readFileSync(main, "utf8") }
  },
  settings: {
    optimizer: { enabled: true, runs: 50 },
    viaIR: true,
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] } }
  }
};

const out = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
for (const e of out.errors ?? []) {
  if (e.severity === "error") console.error(e.formattedMessage);
}
const errors = (out.errors ?? []).filter((e) => e.severity === "error");
if (errors.length) process.exit(1);

const c = out.contracts["src/WorldCupBettingVault.sol"].WorldCupBettingVault;
const creation = c.evm.bytecode.object.length / 2;
const deployed = c.evm.deployedBytecode.object.length / 2;
console.log(`OK: WorldCupBettingVault creation=${creation} bytes deployed=${deployed} bytes abi=${c.abi.length}`);
if (deployed > 24576) throw new Error(`WorldCupBettingVault deployed bytecode too large: ${deployed}`);
