import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(() => ({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@engine': path.resolve(__dirname, 'src/engine'),
      '@map': path.resolve(__dirname, 'src/map'),
      '@scrolly': path.resolve(__dirname, 'src/scrolly'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@content': path.resolve(__dirname, 'content'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
}));
