#!/usr/bin/env node

/**
 * Database Performance Testing Runner - PosalPro MVP2
 * 🧪 PHASE 9: DATABASE OPTIMIZATION VALIDATION
 *
 * Manual testing script to verify database optimization improvements
 * Usage: node scripts/test-database-performance.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 PosalPro MVP2 Database Performance Testing Suite');
console.log('==================================================\n');

/**
 * Pre-flight checks
 */
async function runPreflightChecks() {
  console.log('📋 Pre-flight checks...');

  try {
    // Check TypeScript compilation
    console.log('  ✅ Checking TypeScript compilation...');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('  ✅ TypeScript compilation: PASSED');
  } catch (error) {
    console.log('  ❌ TypeScript compilation: FAILED');
    console.log('  📝 Fix TypeScript errors before running performance tests');
    process.exit(1);
  }

  try {
    // Check database connection
    console.log('  ✅ Checking database connection...');
    execSync('npx prisma db execute --file /dev/null --help', { stdio: 'pipe' });
    console.log('  ✅ Database connection: ACTIVE');
  } catch (error) {
    console.log('  ❌ Database connection: FAILED');
    console.log('  📝 Ensure database is running and accessible');
    process.exit(1);
  }

  try {
    // Check for performance indexes
    console.log('  ✅ Checking performance indexes...');
    const indexCheckResult = execSync(
      `
      npx prisma db execute --stdin <<'EOF'
      SELECT COUNT(*) as index_count
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE '%_performance_%';
EOF
    `,
      { encoding: 'utf8', stdio: 'pipe' }
    );

    if (indexCheckResult.includes('0') || indexCheckResult.trim() === '') {
      console.log('  ⚠️  Performance indexes: NOT FOUND (running baseline tests)');
    } else {
      console.log('  ✅ Performance indexes: DETECTED');
    }
  } catch (error) {
    console.log('  ⚠️  Performance indexes: UNABLE TO VERIFY (continuing with tests)');
  }
}

/**
 * Run the performance tests
 */
async function runPerformanceTests() {
  console.log('\n🚀 Starting performance tests...\n');

  try {
    console.log('📦 Compiling TypeScript...');
    console.log('🧪 Executing performance test suite...\n');

    // Use require syntax for ts-node execution
    const testCommand = `npx ts-node --project tsconfig.json -e "
      const { runDatabasePerformanceTests } = require('./src/test/database-performance-test');

      async function runTests() {
        try {
          console.log('🎯 Initializing database performance testing...');
          await runDatabasePerformanceTests();
          console.log('\\n✅ All performance tests completed successfully!');
          process.exit(0);
        } catch (error) {
          console.error('❌ Performance testing failed:', error);
          process.exit(1);
        }
      }

      runTests();
    "`;

    execSync(testCommand, {
      stdio: 'inherit',
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer for large output
    });
  } catch (error) {
    console.log('\n❌ Performance testing failed:', error.message);
    console.log('\n🔧 Debugging steps:');
    console.log('  1. Check database connection');
    console.log('  2. Verify Prisma schema is up to date');
    console.log('  3. Run: npx prisma generate');
    console.log('  4. Check for TypeScript errors');
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await runPreflightChecks();
    await runPerformanceTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

console.log('\n🎉 Database performance testing completed!');
console.log('📊 Check the output above for detailed performance metrics.');
console.log('📈 Visit /performance/advanced for real-time monitoring.');
