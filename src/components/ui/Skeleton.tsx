import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Shape = 'rect' | 'line' | 'circle';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shape?: Shape;
  width?: string | number;
  height?: string | number;
}

const shapeClasses: Record<Shape, string> = {
  rect: 'rounded-md',
  line: 'rounded-sm h-3',
  circle: 'rounded-full',
};

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { shape = 'rect', width, height, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role="status"
      aria-label="loading"
      className={cn(
        'relative overflow-hidden bg-bg-higher',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent',
        shapeClasses[shape],
        className,
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...rest}
    />
  );
});

const SHIMMER_KEYFRAMES = `@keyframes shimmer { 100% { transform: translateX(100%); } }`;

if (typeof document !== 'undefined' && !document.getElementById('flapworld-skeleton-shimmer')) {
  const style = document.createElement('style');
  style.id = 'flapworld-skeleton-shimmer';
  style.textContent = SHIMMER_KEYFRAMES;
  document.head.appendChild(style);
}
