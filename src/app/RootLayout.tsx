import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { PageTransition } from '../components/PageTransition';

/** Redesigned shell. Wrapped in `.fw-app` so design-system defaults (display
 *  font, grain) apply here without touching any legacy surface. */
export function RootLayout() {
  const location = useLocation();
  return (
    <div className="fw-app flex min-h-dvh flex-col bg-bg text-fg">
      <Navbar />
      <main className="relative z-10 flex-1">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
