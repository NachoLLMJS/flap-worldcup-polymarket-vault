import { cn } from '../../lib/cn';

/** Football pitch markings as a decorative line motif (center circle, halfway
 *  line, penalty boxes). Used as section dividers / hero watermark. Inherits
 *  currentColor; set text color + opacity at the call site. */
export function FieldLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 200"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden
      className={cn('pointer-events-none', className)}
    >
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.9">
        {/* halfway line */}
        <line x1="600" y1="-40" x2="600" y2="240" />
        {/* center circle */}
        <circle cx="600" cy="100" r="64" />
        <circle cx="600" cy="100" r="2.5" fill="currentColor" stroke="none" />
        {/* left penalty box */}
        <rect x="-120" y="20" width="200" height="160" />
        <rect x="-120" y="64" width="90" height="72" />
        <path d="M80 64a44 44 0 0 1 0 72" />
        {/* right penalty box */}
        <rect x="1120" y="20" width="200" height="160" />
        <rect x="1150" y="64" width="90" height="72" />
        <path d="M1120 64a44 44 0 0 0 0 72" />
      </g>
    </svg>
  );
}
