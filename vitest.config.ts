import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for React components and hooks testing
    environment: "jsdom",

    // Setup file
    setupFiles: ["./vitest.setup.ts"],

    // Enable global test APIs (describe, it, expect, etc.)
    globals: true,

    // Use vmThreads pool (better compatibility with jsdom on Windows)
    pool: "vmThreads",

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.config.*",
        "**/types.ts",
        "**/database.types.ts",
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
    include: ["**/*.test.ts", "**/*.test.tsx"],

    // Timeout for async tests
    testTimeout: 10000,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
