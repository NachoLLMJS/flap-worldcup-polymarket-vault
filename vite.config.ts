import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const reactAriaExportPath = new URL('./node_modules/react-aria/dist/exports/$1.js', import.meta.url).pathname;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Ensure a single React instance across the app and pre-bundled deps
    // (framer-motion otherwise resolved its own copy → "Invalid hook call").
    dedupe: ['react', 'react-dom'],
    alias: [
      {
        find: /^react-aria\/(.+)$/,
        replacement: reactAriaExportPath,
      },
    ],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'gsap'],
  },
});
