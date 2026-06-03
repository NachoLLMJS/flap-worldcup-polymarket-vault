import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';

/** PolyFlap wordmark. Brand name kept as the existing product name; final
 *  naming (PolyFlap vs FlapWorld) is a partner decision still to confirm. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5 group', className)} aria-label="PolyFlap home">
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-fg font-display text-lg font-semibold shadow-glow">
        P
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-fg">
        Poly<span className="text-accent">Flap</span>
      </span>
    </Link>
  );
}
