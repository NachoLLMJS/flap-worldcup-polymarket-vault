import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');

const betting = read('foundry/worldcup-betting/src/WorldCupBettingVault.sol');
const main = read('src/main.tsx');
const css = read('src/styles.css');
const seedMarkets = JSON.parse(read('foundry/worldcup-betting/seed/initial-markets.json'));

assert.match(betting, /address public immutable feeRecipient;/, 'betting vault must expose immutable feeRecipient');
assert.match(betting, /uint256 public constant PROTOCOL_FEE_BPS = 100;/, 'betting fee must be fixed at 1%');
assert.match(betting, /feeRecipient = 0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e;/, 'fee recipient must be the requested wallet');
assert.match(betting, /_send\(payable\(feeRecipient\), fee\);/, '1% fee must be routed directly to the requested wallet on bet placement');
assert.doesNotMatch(betting, /protocolFeesAccrued \+=/, 'fees must not accrue for later guardian withdrawal');
assert.doesNotMatch(betting, /withdrawFees\(/, 'fee withdrawal function should not exist when fees route directly');
assert.match(betting, /function resolveMarket\(uint256 marketId\) external nonReentrant/, 'anyone must be able to trigger WorldCupViewer settlement without an operator bot');
assert.match(betting, /_resolveMarket\(marketId\);/, 'claim must lazily auto-resolve from WorldCupViewer before payout');
assert.doesNotMatch(betting, /resolveMarket\(uint256 marketId\) external onlyOperatorOrGuardian/, 'settlement cannot depend on operator/guardian maintenance');

assert.match(main, /VITE_BETTING_VAULT_ADDRESS/, 'web must read betting vault address env');
assert.match(main, /placeBet/, 'web must wire a real placeBet transaction path');
assert.match(main, /protocolFeeBps\s*=\s*100/, 'web must show 1% betting fee');
assert.match(main, /0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e/, 'web must show fee recipient wallet');
assert.doesNotMatch(main, /Real integration status/i, 'client UI must remove Real integration status section');
assert.doesNotMatch(main, /Vault UI Schema/i, 'public website must not expose the developer UI schema section');
assert.doesNotMatch(main, /Wallet loading/i, 'connected wallet pill must not get stuck on Wallet loading copy');
assert.match(main, /function pickBscWallet/, 'web must select BSC-capable EVM wallets by connected wallet type/provider, not only chainType');
assert.match(main, /wallet\.type === 'ethereum'/, 'web must support Privy connected wallets that expose type=ethereum for EVM chains like BSC');
assert.match(main, /walletClientType === 'privy-v2'/, 'web must support newer Privy embedded wallets');
assert.match(main, /BSC · \{walletDisplay/, 'connected wallet pill must explicitly label BSC runtime chain');
assert.match(main, /function TwitterProfilePill/, 'web must render connected Twitter profile data from Privy next to the wallet');
assert.match(main, /user\?\.twitter/, 'web must read Privy twitter account metadata when login uses Twitter');
assert.match(css, /\.twitterPill/, 'CSS must style the Twitter profile pill next to the wallet');
assert.doesNotMatch(main, /Syncing wallet…|Wallet missing/, 'web must not stay in an indefinite wallet hydration/loading state');
assert.match(main, /PolyFlap/, 'web must use the final product name PolyFlap');
assert.doesNotMatch(main, /Chinese-style|World Cup Dragon Vault|红票|钱包未开光|Dragon wallet ready|Vault UI Schema|fee route/i, 'public web copy must remove stale Chinese/dragon/schema/fee-route framing');
assert.match(main, /Buy \/ Sell|Sell \/ withdraw|withdrawBet/, 'web must expose buy and sell/withdraw actions');
assert.match(main, /World Cup markets|\{marketFixtures\.length\}/, 'web must expose all current WorldCupViewer reference-data markets, not only a tiny preview');
assert.match(main, /getWorldCupWinner\(\).*getGroupMatchWinners\(\).*getMatchResult\(\)/s, 'web copy must explain which live WorldCupViewer methods settle each market type');
assert.equal(seedMarkets.length, 85, 'seed must include all 85 WorldCupViewer reference-data markets');
assert.equal(seedMarkets[0].type, 'TournamentWinner', 'seed market 1 must be tournament winner via getWorldCupWinner');
assert.equal(seedMarkets.filter((m) => m.type === 'GroupWinner').length, 12, 'seed must include Group A-L winner markets');
assert.equal(seedMarkets.filter((m) => m.type === 'MatchWinner').length, 72, 'seed must include every listed match winner market');
assert.ok(seedMarkets.filter((m) => m.type === 'MatchWinner').every((m) => m.outcomes.some((o) => o.teamId === 50)), 'match winner markets must include reserved draw teamId 50');
assert.ok(seedMarkets[0].outcomes.some((o) => o.teamId === 49), 'tournament winner market must include reserved Others teamId 49');

assert.match(betting, /function withdrawBet\(uint256 marketId, uint256 teamId, uint256 amount\) external nonReentrant/, 'users must be able to withdraw open stake before market close');
assert.match(betting, /emit BetWithdrawn/, 'withdrawBet must emit a sell/withdraw event');
assert.doesNotMatch(css, /\.lantern|floatLantern|schemaPanel/, 'public CSS must remove floating Chinese lanterns and schema appendix styling');

console.log('OK: worldcup product regression checks passed');
