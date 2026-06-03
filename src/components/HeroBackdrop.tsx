import { useEffect, useState } from 'react';
import { cn } from '../lib/cn';

/** Decide whether to play the hero video: desktop, motion allowed, not on a
 *  data-saver connection. Otherwise we show the still poster (mobile-friendly). */
function useAllowVideo(): boolean {
  const [allow, setAllow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const compute = () => setAllow(mq.matches && !reduce.matches && !saveData);
    compute();
    mq.addEventListener('change', compute);
    reduce.addEventListener('change', compute);
    return () => {
      mq.removeEventListener('change', compute);
      reduce.removeEventListener('change', compute);
    };
  }, []);
  return allow;
}

/** Cinematic hero backdrop: a generated Veo video loop on desktop, the still
 *  poster on mobile / reduced-motion / data-saver. Full-bleed, behind content,
 *  left-weighted scrim for headline legibility. */
export function HeroBackdrop({ className }: { className?: string }) {
  const allowVideo = useAllowVideo();
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] overflow-hidden', className)}>
      {allowVideo ? (
        <video
          className="h-full w-full object-cover object-[70%_center]"
          poster="/hero/hero-1920.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/hero/hero.webm" type="video/webm" />
          <source src="/hero/hero.mp4" type="video/mp4" />
        </video>
      ) : (
        <picture>
          <source media="(max-width: 768px)" srcSet="/hero/hero-768.webp" />
          <img src="/hero/hero-1280.webp" alt="" className="h-full w-full object-cover object-[70%_center]" fetchPriority="high" />
        </picture>
      )}

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
