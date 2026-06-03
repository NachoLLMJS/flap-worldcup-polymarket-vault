import { MeshGradient } from '@paper-design/shaders-react';
import { cn } from '../lib/cn';

/** Animated mesh-gradient backdrop for the hero. Sits behind content,
 *  non-interactive, low opacity. Pixel count capped for perf (DPR control). */
export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] overflow-hidden', className)}
    >
      <MeshGradient
        colors={['#1a110f', '#9a2d3a', '#1a110f', '#d9b88a']}
        distortion={0.8}
        swirl={0.6}
        speed={0.3}
        maxPixelCount={1280 * 720}
        width="100%"
        height={680}
        style={{ opacity: 0.4 }}
      />
      {/* Fade the bottom into the page background for a clean seam. */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />
    </div>
  );
}
