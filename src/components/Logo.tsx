import { cn } from '../lib/cn';

/** FlapWorld brand mark — a premium football crest (generated, cut out to a
 *  transparent PNG). Crisp, centered, on-brand gold + burgundy. */
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/hero/logo-256.png"
      width={size}
      height={size}
      alt="FlapWorld"
      draggable={false}
      className={cn('shrink-0 select-none', className)}
    />
  );
}
