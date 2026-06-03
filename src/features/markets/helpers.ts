import type { MarketFixture, MarketKind } from './types';
import { marketKind } from './types';

export const MARKET_KIND_LABELS: Record<MarketKind, string> = {
  tournament: 'markets.tournament',
  group: 'markets.group',
  match: 'markets.match',
};

/** All distinct outcome names across a market (for search). */
export function marketSearchText(market: MarketFixture): string {
  return [market.title, market.zhTitle, ...market.outcomes.flatMap((o) => [o.name, o.zh])]
    .join(' ')
    .toLowerCase();
}

export type MarketFilter = {
  kind: MarketKind | 'all';
  query: string;
};

export function filterMarkets(markets: MarketFixture[], filter: MarketFilter): MarketFixture[] {
  const q = filter.query.trim().toLowerCase();
  return markets.filter((market) => {
    if (filter.kind !== 'all' && marketKind(market.type) !== filter.kind) return false;
    if (q && !marketSearchText(market).includes(q)) return false;
    return true;
  });
}

/** Group markets by kind for sectioned display. */
export function groupByKind(markets: MarketFixture[]): Record<MarketKind, MarketFixture[]> {
  const groups: Record<MarketKind, MarketFixture[]> = { tournament: [], group: [], match: [] };
  for (const m of markets) groups[marketKind(m.type)].push(m);
  return groups;
}
