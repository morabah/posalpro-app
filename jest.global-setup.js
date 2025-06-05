/**
 * PosalPro MVP2 - Jest Global Setup
 * Runs once before all tests start
 */

module.exports = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-jest';
  process.env.DATABASE_URL = 'file:./test.db';

  // Suppress console.log in tests unless explicitly needed
  if (!process.env.JEST_VERBOSE) {
    const originalConsole = global.console;
    global.originalConsole = originalConsole;
    global.console = {
      ...originalConsole,
      log: () => {},
      debug: () => {},
      info: () => {},
      warn: originalConsole.warn,
      error: originalConsole.error,
    };
  }

  // Performance timing for test optimization
  global.testStartTime = Date.now();

  console.log('🧪 Jest Global Setup: Test environment initialized');
};
