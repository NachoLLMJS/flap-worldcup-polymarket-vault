import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import fs from 'node:fs';

const RPC = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.BSC_PRIVATE_KEY;
const BETTING_VAULT = process.env.BETTING_VAULT || '0xfc069b80829304BD7dbC52772c3645BCF41B0c59';
const CONTRACT_OUTPUT = process.env.CONTRACT_OUTPUT || '/mnt/c/Users/nacho/Desktop/POLYFLAP CONTRACTS 1.2/standard-json-output-polyflap-current.json';
const FIXTURE_DATES = process.env.FIXTURE_DATES || 'src/data/fixture-dates.ts';
const CUTOFF = Math.floor(Date.parse(process.env.CUTOFF_ISO || '2026-06-18T00:00:00Z') / 1000);

if (!PRIVATE_KEY) throw new Error('Set PRIVATE_KEY or BSC_PRIVATE_KEY in the shell, not in this file.');
const compiled = JSON.parse(fs.readFileSync(CONTRACT_OUTPUT, 'utf8'));
const abi = compiled.contracts['WorldCupBettingVault.sol'].WorldCupBettingVault.abi;
const fixtureText = fs.readFileSync(FIXTURE_DATES, 'utf8');
const fixtures = new Map();
for (const m of fixtureText.matchAll(/^\s*(\d+):\s*K\('([^']+)'\).*?\/\/\s*(.*)$/gm)) {
  const id = Number(m[1]);
  if (id >= 14 && id <= 85) fixtures.set(id, { kickoff: Math.floor(Date.parse(m[2]) / 1000), label: m[3].trim() });
}
const account = privateKeyToAccount(PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);
const publicClient = createPublicClient({ chain: bsc, transport: http(RPC) });
const walletClient = createWalletClient({ account, chain: bsc, transport: http(RPC) });
const statuses = ['Draft', 'Open', 'Locked', 'Resolved', 'Cancelled'];
const block = await publicClient.getBlock();
const now = Number(block.timestamp);
console.log(JSON.stringify({ account: account.address, bettingVault: BETTING_VAULT, block: Number(block.number), nowIso: new Date(now*1000).toISOString(), cutoffIso: new Date(CUTOFF*1000).toISOString() }, null, 2));
let locked=0, opened=0, updated=0, alreadyClosed=0;
for (let id=14; id<=85; id++) {
  const fx = fixtures.get(id);
  if (!fx) throw new Error(`missing fixture ${id}`);
  const shouldOpen = fx.kickoff >= CUTOFF;
  const openTime = shouldOpen ? BigInt(Math.max(0, fx.kickoff - 30*24*60*60)) : BigInt(Math.max(0, Math.min(fx.kickoff - 30*24*60*60, now - 7200)));
  const closeTime = shouldOpen ? BigInt(fx.kickoff) : BigInt(now - 60);
  const resolveAfter = shouldOpen ? BigInt(fx.kickoff + 2*60*60) : BigInt(now);
  const before = await publicClient.readContract({ address: BETTING_VAULT, abi, functionName: 'getMarket', args: [BigInt(id)] });
  const bm = before.market || before[0]?.market || before[0];
  const beforeStatus = Number(bm.status);
  const hash = await walletClient.writeContract({ address: BETTING_VAULT, abi, functionName: 'updateMarketTiming', args: [BigInt(id), openTime, closeTime, resolveAfter, shouldOpen], gasPrice: 50_000_000n });
  await publicClient.waitForTransactionReceipt({ hash });
  updated++;
  const after = await publicClient.readContract({ address: BETTING_VAULT, abi, functionName: 'getMarket', args: [BigInt(id)] });
  const am = after.market || after[0]?.market || after[0];
  const afterStatus = Number(am.status);
  if (shouldOpen) {
    opened++;
    console.log(JSON.stringify({ id, action:'open_future', label:am.label, kickoffIso:new Date(fx.kickoff*1000).toISOString(), before:statuses[beforeStatus], after:statuses[afterStatus] }));
  } else if (afterStatus === 1) {
    const lockHash = await walletClient.writeContract({ address: BETTING_VAULT, abi, functionName: 'lockMarket', args: [BigInt(id)], gasPrice: 50_000_000n });
    await publicClient.waitForTransactionReceipt({ hash: lockHash });
    locked++;
    console.log(JSON.stringify({ id, action:'lock_cutoff_past', label:am.label, kickoffIso:new Date(fx.kickoff*1000).toISOString(), before:statuses[beforeStatus] }));
  } else {
    alreadyClosed++;
  }
}
console.log(JSON.stringify({ done:true, updated, opened, locked, alreadyClosed }));
