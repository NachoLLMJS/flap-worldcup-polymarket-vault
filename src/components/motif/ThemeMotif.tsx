import { useTheme } from '../../app/ThemeProvider';
import { FieldLines } from './FieldLines';

/** Renders the signature graphic motif for the active theme:
 *  - pitch     → white field lines
 *  - electric  → hex ball-panel grid
 *  - editorial → nothing (identity is the light/dark contrast + type)
 *  Place inside a `relative` container; it fills and sits behind content. */
export function ThemeMotif({ variant = 'band' }: { variant?: 'band' | 'fill' }) {
  const { theme } = useTheme();

  if (theme === 'pitch') {
    return (
      <FieldLines
        className={
          variant === 'fill'
            ? 'absolute inset-0 h-full w-full text-fg opacity-[0.05]'
            : 'absolute inset-x-0 top-1/2 h-40 w-full -translate-y-1/2 text-fg opacity-[0.06]'
        }
      />
    );
  }

  if (theme === 'electric') {
    return <div aria-hidden className="fw-hex pointer-events-none absolute inset-0" />;
  }

  return null;
}
