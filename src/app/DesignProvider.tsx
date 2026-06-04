import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const DESIGNS = ['cinema', 'classic', 'board', 'poster'] as const;
export type Design = (typeof DESIGNS)[number];

export const DESIGN_LABELS: Record<Design, string> = {
  cinema: 'Cinema 3D',
  classic: 'Classic',
  board: 'Board',
  poster: 'Poster',
};

const STORAGE_KEY = 'flapworld.design';
const DEFAULT: Design = 'cinema';

const Ctx = createContext<{ design: Design; setDesign: (d: Design) => void }>({
  design: DEFAULT,
  setDesign: () => undefined,
});

export function useDesign() {
  return useContext(Ctx);
}

export function DesignProvider({ children }: { children: ReactNode }) {
  const [design, setDesignState] = useState<Design>(() => {
    if (typeof localStorage === 'undefined') return DEFAULT;
    const saved = localStorage.getItem(STORAGE_KEY) as Design | null;
    return saved && DESIGNS.includes(saved) ? saved : DEFAULT;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, design);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute('data-design', design);
  }, [design]);

  return <Ctx.Provider value={{ design, setDesign: setDesignState }}>{children}</Ctx.Provider>;
}
