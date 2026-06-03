import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const reactAriaExportPath = new URL('./node_modules/react-aria/dist/exports/$1.js', import.meta.url).pathname;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^react-aria\/(.+)$/,
        replacement: reactAriaExportPath,
      },
    ],
  },
});
