import { motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { useLoadGate } from './useLoadGate';

/** Premium arrival: dark stage with the crest energizing under a gold sweep +
 *  honest load %, exiting via an iris/portal reveal into the app. */
export function Preloader({ onDone }: { onDone: () => void }) {
  const { progress } = useLoadGate();
  const pct = Math.round(progress);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
      initial={{ opacity: 1 }}
      animate={pct >= 100 ? { clipPath: 'circle(0% at 50% 45%)' } : { clipPath: 'circle(140% at 50% 45%)' }}
      transition={{ duration: 0.9, ease: [0.83, 0, 0.17, 1] }}
      onAnimationComplete={() => {
        if (pct >= 100) onDone();
      }}
    >
      {/* Ambient gold glow */}
      <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-gold opacity-[0.14] blur-[110px]" />

      {/* Crest energizing */}
      <motion.div
        className="relative"
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <Logo size={120} className="drop-shadow-[0_10px_40px_oklch(66%_0.13_70_/_0.5)]" />
        {/* Gold sweep */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{
            WebkitMaskImage: 'url(/hero/logo-256.png)',
            maskImage: 'url(/hero/logo-256.png)',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
          }}
        >
          <motion.span
            className="absolute top-0 h-full w-1/3 -skew-x-12"
            style={{ background: 'linear-gradient(90deg, transparent, oklch(95% 0.08 95 / 0.85), transparent)' }}
            initial={{ left: '-40%' }}
            animate={{ left: ['-40%', '140%'] }}
            transition={{ duration: 1.4, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.5 }}
          />
        </motion.span>
      </motion.div>

      <motion.div
        className="mt-7 flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        <span className="font-display text-2xl font-semibold tracking-tight text-fg">
          Poly<span className="bg-gradient-to-b from-gold-bright to-gold-deep bg-clip-text text-transparent">Flap</span>
        </span>
        <span className="font-mono text-xs tabular-nums tracking-[0.2em] text-fg-subtle">{pct}%</span>
      </motion.div>
    </motion.div>
  );
}
