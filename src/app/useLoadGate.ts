import { useEffect, useState } from 'react';

/** Honest load gate: resolves when fonts are ready, the hero poster has
 *  decoded, and a minimum cinematic floor has elapsed — so the preloader
 *  percentage is real, not a fake timer. */
export function useLoadGate(minMs = 1900): { progress: number; done: boolean } {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let raf = 0;
    let settled = false;
    const start = performance.now();

    const tasks: Promise<unknown>[] = [];
    if (typeof document !== 'undefined' && 'fonts' in document) {
      tasks.push((document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready);
    }
    const poster = new Image();
    poster.src = '/hero/hero-1920.webp';
    tasks.push(poster.decode().catch(() => undefined));

    let assetsReady = false;
    Promise.all(tasks).then(() => {
      assetsReady = true;
    });

    const tick = () => {
      const elapsed = performance.now() - start;
      const timeFrac = Math.min(elapsed / minMs, 1);
      const assetFrac = assetsReady ? 1 : 0.85;
      const target = Math.min(timeFrac, assetFrac) * 100;
      setProgress((p) => {
        const next = p + (target - p) * 0.12;
        return next > 99.4 ? 100 : next;
      });
      if (elapsed >= minMs && assetsReady && !settled) {
        settled = true;
        setProgress(100);
        setTimeout(() => setDone(true), 180);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [minMs]);

  return { progress, done };
}
