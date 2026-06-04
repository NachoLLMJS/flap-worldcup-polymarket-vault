import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Badge, Button } from '../components/ui';
import { HeroBackdrop } from '../components/HeroBackdrop';
import { ScrollReveal } from '../components/ScrollReveal';
import { EditorialBreak } from '../components/EditorialBreak';
import { Magnetic } from '../components/Magnetic';
import { CountUp } from '../components/CountUp';
import { Flag } from '../components/Flag';
import { MarketGrid } from '../features/markets/components/MarketGrid';
import { MarketsTicker } from '../features/markets/components/MarketsTicker';
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
            <h1 className="font-impact text-6xl uppercase leading-[0.86] tracking-[-0.01em] text-fg sm:text-7xl md:text-[6.5rem]">
              Back a winner.
              <br />
              <span className="bg-gradient-to-br from-gold-bright via-gold to-gold-deep bg-clip-text text-transparent">
                Own the cup.
              </span>
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-fg-muted">
              World Cup 2026, settled on-chain. Stake BNB on an outcome — the pool pays the bold, not a bookmaker.
              <span className="text-fg"> Sell anytime before kickoff.</span>
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Magnetic>
                <Button intent="primary" size="lg" onClick={() => navigate('/markets')}>
                  {t('markets.all')}
                </Button>
              </Magnetic>
              <Magnetic>
                <Button intent="secondary" size="lg" onClick={() => navigate('/about')}>
                  How it works
                </Button>
              </Magnetic>
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
              <div className="flex flex-col gap-1">
                <dt className="font-display text-2xl font-semibold text-fg">
                  <CountUp to={markets.length} />
                </dt>
                <dd className="font-mono text-[11px] uppercase tracking-[0.06em] text-fg-subtle">markets</dd>
              </div>
              <Stat value="1%" label="platform fee" />
              <Stat value="BNB" label="native stake" />
              <Stat value="Pari-mutuel" label="payout" />
            </dl>
          </motion.div>
        </div>
      </section>

      {/* Live markets ticker */}
      <div className="-mx-4 sm:-mx-6">
        <MarketsTicker />
      </div>

      {/* Featured markets */}
      <section className="py-12">
        <ScrollReveal>
          <div className="mb-6 flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">Open now</span>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-fg sm:text-3xl">
                Featured <span className="font-editorial font-light italic text-gold">markets</span>
              </h2>
            </div>
            <Link to="/markets" className="text-sm font-medium text-accent hover:underline">
              {t('markets.all')} →
            </Link>
          </div>
        </ScrollReveal>
        <MarketGrid markets={featured} />
      </section>

      {/* Oversized editorial moment */}
      <EditorialBreak />

      {/* Fee transparency teaser */}
      <ScrollReveal className="py-12">
        <div className="surface-light relative overflow-hidden rounded-2xl border border-border bg-bg-elevated p-8 sm:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent opacity-[0.08] blur-[100px]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">No bookmaker</span>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em] text-fg sm:text-3xl">
            How a bet <span className="font-editorial font-light italic text-gold">works</span>
          </h2>
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
      </ScrollReveal>

      {/* Full-bleed inverted gold CTA — the bold "kickoff" moment */}
      <section className="relative -mx-4 mt-8 overflow-hidden bg-gold py-24 text-center sm:-mx-6 sm:py-32">
        <div className="relative mx-auto max-w-4xl px-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-inverse/70">
            {markets.length} markets are open
          </span>
          <h2 className="mt-3 font-impact text-6xl uppercase leading-[0.86] text-fg-inverse sm:text-7xl md:text-8xl">
            Kickoff is
            <br />
            coming.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base font-medium text-fg-inverse/80">
            Browse every match, group and the outright board. Find your edge before the whistle.
          </p>
          <button
            onClick={() => navigate('/markets')}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-fg-inverse px-7 py-3.5 font-display font-semibold text-gold transition-transform hover:scale-105"
          >
            Enter the markets floor →
          </button>
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
