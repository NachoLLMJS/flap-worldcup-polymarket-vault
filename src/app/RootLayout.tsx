import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

/** Redesigned shell. Wrapped in `.fw-app` so design-system defaults (display
 *  font, grain) apply here without touching any legacy surface. */
export function RootLayout() {
  return (
    <div className="fw-app flex min-h-dvh flex-col bg-bg text-fg">
      <Navbar />
      <main className="relative z-10 flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
