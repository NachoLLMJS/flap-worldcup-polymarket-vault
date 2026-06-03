import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Card } from '../../../components/ui';
import { cn } from '../../../lib/cn';
import { marketKind, type MarketFixture } from '../types';
import { MARKET_KIND_LABELS } from '../helpers';

const kindIntent = {
  tournament: 'accent',
  group: 'info',
  match: 'neutral',
} as const;

export function MarketCard({ market, className }: { market: MarketFixture; className?: string }) {
  const { t, i18n } = useTranslation();
  const zh = i18n.resolvedLanguage?.startsWith('zh');
  const kind = marketKind(market.type);
  const title = zh ? market.zhTitle : market.title;
  const previewOutcomes = market.outcomes.slice(0, 4);
  const extra = market.outcomes.length - previewOutcomes.length;

  return (
    <Card
      variant="default"
      interactive
      padding="none"
      className={cn('group relative flex flex-col overflow-hidden', className)}
    >
      <Link to={`/markets/${market.marketId}`} className="flex flex-col gap-4 p-5" aria-label={title}>
        <div className="flex items-center justify-between gap-2">
          <Badge intent={kindIntent[kind]} size="sm">
            {t(MARKET_KIND_LABELS[kind])}
          </Badge>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-fg-subtle">
            M{market.viewerMatchId}
          </span>
        </div>

        <h3 className="font-display text-lg font-medium leading-tight text-fg line-clamp-2">
          {title}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          {previewOutcomes.map((o) => (
            <span
              key={o.teamId}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg px-2.5 h-7 text-xs text-fg-muted"
            >
              <span aria-hidden>{o.flag}</span>
              <span className="truncate max-w-24">{zh ? o.zh : o.name}</span>
            </span>
          ))}
          {extra > 0 && (
            <span className="inline-flex items-center rounded-full border border-border bg-bg px-2.5 h-7 text-xs text-fg-subtle">
              +{extra}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border-subtle pt-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-fg-subtle">
            {market.outcomes.length} outcomes
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-transform duration-200 group-hover:translate-x-0.5">
            {t('betting.placeBet')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </Link>
    </Card>
  );
}
