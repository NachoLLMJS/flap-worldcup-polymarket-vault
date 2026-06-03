import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Badge, Button } from '../components/ui';
import { HeroBackdrop } from '../components/HeroBackdrop';
import { Flag } from '../components/Flag';
import { MarketGrid } from '../features/markets/components/MarketGrid';
import { useMarkets } from '../features/markets/useMarkets';
import { isPrivyConfigured } from '../lib/env';

const HERO_TEAMS = [29, 33, 45, 37, 9, 41, 17, 21]; // Spain, France, England, Argentina, Brazil, Portugal, Germany, Netherlands

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const markets = useMarkets();
  const featured = markets.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Hero */}
      <section className="relative -mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6">
        <HeroBackdrop />
        <div className="flex min-h-[560px] items-center py-16 sm:min-h-[620px] lg:min-h-[640px]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex max-w-2xl flex-col items-start gap-6 text-left"
          >
            <Badge intent="accent" size="md" dot>
              {isPrivyConfigured ? 'Live on BNB Chain' : 'World Cup 2026 · BNB Chain'}
            </Badge>
            <h1 className="font-display text-5xl font-semibold leading-[1.0] tracking-[-0.03em] text-fg sm:text-6xl md:text-7xl">
              Own a piece of
              <br />
              <span className="font-editorial text-[1.06em] font-light italic bg-gradient-to-br from-gold-bright via-gold to-gold-deep bg-clip-text text-transparent">
                football history.
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
              {t('brand.tagline')}. Pick a winner, stake BNB, and settle from official Flap WorldCupViewer results —
              no bookmaker, just a transparent pari-mutuel pool.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button intent="primary" size="lg" onClick={() => navigate('/markets')}>
                {t('markets.all')}
              </Button>
              <Button intent="secondary" size="lg" onClick={() => navigate('/about')}>
                How it works
              </Button>
            </div>

            {/* Live teams ticker */}
            <div className="mt-2 flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg-subtle">Contenders</span>
              <div className="flex -space-x-2">
                {HERO_TEAMS.map((id) => (
                  <span key={id} className="rounded-full ring-2 ring-bg">
                    <Flag teamId={id} size="md" className="rounded-full" />
                  </span>
                ))}
              </div>
              <span className="font-mono text-[11px] text-fg-subtle">+40</span>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
              <Stat value={`${markets.length}`} label="markets" />
              <Stat value="1%" label="platform fee" />
              <Stat value="BNB" label="native stake" />
              <Stat value="Pari-mutuel" label="payout" />
            </dl>
          </motion.div>
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
        <MarketGrid markets={featured} />
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
