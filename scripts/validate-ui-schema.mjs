import fs from "node:fs";
import solc from "solc";

const schema = JSON.parse(fs.readFileSync(new URL("../schemas/vault-ui-schema.reference.json", import.meta.url)));
const requiredTop = ["vaultType", "description", "methods", "vaultDataSchema", "factory"];
for (const key of requiredTop) {
  if (!(key in schema)) throw new Error(`missing top-level ${key}`);
}
if (schema.vaultType !== "WorldCupPolymarketVault") throw new Error("wrong vaultType");
if (!Array.isArray(schema.methods) || schema.methods.length < 12) throw new Error("not enough user-facing methods");

const mustExpose = [
  "description",
  "totalRevenueReceived",
  "taxToken",
  "bettingVault",
  "bettingMarketCount",
  "totalBettingRewardShares",
  "totalTaxRewardsReceivedByBetting",
  "claimableBettingTaxRewards",
  "lastSettlementResolved",
  "lastSettlementTeamName",
  "getWorldCupWinner",
  "getGroupWinner",
  "getMatchResult",
  "getTeamName",
  "marketCount",
  "getMarket",
  "getMarkets",
  "getMarketTiming"
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
if (writeMethods.length) throw new Error(`clean user UI schema should not expose write/admin methods: ${writeMethods.join(",")}`);
const readMethods = schema.methods.filter((m) => !m.isWriteMethod).map((m) => m.name);
for (const name of mustExpose) {
  if (!readMethods.includes(name)) throw new Error(`user-facing method ${name} should be marked read-only`);
}
const forbiddenUserUi = ["setOperator", "upsertMarket", "refreshSettlement", "setBettingVault", "forwardTaxRewardsToBetting", "emergencyWithdrawNative", "emergencyWithdrawToken", "guardian", "operator", "worldCupViewer"];
for (const name of forbiddenUserUi) {
  if (names.includes(name)) throw new Error(`admin/internal method ${name} should not be exposed in clean user UI schema`);
}
const getMarkets = schema.methods.find((m) => m.name === "getMarkets");
if (!getMarkets.isOutputArray) throw new Error("getMarkets should mark isOutputArray=true");
for (const key of ["description", "fields", "isArray"]) {
  if (!(key in (schema.vaultDataSchema ?? {}))) throw new Error(`vaultDataSchema missing ${key}`);
}
const vaultDataNames = schema.vaultDataSchema.fields.map((f) => f.name);
for (const name of ["worldCupViewer", "operator", "bettingVault"]) {
  if (!vaultDataNames.includes(name)) throw new Error(`vaultDataSchema does not expose launch field ${name}`);
}
const factoryNotes = [schema.vaultDataSchema.factoryNotes, ...(schema.factory.notes ?? [])].join("\n");
if (!/betting vault|bettors/i.test(factoryNotes)) {
  throw new Error("factory notes must describe the betting vault reward receiver");
}

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
  settings: { outputSelection: { "*": { "WorldCupPolymarketVault": ["abi"] } } }
};
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (output.errors ?? []).filter((e) => e.severity === "error");
if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
const abi = output.contracts["WorldCupPolymarketVault.sol"].WorldCupPolymarketVault.abi;
const excludedAbiFunctions = new Set(["vaultUISchema", "vaultDataSchema", "initialize"]);
const abiFunctions = abi.filter((entry) => entry.type === "function" && !excludedAbiFunctions.has(entry.name)).map((entry) => entry.name).sort();
const schemaNames = names.slice().sort();
const staleInSchema = schemaNames.filter((name) => !abiFunctions.includes(name));
if (staleInSchema.length) {
  throw new Error(`schema/ABI mismatch; stale=${staleInSchema.join(",")}`);
}
const intentionallyHidden = new Set(["emergencyWithdrawNative", "emergencyWithdrawToken", "forwardTaxRewardsToBetting", "guardian", "lastSettlementMatchId", "lastSettlementTeamId", "operator", "refreshSettlement", "setBettingVault", "setOperator", "upsertMarket", "worldCupViewer"]);
const missingFromSchema = abiFunctions.filter((name) => !schemaNames.includes(name) && !intentionallyHidden.has(name));
if (missingFromSchema.length) {
  throw new Error(`schema/ABI mismatch; missing user-facing=${missingFromSchema.join(",")}`);
}

console.log(`OK: ${schema.vaultType} exposes ${schema.methods.length} UI-schema methods plus ${schema.vaultDataSchema.fields.length} vaultData fields: ${names.join(", ")}`);
