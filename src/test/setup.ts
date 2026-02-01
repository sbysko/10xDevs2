/**
 * Vitest Setup File
 *
 * This file runs before all tests to:
 * - Configure jsdom environment
 * - Add custom matchers from @testing-library/jest-dom
 * - Set up global mocks for browser APIs
 * - Configure test utilities
 */

import { expect, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// ===================================================================
// EXTEND VITEST MATCHERS
// ===================================================================

// Add custom matchers from @testing-library/jest-dom
// Examples: toBeInTheDocument(), toHaveClass(), toBeVisible()
expect.extend(matchers);

// ===================================================================
// CLEANUP AFTER EACH TEST
// ===================================================================

// Automatically unmount React components after each test
// Note: Using testing-library's auto-cleanup instead of manual afterEach
// This is configured via test environment

// ===================================================================
// GLOBAL MOCKS
// ===================================================================

// Mock window.location for navigation tests
delete (window as Partial<Window>).location;
window.location = {
  href: "http://localhost:3000",
  origin: "http://localhost:3000",
  protocol: "http:",
  host: "localhost:3000",
  hostname: "localhost",
  port: "3000",
  pathname: "/",
  search: "",
  hash: "",
  assign: vi.fn(),
  reload: vi.fn(),
  replace: vi.fn(),
  toString: vi.fn(() => "http://localhost:3000"),
  ancestorOrigins: {} as DOMStringList,
};

// Mock console methods to reduce noise in test output
// You can remove these if you want to see console output during tests
global.console = {
  ...console,
  log: vi.fn(), // Silence console.log
  debug: vi.fn(), // Silence console.debug
  info: vi.fn(), // Silence console.info
  warn: vi.fn(), // Keep warnings for debugging
  error: vi.fn(), // Keep errors for debugging
};

// ===================================================================
// TYPE AUGMENTATION
// ===================================================================

// Augment Vitest's expect with jest-dom matchers
declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends jest.Matchers<void, T> {
    toBeInTheDocument(): T;
    toHaveClass(className: string): T;
    toBeVisible(): T;
    toHaveTextContent(text: string | RegExp): T;
    toBeDisabled(): T;
    toBeEnabled(): T;
    toHaveValue(value: string | number | string[]): T;
    toHaveAttribute(attr: string, value?: string): T;
  }
}
