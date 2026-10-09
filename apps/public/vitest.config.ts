import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@ecom/ui': resolve(__dirname, '../../packages/ui/src'),
      '@ecom/types': resolve(__dirname, '../../packages/types/src'),
      '@ecom/api-client': resolve(__dirname, '../../packages/api-client/src'),
    },
  },
});
