import { useMemo } from 'react';
import { marketFixtures } from '../../data/markets';
import type { MarketFixture } from './types';
import { filterMarkets, type MarketFilter } from './helpers';

/** All markets (static fixtures today; on-chain reads layer in at PR #5). */
export function useMarkets(): MarketFixture[] {
  return marketFixtures;
}

export function useMarket(marketId: number | undefined): MarketFixture | undefined {
  return useMemo(
    () => (marketId ? marketFixtures.find((m) => m.marketId === marketId) : undefined),
    [marketId],
  );
}

export function useFilteredMarkets(filter: MarketFilter): MarketFixture[] {
  return useMemo(() => filterMarkets(marketFixtures, filter), [filter]);
}
