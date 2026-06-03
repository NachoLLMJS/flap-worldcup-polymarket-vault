import { cn } from '../lib/cn';
import { flagFor } from '../features/markets/flags';

type Size = 'sm' | 'md' | 'lg';

const sizeClasses: Record<Size, string> = {
  sm: 'h-4 w-[22px] text-[11px]',
  md: 'h-5 w-7 text-xs',
  lg: 'h-7 w-10 text-sm',
};

/** Renders a real country flag (flag-icons SVG sprite) for a WorldCupViewer
 *  teamId. Falls back to a tasteful glyph for Others/Draw. Replaces the
 *  flag-emoji approach, which does not render on Windows/Chrome/Brave. */
export function Flag({ teamId, size = 'md', className }: { teamId: number; size?: Size; className?: string }) {
  const f = flagFor(teamId);
  const base = cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[3px]', sizeClasses[size], className);

  if ('special' in f) {
    return (
      <span
        className={cn(base, 'bg-bg-higher text-fg-muted')}
        aria-hidden
        title={f.special === 'draw' ? 'Draw' : 'Others'}
      >
        {f.special === 'draw' ? '⚖' : '★'}
      </span>
    );
  }

  return (
    <span
      className={cn('fi', `fi-${f.iso}`, base)}
      style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}
      role="img"
    />
  );
}
