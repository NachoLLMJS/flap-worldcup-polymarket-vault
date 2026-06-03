import { cn } from '../lib/cn';

/** Cinematic hero backdrop: a generated Veo video loop (golden trophy under
 *  stadium floodlights) with the still image as poster/fallback. Full-bleed,
 *  behind content, left-weighted scrim for headline legibility. */
export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] overflow-hidden', className)}>
      <video
        className="h-full w-full object-cover object-[70%_center]"
        poster="/hero/hero-1920.webp"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/hero/hero.mp4" type="video/mp4" />
      </video>

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
