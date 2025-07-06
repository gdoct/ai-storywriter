/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test configuration
    environment: 'node',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    testTimeout: 30000,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
