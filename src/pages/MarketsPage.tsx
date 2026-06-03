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
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-medium text-fg sm:text-4xl">{t('markets.all')}</h1>
        <p className="text-fg-muted">{t('brand.tagline')}.</p>
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
