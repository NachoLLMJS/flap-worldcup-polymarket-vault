import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import './styles.css';
import './i18n';
import { PRIVY_APP_ID } from './lib/env';
import { ConfigNeededApp, PrivyReadyApp } from './app/providers';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{PRIVY_APP_ID ? <PrivyReadyApp /> : <ConfigNeededApp />}</React.StrictMode>,
);
