import { useEffect, useState } from 'react';
import { formatEther } from 'viem';
import { publicClient } from '../../lib/viem';
import { BETTING_VAULT_ADDRESS } from '../../lib/env';
import { bettingAbi, MARKET_STATUS, type OnChainMarketStatus } from './abi';

export interface MarketChainData {
  status: OnChainMarketStatus;
  totalPoolWei: bigint;
  totalPoolBnb: number;
  closeTime: number; // unix seconds
  resolveAfter: number;
  winningTeamId: number;
  /** teamId -> pool in wei */
  pools: Record<number, bigint>;
  /** teamId -> share 0..1 of total pool */
  shares: Record<number, number>;
}

interface State {
  data: MarketChainData | null;
  loading: boolean;
  error: string | null;
}

/** Reads live on-chain state for one market (status, pools, close time).
 *  Read-only — no wallet required. Polls every 15s. */
export function useMarketChain(marketId: number | undefined): State {
  const [state, setState] = useState<State>({ data: null, loading: Boolean(marketId), error: null });

  useEffect(() => {
    if (!marketId || !BETTING_VAULT_ADDRESS) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let alive = true;

    async function read() {
      try {
        const res = await publicClient.readContract({
          address: BETTING_VAULT_ADDRESS!,
          abi: bettingAbi,
          functionName: 'getMarket',
          args: [BigInt(marketId!)],
        });
        const m = res.market;
        const pools: Record<number, bigint> = {};
        const shares: Record<number, number> = {};
        const total = m.totalPool;
        res.outcomeTeamIds.forEach((tid, i) => {
          const teamId = Number(tid);
          const pool = res.outcomePools[i] ?? 0n;
          pools[teamId] = pool;
          shares[teamId] = total > 0n ? Number((pool * 10000n) / total) / 10000 : 0;
        });
        if (!alive) return;
        setState({
          data: {
            status: MARKET_STATUS[m.status] ?? 'draft',
            totalPoolWei: total,
            totalPoolBnb: Number(formatEther(total)),
            closeTime: Number(m.closeTime),
            resolveAfter: Number(m.resolveAfter),
            winningTeamId: Number(m.winningTeamId),
            pools,
            shares,
          },
          loading: false,
          error: null,
        });
      } catch (err) {
        if (!alive) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'read failed',
        });
      }
    }

    read();
    const id = setInterval(read, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [marketId]);

  return state;
}
