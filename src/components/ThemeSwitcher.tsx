import { useTheme, THEMES, THEME_LABELS, type Theme } from '../app/ThemeProvider';
import { cn } from '../lib/cn';

const swatch: Record<Theme, string> = {
  pitch: 'oklch(64% 0.16 150)',
  editorial: 'oklch(94% 0.014 85)',
  electric: 'oklch(86% 0.19 120)',
};

/** Floating control to compare the 3 visual identities live. Temporary
 *  decision tool — remove (or hide) once a theme is chosen. */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 sm:bottom-5">
      <div className="flex items-center gap-1 rounded-full border border-border bg-bg-overlay p-1 shadow-xl backdrop-blur-xl">
        <span className="px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-subtle">Theme</span>
        {THEMES.map((tName) => {
          const active = theme === tName;
          return (
            <button
              key={tName}
              type="button"
              onClick={() => setTheme(tName)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200',
                active ? 'bg-fg text-fg-inverse' : 'text-fg-muted hover:text-fg',
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/20" style={{ background: swatch[tName] }} />
              {THEME_LABELS[tName]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
