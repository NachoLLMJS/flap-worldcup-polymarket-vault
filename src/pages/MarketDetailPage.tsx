import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Card } from '../components/ui';
import { Countdown } from '../components/Countdown';
import { OutcomeChip } from '../features/markets/components/OutcomeChip';
import { BetSlip } from '../features/betting/BetSlip';
import { PoolBar } from '../features/betting/components/PoolBar';
import { useMarketChain } from '../features/betting/useMarketChain';
import { useMarket } from '../features/markets/useMarkets';
import { marketKind, type Outcome } from '../features/markets/types';
import { MARKET_KIND_LABELS } from '../features/markets/helpers';

export function MarketDetailPage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const marketId = Number(params.marketId);
  const market = useMarket(Number.isFinite(marketId) ? marketId : undefined);
  const chain = useMarketChain(market?.marketId);
  const [selected, setSelected] = useState<Outcome | null>(null);

  if (!market) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-medium text-fg">Market not found</h1>
        <Link to="/markets" className="mt-4 inline-block text-accent hover:underline">
          ← {t('markets.all')}
        </Link>
      </div>
    );
  }

  const zh = i18n.resolvedLanguage?.startsWith('zh');
  const kind = marketKind(market.type);
  const title = zh ? market.zhTitle : market.title;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link to="/markets" className="text-sm text-fg-muted hover:text-fg">
        ← {t('markets.all')}
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Badge intent="accent">{t(MARKET_KIND_LABELS[kind])}</Badge>
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-fg-subtle">
                WorldCupViewer M{market.viewerMatchId}
              </span>
            </div>
            <h1 className="font-display text-3xl font-medium leading-tight text-fg sm:text-4xl">{title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
              <span>{market.close}</span>
              {chain.data && chain.data.status === 'open' && chain.data.closeTime > 0 && (
                <span className="font-mono tabular-nums">
                  {t('markets.closesAt')}: <Countdown to={chain.data.closeTime} className="text-fg" />
                </span>
              )}
            </div>
          </div>

          <Card variant="default" padding="lg">
            <h2 className="font-display text-lg font-medium text-fg">Outcomes</h2>
            <p className="mt-1 text-sm text-fg-subtle">Tap an outcome, then set your stake in the slip.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {market.outcomes.map((o) => (
                <OutcomeChip
                  key={o.teamId}
                  outcome={o}
                  selected={selected?.teamId === o.teamId}
                  onClick={() => setSelected(o)}
                />
              ))}
            </div>
          </Card>

          {chain.data && (
            <Card variant="default" padding="lg">
              <h2 className="font-display text-lg font-medium text-fg">{t('markets.pool')}</h2>
              <div className="mt-4">
                <PoolBar market={market} chain={chain.data} />
              </div>
            </Card>
          )}
        </div>

        {/* Slip */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <BetSlip market={market} outcome={selected} />
        </div>
      </div>
    </div>
  );
}
