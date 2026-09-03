import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
    esbuildOptions: { target: 'esnext' },
  },
  build: {
    target: 'esnext',
    modulePreload: { polyfill: true },
  },
});

