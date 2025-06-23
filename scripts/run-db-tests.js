#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 PosalPro MVP2 Database Performance Testing');
console.log('============================================\n');

try {
  console.log('📦 Compiling TypeScript and running tests...\n');

  // Use tsx which handles TypeScript better
  execSync('npx tsx src/test/database-performance-test.ts', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' },
  });

  console.log('\n✅ Database performance tests completed successfully!');
} catch (error) {
  console.error('\n❌ Database performance tests failed:', error.message);
  process.exit(1);
}
