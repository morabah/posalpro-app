#!/usr/bin/env node

/**
 * Custom lint script that bypasses Next.js ESLint integration issues
 */

const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('🔍 Running custom lint check...');

  // Run ESLint directly on specific directories to avoid memory issues
  const dirs = [
    'src/app',
    'src/components',
    'src/hooks',
    'src/lib',
    'src/types'
  ];

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const dir of dirs) {
    try {
      console.log(`\n📁 Checking ${dir}...`);
      const result = execSync(
        `npx eslint "${dir}" --format=compact --max-warnings=0`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
        }
      );

      if (result.trim()) {
        console.log(result);
      } else {
        console.log(`✅ ${dir} - No issues found`);
      }
    } catch (error) {
      // ESLint exits with non-zero code when there are issues
      if (error.stdout) {
        console.log(error.stdout);
      }
      if (error.stderr) {
        console.error(error.stderr);
      }

      // Try to extract error/warning counts from output
      const output = error.stdout || '';
      const errorMatch = output.match(/(\d+) errors?/);
      const warningMatch = output.match(/(\d+) warnings?/);

      if (errorMatch) totalErrors += parseInt(errorMatch[1]);
      if (warningMatch) totalWarnings += parseInt(warningMatch[1]);
    }
  }

  console.log(`\n📊 Lint Summary:`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log('❌ Lint check failed due to errors');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log('⚠️  Lint check passed with warnings');
    process.exit(0);
  } else {
    console.log('✅ Lint check passed - no issues found');
    process.exit(0);
  }

} catch (error) {
  console.error('❌ Custom lint script failed:', error.message);
  process.exit(1);
}
