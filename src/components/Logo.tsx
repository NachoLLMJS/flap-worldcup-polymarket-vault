import { cn } from '../lib/cn';

/** FlapWorld brand mark: a stylised World Cup trophy in brushed gold inside a
 *  dark roundel. Pure SVG (crisp at any size, zero binary weight). Generic cup
 *  silhouette — not the trademarked FIFA trophy. */
export function Logo({
  size = 40,
  variant = 'badge',
  className,
}: {
  size?: number;
  variant?: 'badge' | 'bare';
  className?: string;
}) {
  const id = 'fw-logo';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={cn('shrink-0', className)}
      role="img"
      aria-label="FlapWorld"
    >
      <defs>
        <linearGradient id={`${id}-gold`} x1="14" y1="6" x2="34" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="oklch(92% 0.10 95)" />
          <stop offset="0.45" stopColor="oklch(82% 0.13 85)" />
          <stop offset="0.7" stopColor="oklch(66% 0.13 70)" />
          <stop offset="1" stopColor="oklch(78% 0.13 82)" />
        </linearGradient>
        <radialGradient id={`${id}-bg`} cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor="oklch(26% 0.04 30)" />
          <stop offset="1" stopColor="oklch(15% 0.02 30)" />
        </radialGradient>
        <linearGradient id={`${id}-shine`} x1="18" y1="12" x2="26" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Roundel (badge variant only) */}
      {variant === 'badge' && (
        <rect x="0.5" y="0.5" width="47" height="47" rx="13" fill={`url(#${id}-bg)`} stroke="oklch(40% 0.05 70)" strokeOpacity="0.5" />
      )}

      {/* Trophy */}
      <g>
        {/* Handles */}
        <path
          d="M16 13c-4 0-6 3-6 6s2.5 5 6 5"
          stroke={`url(#${id}-gold)`}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M32 13c4 0 6 3 6 6s-2.5 5-6 5"
          stroke={`url(#${id}-gold)`}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Cup bowl */}
        <path
          d="M15 11h18v6c0 6-3.8 10-9 10s-9-4-9-10v-6Z"
          fill={`url(#${id}-gold)`}
        />
        {/* Stem + base */}
        <rect x="22.4" y="27" width="3.2" height="5" fill={`url(#${id}-gold)`} />
        <path d="M17 36c0-2.2 2.2-3.4 7-3.4s7 1.2 7 3.4v1.5H17V36Z" fill={`url(#${id}-gold)`} />
        <rect x="15" y="37.5" width="18" height="2.6" rx="1" fill="oklch(66% 0.13 70)" />
        {/* Shine */}
        <path d="M19 12.5c0 5 .8 9 3 11-3.2-1-5-5-5-9.5l2-1.5Z" fill={`url(#${id}-shine)`} />
        {/* Star emboss */}
        <path
          d="M24 14.2l1.1 2.3 2.5.3-1.9 1.7.5 2.5L24 21.8l-2.2 1.2.5-2.5-1.9-1.7 2.5-.3L24 14.2Z"
          fill="oklch(60% 0.12 68)"
          fillOpacity="0.55"
        />
      </g>
    </svg>
  );
}
