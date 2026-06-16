export const BET_ACTIVITY_STORAGE_KEY = 'polyflap.betActivity.v1';

export type BetActivity = {
  id: string;
  action: 'buy' | 'sell';
  marketId: number;
  marketTitle: string;
  outcomeName: string;
  outcomeFlag: string;
  teamId: number;
  amountBnb: string;
  txHash: string;
  createdAt: string;
  blockNumber?: number;
  blockTimestamp?: number;
  withdrawUnlockTimestamp?: number;
  onChainStakeWei?: string;
  userAddress?: string;
};

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function readBetActivity(): BetActivity[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(BET_ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BetActivity[]) : [];
  } catch {
    return [];
  }
}

export function recordBetActivity(entry: Omit<BetActivity, 'id' | 'createdAt'>) {
  if (!canUseStorage()) return;
  const next: BetActivity = {
    ...entry,
    id: `${Date.now()}-${entry.txHash.slice(0, 10)}`,
    createdAt: new Date().toISOString(),
  };
  const rows = [next, ...readBetActivity()].slice(0, 12);
  window.localStorage.setItem(BET_ACTIVITY_STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent('polyflap:bet-activity'));
}
