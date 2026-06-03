import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../components/ui';
import { Flag } from '../../../components/Flag';
import { Tilt } from '../../../components/Tilt';
import { cn } from '../../../lib/cn';
import { marketKind, type MarketFixture } from '../types';
import { MARKET_KIND_LABELS } from '../helpers';

const kindIntent = {
  tournament: 'accent',
  group: 'info',
  match: 'neutral',
} as const;

const kindBar = {
  tournament: 'from-accent via-gold to-accent',
  group: 'from-info via-info/40 to-info',
  match: 'from-border-strong via-fg-subtle/40 to-border-strong',
} as const;

const kindGlow = {
  tournament: 'group-hover:shadow-[0_18px_50px_-12px_oklch(58%_0.18_25_/_0.45)]',
  group: 'group-hover:shadow-[0_18px_50px_-12px_oklch(70%_0.13_230_/_0.35)]',
  match: 'group-hover:shadow-[0_18px_50px_-12px_oklch(8%_0.01_30_/_0.6)]',
} as const;

export function MarketCard({ market, className }: { market: MarketFixture; className?: string }) {
  const { t, i18n } = useTranslation();
  const zh = i18n.resolvedLanguage?.startsWith('zh');
  const kind = marketKind(market.type);
  const title = zh ? market.zhTitle : market.title;
  const previewOutcomes = market.outcomes.slice(0, 3);
  const extra = market.outcomes.length - previewOutcomes.length;

  return (
    <Tilt className={cn('h-full', className)}>
    <Link
      to={`/markets/${market.marketId}`}
      aria-label={title}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-bg-elevated',
        'transition-[border-color,box-shadow] duration-300 ease-out-quint',
        'hover:border-border-strong',
        kindGlow[kind],
      )}
    >
      {/* Top accent bar */}
      <span className={cn('h-[3px] w-full bg-gradient-to-r', kindBar[kind])} />
      {/* Sheen on hover */}
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(120% 80% at 50% -10%, oklch(85% 0.08 80 / 0.06), transparent 60%)' }}
      />

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <Badge intent={kindIntent[kind]} size="sm">
            {t(MARKET_KIND_LABELS[kind])}
          </Badge>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-fg-subtle">
            M{market.viewerMatchId}
          </span>
        </div>

        <h3 className="font-display text-lg font-semibold leading-tight tracking-[-0.01em] text-fg line-clamp-2">
          {title}
        </h3>

        <div className="flex flex-col gap-2">
          {previewOutcomes.map((o) => (
            <div
              key={o.teamId}
              className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-bg px-3 py-2 transition-colors duration-200 group-hover:border-border"
            >
              <Flag teamId={o.teamId} size="md" />
              <span className="truncate text-sm text-fg">{zh ? o.zh : o.name}</span>
            </div>
          ))}
          {extra > 0 && (
            <span className="text-center font-mono text-[11px] uppercase tracking-[0.06em] text-fg-subtle">
              +{extra} more outcomes
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border-subtle pt-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-fg-subtle">
            {market.outcomes.length} outcomes
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent transition-transform duration-200 group-hover:translate-x-0.5">
            {t('betting.placeBet')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
    </Tilt>
  );
}
