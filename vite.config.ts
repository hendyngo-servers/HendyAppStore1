import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@packages/types': path.resolve(__dirname, './packages/types/src'),
      '@packages/feature-flags': path.resolve(__dirname, './packages/feature-flags/src'),
      '@packages/logger': path.resolve(__dirname, './packages/logger/src'),
      'node:sqlite': path.resolve(__dirname, './src/shims/sqlite-shim.ts'),
      'node:crypto': path.resolve(__dirname, './src/shims/crypto-shim.ts'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
});
