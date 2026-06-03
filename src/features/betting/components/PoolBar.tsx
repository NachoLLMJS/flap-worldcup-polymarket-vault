import { useTranslation } from 'react-i18next';
import type { MarketFixture } from '../../markets/types';
import type { MarketChainData } from '../useMarketChain';

const TRACK_COLORS = [
  'bg-accent',
  'bg-info',
  'bg-success',
  'bg-warning',
  'bg-sand',
];

/** Horizontal distribution of the market pool across outcomes. */
export function PoolBar({ market, chain }: { market: MarketFixture; chain: MarketChainData }) {
  const { t, i18n } = useTranslation();
  const zh = i18n.resolvedLanguage?.startsWith('zh');
  const ranked = [...market.outcomes]
    .map((o) => ({ outcome: o, share: chain.shares[o.teamId] ?? 0 }))
    .sort((a, b) => b.share - a.share);

  if (chain.totalPoolBnb === 0) {
    return (
      <p className="text-sm text-fg-subtle">No bets in this market pool yet. Be the first.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs">
        <span className="uppercase tracking-[0.06em] text-fg-subtle">{t('markets.pool')}</span>
        <span className="font-mono tabular-nums text-fg">{chain.totalPoolBnb.toFixed(4)} BNB</span>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-bg-higher">
        {ranked.map(({ outcome, share }, i) =>
          share > 0 ? (
            <div
              key={outcome.teamId}
              className={`${TRACK_COLORS[i % TRACK_COLORS.length]} h-full`}
              style={{ width: `${Math.max(share * 100, 1)}%` }}
              title={`${outcome.name} ${(share * 100).toFixed(1)}%`}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {ranked.slice(0, 6).map(({ outcome, share }, i) => (
          <div key={outcome.teamId} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-fg-muted">
              <span className={`h-2 w-2 rounded-full ${TRACK_COLORS[i % TRACK_COLORS.length]}`} />
              <span aria-hidden>{outcome.flag}</span>
              {zh ? outcome.zh : outcome.name}
            </span>
            <span className="font-mono tabular-nums text-fg-muted">{(share * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
