import { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hero3D } from '../../features/hero3d/Hero3D';
import { Flag } from '../../components/Flag';
import { MarketsTicker } from '../../features/markets/components/MarketsTicker';

const TEAMS = [29, 33, 45, 37, 9, 41];

/** "Cinema" — an immersive WebGL hero. A real gold trophy floats in a dark
 *  studio; the copy lives directly over the scene. No cards, no grid boxes. */
export function HomeCinema() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div>
      {/* Immersive hero — fixed WebGL trophy behind, content over it */}
      <Suspense fallback={null}>
        <Hero3D />
      </Suspense>
      <section className="relative -mt-16 flex min-h-[100svh] items-center overflow-hidden">
        {/* left scrim only for legibility — no card */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(90deg, oklch(8% 0.01 30 / 0.85) 0%, transparent 55%)' }}
        />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-gold">World Cup 2026 · BNB Chain</span>
            <h1 className="mt-4 font-display text-6xl font-semibold leading-[0.95] tracking-[-0.03em] text-fg sm:text-7xl md:text-8xl">
              Lift the
              <br />
              <span className="font-editorial font-light italic text-gold">trophy.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-muted">
              {t('brand.tagline')}. Stake BNB on a winner — the pool, not a bookmaker, pays the bold.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <button
                onClick={() => navigate('/markets')}
                className="rounded-full bg-gold px-7 py-3.5 font-display font-semibold text-fg-inverse shadow-glow transition-transform hover:scale-105"
              >
                Enter the markets
              </button>
              <button
                onClick={() => navigate('/about')}
                className="font-mono text-xs uppercase tracking-[0.16em] text-fg-muted hover:text-fg"
              >
                How it works →
              </button>
            </div>
            <div className="mt-10 flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {TEAMS.map((id) => (
                  <span key={id} className="rounded-full ring-2 ring-bg/40">
                    <Flag teamId={id} size="md" className="rounded-full" />
                  </span>
                ))}
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-fg-subtle">
                48 nations · one pool
              </span>
            </div>
          </div>
        </div>

        {/* scroll hint */}
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-fg-subtle">
          scroll
        </div>
      </section>

      {/* Below the fold: opaque so it covers the fixed trophy on scroll */}
      <div className="relative z-10 bg-bg">
      {/* Live ticker — a thin line, not a box */}
      <MarketsTicker />

      {/* Sparse stats line */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-border-subtle pb-8">
          {[
            ['85', 'open markets'],
            ['1%', 'platform fee'],
            ['BNB', 'native stake'],
            ['Pari-mutuel', 'proportional payout'],
          ].map(([v, l]) => (
            <div key={l} className="flex flex-col gap-1">
              <span className="font-display text-4xl font-semibold text-fg">{v}</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg-subtle">{l}</span>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl font-editorial text-2xl font-light italic leading-snug text-fg-muted">
          Every stake joins one pool. When the final whistle blows, winners split it —{' '}
          <span className="text-gold">proportionally.</span>
        </p>
      </section>
      </div>
    </div>
  );
}
