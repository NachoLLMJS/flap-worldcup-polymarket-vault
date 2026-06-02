import fs from "node:fs";
import solc from "solc";

const schema = JSON.parse(fs.readFileSync(new URL("../schemas/vault-ui-schema.reference.json", import.meta.url)));
const requiredTop = ["vaultType", "description", "methods", "vaultDataSchema", "factory"];
for (const key of requiredTop) {
  if (!(key in schema)) throw new Error(`missing top-level ${key}`);
}
if (schema.vaultType !== "WorldCupPolymarketVault") throw new Error("wrong vaultType");
if (!Array.isArray(schema.methods) || schema.methods.length < 20) throw new Error("not enough methods");

const mustExpose = [
  "description",
  "taxToken",
  "guardian",
  "worldCupViewer",
  "operator",
  "totalRevenueReceived",
  "lastSettlementMatchId",
  "lastSettlementTeamId",
  "lastSettlementTeamName",
  "lastSettlementResolved",
  "getWorldCupWinner",
  "getGroupWinner",
  "getMatchResult",
  "getTeamName",
  "marketCount",
  "getMarket",
  "getMarkets",
  "getMarketTiming",
  "setOperator",
  "upsertMarket",
  "refreshSettlement",
  "recoverNative",
  "recoverTaxToken"
];
const names = schema.methods.map((m) => m.name);
for (const name of mustExpose) {
  if (!names.includes(name)) throw new Error(`schema does not expose ${name}`);
}

for (const method of schema.methods) {
  for (const key of ["name", "description", "inputs", "outputs", "approvals", "isInputArray", "isOutputArray", "isWriteMethod"]) {
    if (!(key in method)) throw new Error(`${method.name ?? "<unnamed>"} missing ${key}`);
  }
  if (!Array.isArray(method.inputs) || !Array.isArray(method.outputs) || !Array.isArray(method.approvals)) {
    throw new Error(`${method.name} has non-array inputs/outputs/approvals`);
  }
  for (const field of [...method.inputs, ...method.outputs]) {
    for (const key of ["name", "fieldType", "description", "decimals"]) {
      if (!(key in field)) throw new Error(`${method.name} field missing ${key}`);
    }
  }
}

const writeMethods = schema.methods.filter((m) => m.isWriteMethod).map((m) => m.name);
for (const name of ["setOperator", "upsertMarket", "refreshSettlement", "recoverNative", "recoverTaxToken"]) {
  if (!writeMethods.includes(name)) throw new Error(`write method ${name} not clearly marked`);
}
const readMethods = schema.methods.filter((m) => !m.isWriteMethod).map((m) => m.name);
for (const name of ["taxToken", "guardian", "worldCupViewer", "operator", "totalRevenueReceived"]) {
  if (!readMethods.includes(name)) throw new Error(`getter ${name} should be marked read-only`);
}
const getMarkets = schema.methods.find((m) => m.name === "getMarkets");
if (!getMarkets.isOutputArray) throw new Error("getMarkets should mark isOutputArray=true");

for (const name of ["recoverNative", "recoverTaxToken"]) {
  const method = schema.methods.find((m) => m.name === name);
  const description = method?.description ?? "";
  if (!/guardian emergency only/i.test(description)) {
    throw new Error(`${name} must be labeled Guardian emergency only`);
  }
  if (!/must not bypass user claims/i.test(description)) {
    throw new Error(`${name} must warn against bypassing future user escrow claims`);
  }
}
const recoverTaxToken = schema.methods.find((m) => m.name === "recoverTaxToken");
if (!/only recovers taxToken, not arbitrary assets/i.test(recoverTaxToken?.description ?? "")) {
  throw new Error("recoverTaxToken must state it cannot recover arbitrary assets");
}

for (const key of ["description", "fields", "isArray", "factoryNotes"]) {
  if (!(key in (schema.vaultDataSchema ?? {}))) throw new Error(`vaultDataSchema missing ${key}`);
}
const vaultDataNames = schema.vaultDataSchema.fields.map((f) => f.name);
for (const name of ["taxToken", "guardian", "worldCupViewer", "operator"]) {
  if (!vaultDataNames.includes(name)) throw new Error(`vaultDataSchema does not expose launch field ${name}`);
}
if (!schema.vaultDataSchema.fields.find((f) => f.name === "guardian")?.description.toLowerCase().includes("guardian")) {
  throw new Error("vaultDataSchema guardian field must preserve Guardian requirement");
}
const factoryNotes = [schema.vaultDataSchema.factoryNotes, ...(schema.factory.notes ?? [])].join("\n");
if (!/direct polymarket trading/i.test(factoryNotes)) {
  throw new Error("factory notes must state that direct Polymarket trading is not part of this MVP");
}

const source = fs.readFileSync(new URL("../contracts/WorldCupPolymarketVault.sol", import.meta.url), "utf8");
const input = {
  language: "Solidity",
  sources: { "WorldCupPolymarketVault.sol": { content: source } },
  settings: { outputSelection: { "*": { "WorldCupPolymarketVault": ["abi"] } } }
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors ?? []).filter((e) => e.severity === "error");
if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
const abi = output.contracts["WorldCupPolymarketVault.sol"].WorldCupPolymarketVault.abi;
const excludedAbiFunctions = new Set(["vaultUISchema", "vaultDataSchema", "initialize"]);
const abiFunctions = abi.filter((entry) => entry.type === "function" && !excludedAbiFunctions.has(entry.name)).map((entry) => entry.name).sort();
const schemaNames = names.slice().sort();
const missingFromSchema = abiFunctions.filter((name) => !schemaNames.includes(name));
const staleInSchema = schemaNames.filter((name) => !abiFunctions.includes(name));
if (missingFromSchema.length || staleInSchema.length) {
  throw new Error(`schema/ABI mismatch; missing=${missingFromSchema.join(",") || "none"}; stale=${staleInSchema.join(",") || "none"}`);
}

console.log(`OK: ${schema.vaultType} exposes ${schema.methods.length} UI-schema methods plus ${schema.vaultDataSchema.fields.length} vaultData fields: ${names.join(", ")}`);
