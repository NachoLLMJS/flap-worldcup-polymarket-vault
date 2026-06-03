import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Tag } from '../components/ui';
import { MarketGrid } from '../features/markets/components/MarketGrid';
import { useFilteredMarkets } from '../features/markets/useMarkets';
import type { MarketKind } from '../features/markets/types';

const KINDS: Array<{ key: MarketKind | 'all'; label: string }> = [
  { key: 'all', label: 'markets.all' },
  { key: 'tournament', label: 'markets.tournament' },
  { key: 'group', label: 'markets.group' },
  { key: 'match', label: 'markets.match' },
];

export function MarketsPage() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<MarketKind | 'all'>('all');
  const [query, setQuery] = useState('');
  const markets = useFilteredMarkets({ kind, query });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Banner header */}
      <header className="relative mb-8 overflow-hidden rounded-2xl border border-border">
        <picture>
          <source media="(max-width: 1024px)" srcSet="/hero/markets-1024.webp" />
          <img src="/hero/markets-1600.webp" alt="" className="h-44 w-full object-cover object-center sm:h-52" />
        </picture>
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, oklch(14% 0.015 30 / 0.92) 0%, oklch(14% 0.015 30 / 0.55) 50%, oklch(14% 0.015 30 / 0.2) 100%)' }}
        />
        <div className="absolute inset-0 flex flex-col justify-center gap-1.5 px-6 sm:px-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">World Cup 2026</span>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-fg sm:text-4xl">
            All <span className="font-editorial font-light italic text-gold">markets</span>
          </h1>
          <p className="max-w-md text-sm text-fg-muted">{t('brand.tagline')}.</p>
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <Tag key={k.key} active={kind === k.key} onClick={() => setKind(k.key)}>
              {t(k.label)}
            </Tag>
          ))}
        </div>
        <div className="sm:w-72">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('markets.search')}
            leftSlot={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
          />
        </div>
      </div>

      <p className="mt-4 font-mono text-xs uppercase tracking-[0.06em] text-fg-subtle">
        {markets.length} markets
      </p>

      {markets.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="text-fg-muted">{t('markets.empty')}</p>
        </div>
      ) : (
        <div className="mt-6">
          <MarketGrid markets={markets} />
        </div>
      )}
    </div>
  );
}
