import { useDesign } from '../../app/DesignProvider';
import { HomePage } from '../HomePage';
import { HomeBoard } from './HomeBoard';
import { HomePoster } from './HomePoster';

/** Renders the home in the selected design language (a real layout swap, not a
 *  recolor). Compared live via the Design switcher. */
export function HomeRouter() {
  const { design } = useDesign();
  if (design === 'board') return <HomeBoard />;
  if (design === 'poster') return <HomePoster />;
  return <HomePage />;
}
