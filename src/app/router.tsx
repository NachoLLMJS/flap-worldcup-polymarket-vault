import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './RootLayout';
import { HomeRouter } from '../pages/home/HomeRouter';
import { MarketsPage } from '../pages/MarketsPage';
import { MarketDetailPage } from '../pages/MarketDetailPage';
import { PortfolioPage } from '../pages/PortfolioPage';
import { AboutPage } from '../pages/AboutPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomeRouter /> },
      { path: 'markets', element: <MarketsPage /> },
      { path: 'markets/:marketId', element: <MarketDetailPage /> },
      { path: 'portfolio', element: <PortfolioPage /> },
      { path: 'about', element: <AboutPage /> },
    ],
  },
]);
