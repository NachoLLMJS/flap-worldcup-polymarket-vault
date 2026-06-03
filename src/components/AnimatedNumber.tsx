import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/** Smoothly tweens a number with GSAP when `value` changes. Respects
 *  prefers-reduced-motion by snapping instantly. */
export function AnimatedNumber({
  value,
  decimals = 5,
  duration = 0.5,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const proxy = useRef({ n: value });

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(value);
      proxy.current.n = value;
      return;
    }
    const tween = gsap.to(proxy.current, {
      n: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => setDisplay(proxy.current.n),
    });
    return () => {
      tween.kill();
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {display.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}
