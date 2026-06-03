import { motion } from 'framer-motion';
import type { MarketFixture } from '../types';
import { MarketCard } from './MarketCard';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const } },
};

/** Animated, responsive grid of market cards with a subtle entrance stagger. */
export function MarketGrid({ markets }: { markets: MarketFixture[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {markets.map((m) => (
        <motion.div key={m.marketId} variants={item}>
          <MarketCard market={m} />
        </motion.div>
      ))}
    </motion.div>
  );
}
