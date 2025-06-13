/**
 * Global test type definitions
 *
 * This file provides global TypeScript declarations for test-related functions
 * and objects to ensure proper type checking in test files.
 */

import { Mock } from 'jest';

declare global {
  namespace NodeJS {
    interface Global {
      mockTrackAnalytics: Mock;
      fetch: jest.Mock;
    }
  }
}

// Extend the Jest matcher types with our custom matchers
declare namespace jest {
  interface Matchers<R> {
    toBeValidDate(): R;
    // Add other custom matchers here
  }
}

// Declare global jest functions to prevent TypeScript errors
declare const jest: any;
declare const describe: (description: string, testsFunction: () => void) => void;
declare const it: (description: string, testFunction: () => void | Promise<void>) => void;
declare const test: (description: string, testFunction: () => void | Promise<void>) => void;
declare const expect: any;
declare const beforeAll: (fn: () => void | Promise<void>) => void;
declare const afterAll: (fn: () => void | Promise<void>) => void;
declare const beforeEach: (fn: () => void | Promise<void>) => void;
declare const afterEach: (fn: () => void | Promise<void>) => void;

export {};
