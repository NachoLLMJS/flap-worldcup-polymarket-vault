import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button } from '../components/ui';
import { MarketCard } from '../features/markets/components/MarketCard';
import { useMarkets } from '../features/markets/useMarkets';
import { isPrivyConfigured } from '../lib/env';

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const markets = useMarkets();
  const featured = markets.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[480px] w-[760px] -translate-x-1/2 rounded-full bg-accent opacity-[0.12] blur-[120px]" />
        <div className="flex flex-col items-start gap-6 text-left">
          <Badge intent="accent" size="md" dot>
            {isPrivyConfigured ? 'Live on BNB Chain' : 'Preview · World Cup 2026'}
          </Badge>
          <h1 className="max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-fg sm:text-6xl md:text-7xl">
            Bet the World Cup,
            <span className="text-accent"> on-chain.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
            {t('brand.tagline')}. Pick an outcome, stake BNB, and settle from official Flap WorldCupViewer results. No
            bookmaker — just a transparent pari-mutuel pool.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button intent="primary" size="lg" onClick={() => navigate('/markets')}>
              {t('markets.all')}
            </Button>
            <Button intent="secondary" size="lg" onClick={() => navigate('/about')}>
              {t('nav.about')}
            </Button>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat value={`${markets.length}`} label="markets" />
            <Stat value="1%" label="platform fee" />
            <Stat value="BNB" label="native stake" />
            <Stat value="Pari-mutuel" label="proportional payout" />
          </dl>
        </div>
      </section>

      {/* Featured markets */}
      <section className="py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-medium text-fg">Featured markets</h2>
          <Link to="/markets" className="text-sm font-medium text-accent hover:underline">
            {t('markets.all')} →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((m) => (
            <MarketCard key={m.marketId} market={m} />
          ))}
        </div>
      </section>

      {/* Fee transparency teaser */}
      <section className="py-12">
        <div className="rounded-2xl border border-border bg-bg-elevated p-8 sm:p-12">
          <h2 className="font-display text-2xl font-medium text-fg">How a bet works</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Step n="1" title="Stake BNB">
              You bet on an outcome with native BNB. A 1% platform fee is taken at entry; the rest enters the market
              pool.
            </Step>
            <Step n="2" title="Pool builds">
              Every stake on every outcome forms a shared pari-mutuel pool until the market closes.
            </Step>
            <Step n="3" title="Settle & claim">
              When Flap WorldCupViewer resolves the result, winners claim a proportional share of the whole pool.
            </Step>
          </div>
          <div className="mt-8">
            <Button intent="secondary" onClick={() => navigate('/about')}>
              Read the full breakdown →
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-display text-2xl font-medium text-fg">{value}</dt>
      <dd className="font-mono text-[11px] uppercase tracking-[0.06em] text-fg-subtle">{label}</dd>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft font-display text-base font-medium text-accent">
        {n}
      </span>
      <h3 className="font-display text-lg font-medium text-fg">{title}</h3>
      <p className="text-sm leading-relaxed text-fg-muted">{children}</p>
    </div>
  );
}
