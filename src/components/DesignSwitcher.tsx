import { useNavigate } from 'react-router-dom';
import { useDesign, DESIGNS, DESIGN_LABELS, type Design } from '../app/DesignProvider';
import { cn } from '../lib/cn';

/** Floating control to compare genuinely different home LAYOUTS (not colors).
 *  Sits above the Theme switcher. Decision tool — remove once chosen. */
export function DesignSwitcher() {
  const { design, setDesign } = useDesign();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-16 left-1/2 z-50 -translate-x-1/2 sm:bottom-[4.25rem]">
      <div className="flex items-center gap-1 rounded-full border border-border bg-bg-overlay p-1 shadow-xl backdrop-blur-xl">
        <span className="px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-subtle">Layout</span>
        {DESIGNS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setDesign(d);
              navigate('/');
            }}
            aria-pressed={design === d}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200',
              design === d ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg',
            )}
          >
            {DESIGN_LABELS[d as Design]}
          </button>
        ))}
      </div>
    </div>
  );
}
