import { cn } from '../lib/cn';

/** Cinematic hero backdrop built on a generated, art-directed photo (golden
 *  trophy under stadium floodlights). Full-bleed, behind content, with a
 *  left-weighted scrim so the headline stays legible and a bottom fade into
 *  the page background. */
export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] overflow-hidden', className)}>
      <picture>
        <source media="(max-width: 768px)" srcSet="/hero/hero-768.webp" />
        <source media="(max-width: 1280px)" srcSet="/hero/hero-1280.webp" />
        <img
          src="/hero/hero-1920.webp"
          alt=""
          className="h-full w-full object-cover object-[70%_center]"
          fetchPriority="high"
        />
      </picture>

      {/* Left-weighted scrim for headline legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, oklch(14% 0.015 30 / 0.94) 0%, oklch(14% 0.015 30 / 0.78) 32%, oklch(14% 0.015 30 / 0.30) 60%, transparent 80%)',
        }}
      />
      {/* Top + bottom fade to seam into the page */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, oklch(14% 0.015 30 / 0.55) 0%, transparent 22%, transparent 62%, oklch(14% 0.015 30) 100%)',
        }}
      />
    </div>
  );
}
