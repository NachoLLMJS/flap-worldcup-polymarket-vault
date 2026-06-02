import fs from "node:fs";
import solc from "solc";

const source = fs.readFileSync(new URL("../contracts/WorldCupPolymarketVault.sol", import.meta.url), "utf8");
const input = {
  language: "Solidity",
  sources: { "WorldCupPolymarketVault.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 20 },
    viaIR: true,
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } }
  }
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors ?? []).filter((e) => e.severity === "error");
if (errors.length) {
  for (const e of errors) console.error(e.formattedMessage);
  process.exit(1);
}
for (const e of output.errors ?? []) {
  console.warn(e.formattedMessage);
}
const contract = output.contracts["WorldCupPolymarketVault.sol"].WorldCupPolymarketVault;
if (!contract.evm.bytecode.object) throw new Error("empty bytecode");
const bytecodeBytes = contract.evm.bytecode.object.length / 2;
const maxSpuriousDragonBytes = 24576;
console.log(`OK: Solidity compiled. ABI entries=${contract.abi.length}, bytecode bytes=${bytecodeBytes}`);
if (bytecodeBytes > maxSpuriousDragonBytes) {
  console.warn(
    `DEPLOY BLOCKED: WorldCupPolymarketVault bytecode is ${bytecodeBytes} bytes, above the ${maxSpuriousDragonBytes}-byte Spurious Dragon limit. Split schema/factory/dev helpers or simplify before real deploy.`
  );
}
