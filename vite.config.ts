import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

const reactAriaExportPath = new URL('./node_modules/react-aria/dist/exports/$1.js', import.meta.url).pathname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^react-aria\/(.+)$/,
        replacement: reactAriaExportPath,
      },
    ],
  },
});
