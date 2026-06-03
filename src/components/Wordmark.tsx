import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';
import { Logo } from './Logo';

/** PolyFlap wordmark with the real trophy logo. Final naming (PolyFlap vs
 *  FlapWorld) is a partner decision still to confirm. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5 group', className)} aria-label="PolyFlap home">
      <Logo size={38} className="transition-transform duration-300 ease-out-quint group-hover:scale-105" />
      <span className="font-display text-xl font-semibold tracking-tight text-fg">
        Poly<span className="bg-gradient-to-b from-gold-bright to-gold-deep bg-clip-text text-transparent">Flap</span>
      </span>
    </Link>
  );
}
