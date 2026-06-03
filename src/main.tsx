import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import './i18n';
import { App } from './app/providers';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
