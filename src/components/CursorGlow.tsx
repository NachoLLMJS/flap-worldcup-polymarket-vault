import { useEffect, useRef } from 'react';

/** Signature interaction: a soft warm glow that trails the cursor, easing
 *  toward the pointer each frame. Desktop + fine-pointer only, non-interactive,
 *  respects reduced motion. */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reduce) return;

    const el = ref.current;
    if (!el) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight * 0.3;
    let cx = tx;
    let cy = ty;
    let raf = 0;
    let running = false;
    let visible = false;

    const loop = () => {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      // Stop the loop once settled to let the page idle (cheaper, unblocks
      // screenshot idle detection).
      if (Math.abs(tx - cx) < 0.5 && Math.abs(ty - cy) < 0.5) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        el.style.opacity = '1';
      }
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[5] h-[420px] w-[420px] opacity-0 transition-opacity duration-700"
      style={{
        background: 'radial-gradient(circle, oklch(82% 0.13 85 / 0.10), oklch(58% 0.18 25 / 0.06) 35%, transparent 65%)',
        mixBlendMode: 'screen',
      }}
    />
  );
}
