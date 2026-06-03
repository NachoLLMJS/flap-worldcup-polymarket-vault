import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/** Counts up from 0 to `to` once, when scrolled into view. Respects reduced
 *  motion (snaps to final). */
export function CountUp({
  to,
  decimals = 0,
  duration = 1.4,
  className,
}: {
  to: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const proxy = useRef({ v: 0 });
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(to);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          gsap.to(proxy.current, { v: to, duration, ease: 'power2.out', onUpdate: () => setN(proxy.current.v) });
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}
