import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/app/components'),
      '@services': resolve(__dirname, './src/app/services'),
      '@utils': resolve(__dirname, './src/app/utils'),
      '@directives': resolve(__dirname, './src/app/directives'),
      '@lib': resolve(__dirname, './src/lib'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['**/*.spec.ts'],
    globals: true,
  },
});
