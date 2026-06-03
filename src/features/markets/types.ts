/** Market type as labelled in the fixtures (matches on-chain MarketType enum order). */
export type MarketTypeLabel = 'Match Winner' | 'Group Winner' | 'Tournament Winner';

/** Canonical kebab key for filtering/UI. */
export type MarketKind = 'tournament' | 'group' | 'match';

export type Outcome = {
  teamId: number;
  name: string;
  zh: string;
  flag: string;
};

export type MarketFixture = {
  marketId: number;
  viewerMatchId: number;
  title: string;
  zhTitle: string;
  shrine: string;
  date: string;
  close: string;
  type: MarketTypeLabel;
  outcomes: Outcome[];
};

/** A user's current selection: a market + the outcome they tapped. */
export type Pick = { market: MarketFixture; outcome: Outcome };

/** On-chain market lifecycle (WorldCupBettingVault.MarketStatus). */
export type MarketState = 'draft' | 'open' | 'locked' | 'resolved' | 'cancelled';

/** Map a fixture label to its canonical kind. */
export function marketKind(type: MarketTypeLabel): MarketKind {
  if (type === 'Tournament Winner') return 'tournament';
  if (type === 'Group Winner') return 'group';
  return 'match';
}

/** Reserved teamId values from WorldCupViewer. */
export const RESERVED_TEAM_IDS = {
  pending: 0,
  others: 49,
  draw: 50,
} as const;
