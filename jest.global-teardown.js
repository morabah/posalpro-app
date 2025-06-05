/**
 * PosalPro MVP2 - Jest Global Teardown
 * Runs once after all tests complete
 */

module.exports = async () => {
  // Cleanup test database if it exists
  const fs = require('fs');
  const path = require('path');

  const testDbPath = path.join(process.cwd(), 'test.db');
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch (error) {
      console.warn('⚠️ Could not clean up test database:', error.message);
    }
  }

  // Report test performance
  if (global.testStartTime) {
    const duration = Date.now() - global.testStartTime;
    console.log(`🏁 Jest Global Teardown: Tests completed in ${duration}ms`);
  }

  // Restore console if it was mocked
  if (global.originalConsole) {
    global.console = global.originalConsole;
  }

  console.log('🧹 Jest Global Teardown: Cleanup completed');
};
