import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flag } from '../../components/Flag';
import { useMarkets } from '../../features/markets/useMarkets';

/** "Editorial Poster" — a sports-magazine cover. Oversized asymmetric Fraunces
 *  headline that overlaps the trophy image, numbered sections, sticker country
 *  badges, generous negative space and print rules. Structurally unlike the
 *  centered landing or the board. */
export function HomePoster() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const zh = i18n.resolvedLanguage?.startsWith('zh');
  const markets = useMarkets();
  const teams = [29, 33, 45, 37, 9, 41, 17, 21, 25, 1]; // marquee teams

  return (
    <div className="mx-auto max-w-[1300px] px-4 sm:px-8">
      {/* Masthead rule */}
      <div className="flex items-center justify-between border-b-2 border-fg py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-fg">
        <span>The Cup · Issue 2026</span>
        <span className="hidden sm:block">Prediction Markets</span>
        <span>BNB Chain</span>
      </div>

      {/* Cover */}
      <section className="relative grid grid-cols-1 items-center gap-6 py-10 md:grid-cols-12 md:py-16">
        {/* Big headline column */}
        <div className="relative z-10 md:col-span-7">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">No. 01 — The Outright</span>
          <h1 className="mt-3 font-editorial text-[15vw] font-light italic leading-[0.86] tracking-[-0.02em] text-fg sm:text-[12vw] md:text-[9rem]">
            Own
            <br />
            the
            <br />
            <span className="text-accent">Cup.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-muted">
            {t('brand.tagline')}. Stake BNB on a winner; the pool — not a bookmaker — decides the payout.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/markets')}
              className="group inline-flex items-center gap-3 border-b-2 border-fg pb-1 font-display text-lg font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
            >
              Browse markets
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
            <Link to="/about" className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle hover:text-fg">
              How it works
            </Link>
          </div>
        </div>

        {/* Trophy image — overlaps the headline */}
        <div className="relative md:col-span-5">
          <div className="relative overflow-hidden rounded-[2px] border border-border">
            <img src="/hero/hero-768.webp" alt="" className="aspect-[3/4] w-full object-cover object-[60%_center]" />
            <span className="absolute left-3 top-3 rotate-[-4deg] rounded-sm bg-accent px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-accent-fg shadow-lg">
              Live · 85 markets
            </span>
          </div>
          <p className="mt-2 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-fg-subtle">
            Fig. 1 — The trophy, on-chain
          </p>
        </div>
      </section>

      {/* Sticker team badges marquee */}
      <section className="border-y-2 border-fg py-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-fg-subtle">Contenders —</span>
          {teams.map((id, i) => (
            <button
              key={id}
              onClick={() => navigate('/markets')}
              style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (2 + (i % 3))}deg)` }}
              className="inline-flex items-center gap-2 rounded-full border-2 border-fg bg-bg px-3 py-1.5 text-sm font-medium text-fg transition-transform hover:scale-105"
            >
              <Flag teamId={id} size="sm" />
            </button>
          ))}
          <span className="font-mono text-xs text-fg-subtle">+39 more</span>
        </div>
      </section>

      {/* Numbered editorial sections */}
      <section className="grid grid-cols-1 gap-px overflow-hidden border border-fg bg-fg md:grid-cols-3">
        {[
          ['02', 'Stake', 'Bet on an outcome with native BNB. A 1% fee is taken at entry; the rest joins the pool.'],
          ['03', 'Pool', 'Every stake on every outcome forms one shared pari-mutuel pool until the market closes.'],
          ['04', 'Claim', 'When Flap WorldCupViewer resolves the result, winners split the whole pool, proportionally.'],
        ].map(([n, title, body]) => (
          <div key={n} className="flex flex-col gap-3 bg-bg p-6 sm:p-8">
            <span className="font-display text-5xl font-light italic text-accent">{n}</span>
            <h3 className="font-display text-xl font-semibold text-fg">{title}</h3>
            <p className="text-sm leading-relaxed text-fg-muted">{body}</p>
          </div>
        ))}
      </section>

      {/* Big pull quote */}
      <section className="py-16 text-center sm:py-24">
        <p className="mx-auto max-w-3xl font-editorial text-3xl font-light italic leading-[1.2] text-fg sm:text-5xl">
          “One winner. <span className="text-accent">48 nations.</span> A single pool that pays the bold.”
        </p>
        <button
          onClick={() => navigate('/markets')}
          className="mt-8 inline-flex items-center gap-3 rounded-full bg-accent px-6 py-3 font-display font-semibold text-accent-fg transition-transform hover:scale-105"
        >
          Enter the markets →
        </button>
      </section>
    </div>
  );
}
