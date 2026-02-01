import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for React components and hooks testing
    environment: 'jsdom',

    // Pool configuration for Vitest 4 (new format)
    pool: 'forks',
    poolMatchGlobs: [
      ['**/*.test.ts', 'forks'],
      ['**/*.test.tsx', 'forks'],
    ],

    // Forks pool options (Vitest 4 format)
    singleFork: true,

    // Enable global test APIs (describe, it, expect, etc.)
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.config.*',
        '**/types.ts',
        '**/database.types.ts',
      ],
      // Recommended thresholds for critical code
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },

    // Test file patterns
    include: ['**/*.test.ts', '**/*.test.tsx'],

    // Timeout for async tests
    testTimeout: 10000,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
