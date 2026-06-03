import { useEffect, useState } from 'react';
import { formatEther } from 'viem';
import { publicClient } from '../../lib/viem';
import { BETTING_VAULT_ADDRESS } from '../../lib/env';
import { marketFixtures } from '../../data/markets';
import { bettingAbi } from './abi';

export interface OutcomeStake {
  teamId: number;
  name: string;
  flag: string;
  stakeBnb: number;
}

export interface Position {
  marketId: number;
  title: string;
  zhTitle: string;
  stakes: OutcomeStake[];
  totalStakeBnb: number;
  claimableBnb: number;
  refundableBnb: number;
}

interface State {
  positions: Position[];
  loading: boolean;
  error: string | null;
}

const wei = (v: bigint) => Number(formatEther(v));

/** Scans every market for the user's stakes, claimable winnings and refunds
 *  via a single multicall batch. Read-only. */
export function usePositions(address?: `0x${string}` | null): State & { reload: () => void } {
  const [state, setState] = useState<State>({ positions: [], loading: false, error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!address || !BETTING_VAULT_ADDRESS) {
      setState({ positions: [], loading: false, error: null });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));

    async function scan() {
      try {
        const base = { address: BETTING_VAULT_ADDRESS!, abi: bettingAbi } as const;
        // Build one flat multicall: per market -> claimable, refundable, then one getUserBet per outcome.
        type Call = { type: 'claimable' | 'refundable' | 'bet'; marketId: number; teamId?: number };
        const calls: Call[] = [];
        const contracts: unknown[] = [];
        for (const m of marketFixtures) {
          calls.push({ type: 'claimable', marketId: m.marketId });
          contracts.push({ ...base, functionName: 'claimable', args: [BigInt(m.marketId), address!] });
          calls.push({ type: 'refundable', marketId: m.marketId });
          contracts.push({ ...base, functionName: 'refundable', args: [BigInt(m.marketId), address!] });
          for (const o of m.outcomes) {
            calls.push({ type: 'bet', marketId: m.marketId, teamId: o.teamId });
            contracts.push({ ...base, functionName: 'getUserBet', args: [BigInt(m.marketId), address!, BigInt(o.teamId)] });
          }
        }

        const results = (await publicClient.multicall({
          contracts: contracts as never,
          allowFailure: true,
        })) as Array<{ status: 'success' | 'failure'; result?: bigint }>;

        const byMarket = new Map<number, Position>();
        const ensure = (marketId: number): Position => {
          let p = byMarket.get(marketId);
          if (!p) {
            const fx = marketFixtures.find((m) => m.marketId === marketId)!;
            p = {
              marketId,
              title: fx.title,
              zhTitle: fx.zhTitle,
              stakes: [],
              totalStakeBnb: 0,
              claimableBnb: 0,
              refundableBnb: 0,
            };
            byMarket.set(marketId, p);
          }
          return p;
        };

        results.forEach((r, i) => {
          if (r.status !== 'success') return;
          const call = calls[i];
          const value = r.result as bigint;
          if (value === 0n && call.type === 'bet') return;
          const p = ensure(call.marketId);
          if (call.type === 'claimable') p.claimableBnb = wei(value);
          else if (call.type === 'refundable') p.refundableBnb = wei(value);
          else if (call.type === 'bet' && call.teamId != null) {
            const fx = marketFixtures.find((m) => m.marketId === call.marketId)!;
            const o = fx.outcomes.find((x) => x.teamId === call.teamId)!;
            const stakeBnb = wei(value);
            p.stakes.push({ teamId: o.teamId, name: o.name, flag: o.flag, stakeBnb });
            p.totalStakeBnb += stakeBnb;
          }
        });

        const positions = [...byMarket.values()].filter(
          (p) => p.totalStakeBnb > 0 || p.claimableBnb > 0 || p.refundableBnb > 0,
        );

        if (!alive) return;
        setState({ positions, loading: false, error: null });
      } catch (err) {
        if (!alive) return;
        setState({ positions: [], loading: false, error: err instanceof Error ? err.message : 'scan failed' });
      }
    }

    scan();
    return () => {
      alive = false;
    };
  }, [address, nonce]);

  return { ...state, reload: () => setNonce((n) => n + 1) };
}
