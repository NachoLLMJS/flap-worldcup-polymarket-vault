import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const THEMES = ['pitch', 'editorial', 'electric'] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  pitch: 'Pitch',
  editorial: 'Editorial',
  electric: 'Electric',
};

const STORAGE_KEY = 'flapworld.theme';
const DEFAULT_THEME: Theme = 'pitch';

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const Ctx = createContext<ThemeCtx>({ theme: DEFAULT_THEME, setTheme: () => undefined });

export function useTheme(): ThemeCtx {
  return useContext(Ctx);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof localStorage === 'undefined') return DEFAULT_THEME;
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return saved && THEMES.includes(saved) ? saved : DEFAULT_THEME;
  });

  // Reflect the theme on <html> so it cascades to the .fw-app root.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return <Ctx.Provider value={{ theme, setTheme: setThemeState }}>{children}</Ctx.Provider>;
}
