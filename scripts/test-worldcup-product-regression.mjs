import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, root), 'utf8');

// Concatenate the whole `src/` tree so product invariants are checked against
// the source regardless of how it is split into modules. (The Polyflap
// redesign lives under src/Polyflap/ + integration assets under src/lib,
// src/features, src/data.)
function readSrcTree() {
  const srcDir = fileURLToPath(new URL('src/', root));
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|css|json)$/.test(entry.name)) out.push(fs.readFileSync(full, 'utf8'));
    }
  };
  walk(srcDir);
  return out.join('\n');
}

const betting = read('foundry/worldcup-betting/src/WorldCupBettingVault.sol');
const main = readSrcTree();
const seedMarkets = JSON.parse(read('foundry/worldcup-betting/seed/initial-markets.json'));

/* ---- on-chain betting vault invariants (unchanged by the redesign) ---- */
assert.match(betting, /address public immutable feeRecipient;/, 'betting vault must expose immutable feeRecipient');
assert.match(betting, /uint256 public constant PROTOCOL_FEE_BPS = 100;/, 'betting fee must be fixed at 1%');
assert.match(betting, /feeRecipient = 0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e;/, 'fee recipient must be the requested wallet');
assert.match(betting, /_send\(payable\(feeRecipient\), fee\);/, '1% fee must be routed directly to the requested wallet on bet placement');
assert.doesNotMatch(betting, /protocolFeesAccrued \+=/, 'fees must not accrue for later guardian withdrawal');
assert.doesNotMatch(betting, /withdrawFees\(/, 'fee withdrawal function should not exist when fees route directly');
assert.match(betting, /function resolveMarket\(uint256 marketId\) external nonReentrant/, 'anyone must be able to trigger WorldCupViewer settlement without an operator bot');
assert.match(betting, /_resolveMarket\(marketId\);/, 'claim must lazily auto-resolve from WorldCupViewer before payout');
assert.doesNotMatch(betting, /resolveMarket\(uint256 marketId\) external onlyOperatorOrGuardian/, 'settlement cannot depend on operator/guardian maintenance');
assert.match(betting, /function withdrawBet\(uint256 marketId, uint256 teamId, uint256 amount\) external nonReentrant/, 'users must be able to withdraw open stake before market close');
assert.match(betting, /emit BetWithdrawn/, 'withdrawBet must emit a sell/withdraw event');

/* ---- web product invariants (Polyflap redesign) ----
   The redesign replaced the old single-page app (PolyFlap / href-anchor nav /
   TwitterProfilePill / styles.css) with a routed React app under src/Polyflap/.
   These assertions track the *product* invariants, not the old structure. */
// Real money plumbing — must stay wired.
assert.match(main, /VITE_BETTING_VAULT_ADDRESS/, 'web must read the betting vault address env');
assert.match(main, /placeBet/, 'web must wire a real placeBet transaction path');
assert.match(main, /withdrawBet/, 'web must wire withdrawBet (sell/withdraw before close)');
assert.match(main, /PROTOCOL_FEE_BPS\s*=\s*100|FEE_RATE\s*=\s*0\.01/, 'web must encode the fixed 1% protocol fee');
assert.match(main, /0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e/, 'web must reference the fee recipient wallet');

// Privy / BSC wallet selection — must stay correct.
assert.match(main, /function pickBscWallet/, 'web must select BSC-capable EVM wallets by connected wallet type/provider');
assert.match(main, /wallet\.type === 'ethereum'/, 'web must support Privy wallets that expose type=ethereum for EVM chains like BSC');
assert.match(main, /walletClientType === 'privy-v2'/, 'web must support newer Privy embedded wallets');
assert.match(main, /BNB Chain|BSC/, 'web must label the BNB Chain (BSC) runtime');

// Product identity + core surfaces (redesign).
assert.match(main, /Polyflap/, 'web must use the product name Polyflap');
assert.match(main, /Buy|Sell \/ withdraw|withdrawBet/, 'web must expose buy and sell/withdraw actions');
assert.match(main, /PortfolioPage/, 'web must include a Portfolio surface');
assert.match(main, /Open positions|polyflap\.betActivity\.v1/, 'portfolio must surface open positions / on-chain bet activity');
assert.match(main, /function syncOpenPositions|syncOpenPositions\s*=\s*useCallback/, 'live portfolio must reconstruct open positions after refresh');
assert.match(main, /getUserBet[\s\S]*multicall|multicall[\s\S]*getUserBet/, 'position sync must verify real on-chain user stakes');
assert.match(main, /BetPlaced[\s\S]*getLogs|BET_PLACED_EVENT/, 'position sync must recover buy timestamps from BetPlaced logs when local activity is missing');
assert.match(main, /withdrawUnlockTimestamp[\s\S]*WITHDRAW_COOLDOWN_SECONDS/, 'withdraw button must keep a 5 minute cooldown timestamp');
assert.match(main, /userAddress/, 'persisted bet activity must be scoped to the connected wallet');
assert.match(main, /marketFixtures|ALL_MARKETS/, 'web must expose the full WorldCupViewer market catalog, not a tiny preview');
assert.match(main, /WorldCupViewer/, 'web must frame settlement as on-chain via WorldCupViewer');

// Stale dev/legacy framing must not reappear in the public client.
assert.doesNotMatch(main, /Real integration status/i, 'client UI must not expose the dev integration-status section');
assert.doesNotMatch(main, /Vault UI Schema/i, 'public website must not expose the developer UI schema section');
assert.doesNotMatch(main, /World Cup Dragon Vault|红票|钱包未开光|Dragon wallet ready/i, 'public web copy must stay free of stale dragon/vault framing');

/* ---- seed market reference data (unchanged by the redesign) ---- */
assert.equal(seedMarkets.length, 85, 'seed must include all 85 WorldCupViewer reference-data markets');
assert.equal(seedMarkets[0].type, 'TournamentWinner', 'seed market 1 must be tournament winner via getWorldCupWinner');
assert.equal(seedMarkets.filter((m) => m.type === 'GroupWinner').length, 12, 'seed must include Group A-L winner markets');
assert.equal(seedMarkets.filter((m) => m.type === 'MatchWinner').length, 72, 'seed must include every listed match winner market');
assert.ok(seedMarkets.filter((m) => m.type === 'MatchWinner').every((m) => m.outcomes.some((o) => o.teamId === 50)), 'match winner markets must include reserved draw teamId 50');
assert.ok(seedMarkets[0].outcomes.some((o) => o.teamId === 49), 'tournament winner market must include reserved Others teamId 49');

console.log('OK: worldcup product regression checks passed');
