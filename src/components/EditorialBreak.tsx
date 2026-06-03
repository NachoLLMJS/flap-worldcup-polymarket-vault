import { ScrollReveal } from './ScrollReveal';
import { ThemeMotif } from './motif/ThemeMotif';

/** Oversized editorial moment that breaks the card-grid rhythm — a quiet, big
 *  statement in Fraunces italic with a faint giant year + theme motif behind. */
export function EditorialBreak() {
  return (
    <section className="relative -mx-4 my-8 overflow-hidden border-y border-border-subtle py-24 sm:-mx-6 sm:py-32">
      {/* Signature motif per theme (pitch lines / hex grid) */}
      <ThemeMotif variant="fill" />
      {/* Faint oversized year */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[34vw] font-bold leading-none text-fg opacity-[0.03] sm:text-[26vw]"
      >
        2026
      </span>
      {/* Warm glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold opacity-[0.06] blur-[120px]" />

      <ScrollReveal className="relative mx-auto max-w-4xl px-6 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">The pari-mutuel promise</span>
        <p className="mt-5 font-editorial text-4xl font-light italic leading-[1.15] text-fg sm:text-5xl md:text-6xl">
          Every stake joins <span className="text-gold">one pool.</span> When the final whistle blows, winners split it —{' '}
          <span className="text-gold">proportionally.</span>
        </p>
      </ScrollReveal>
    </section>
  );
}
