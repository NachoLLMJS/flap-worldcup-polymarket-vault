import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Atmosphere } from '../components/Atmosphere';
import { CursorGlow } from '../components/CursorGlow';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { PageTransition } from '../components/PageTransition';

/** Redesigned shell. Wrapped in `.fw-app` so design-system defaults (display
 *  font, grain) apply here without touching any legacy surface. The global
 *  Atmosphere sits behind all content (z-0); content rides above at z-10. */
export function RootLayout() {
  const location = useLocation();
  return (
    <div className="fw-app relative flex min-h-dvh flex-col bg-bg text-fg">
      <Atmosphere />
      <CursorGlow />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
        <Footer />
      </div>
      <ThemeSwitcher />
      <ScrollRestoration />
    </div>
  );
}
