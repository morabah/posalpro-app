#!/usr/bin/env node

/**
 * Test runner for verification scripts
 *
 * This script runs the verification script tests and provides
 * a summary of results for CI/CD integration.
 */

/* eslint-env node */
import { spawnSync } from 'child_process';
import path from 'path';

const testFiles = [
  'tests/scripts/verify-env.test.js',
  'tests/scripts/verify-prisma-client.test.js',
];

console.log('🧪 Running verification script tests...\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let testResults = [];

for (const testFile of testFiles) {
  console.log(`📋 Running ${testFile}...`);

  const result = spawnSync('npx', ['jest', testFile, '--verbose', '--no-coverage'], {
    encoding: 'utf8',
    timeout: 30000,
  });

  const testName = path.basename(testFile, '.test.js');
  const success = result.status === 0;

  testResults.push({
    name: testName,
    success: success,
    exitCode: result.status,
    output: result.stdout + result.stderr,
  });

  if (success) {
    console.log(`   ✅ ${testName} passed`);
    passedTests++;
  } else {
    console.log(`   ❌ ${testName} failed (exit code: ${result.status})`);
    failedTests++;
    console.log(`   📝 Error output:`);
    console.log(result.stderr);
  }

  totalTests++;
  console.log('');
}

// Summary
console.log('📊 Test Summary:');
console.log(`   Total tests: ${totalTests}`);
console.log(`   Passed: ${passedTests}`);
console.log(`   Failed: ${failedTests}`);
console.log('');

if (failedTests > 0) {
  console.log('❌ Some verification script tests failed!');
  console.log('   This indicates potential issues with the verification scripts.');
  console.log('   Please review the test failures above.');
  process.exit(1);
} else {
  console.log('✅ All verification script tests passed!');
  console.log('   The verification scripts are working correctly.');
  process.exit(0);
}
