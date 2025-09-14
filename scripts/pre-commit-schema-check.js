#!/usr/bin/env node

/**
 * Pre-commit Schema Validation Hook
 *
 * This script runs before commits to ensure schema consistency
 * and prevent deployment failures due to schema mismatches.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function checkStagedFiles() {
  try {
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return stagedFiles.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    logError('Failed to get staged files');
    return [];
  }
}

function isSchemaFile(file) {
  return file.includes('prisma/schema') || file.includes('schema.prisma');
}

function runSchemaValidation() {
  try {
    logInfo('Running schema consistency validation...');
    execSync('node scripts/validate-schema-consistency.js', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    return true;
  } catch (error) {
    logError('Schema validation failed!');
    return false;
  }
}

function runTypeCheck() {
  try {
    logInfo('Running TypeScript type check...');
    execSync('npm run type-check', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    return true;
  } catch (error) {
    logError('TypeScript type check failed!');
    return false;
  }
}

function main() {
  log('🔍 Pre-commit Schema Validation Hook', 'bold');
  log('='.repeat(50), 'blue');

  const stagedFiles = checkStagedFiles();

  if (stagedFiles.length === 0) {
    logInfo('No staged files found.');
    process.exit(0);
  }

  logInfo(`Found ${stagedFiles.length} staged files:`);
  stagedFiles.forEach(file => {
    log(`  - ${file}`);
  });

  // Check if any schema files are staged
  const schemaFiles = stagedFiles.filter(isSchemaFile);

  if (schemaFiles.length > 0) {
    logInfo(`\n📋 Schema files detected: ${schemaFiles.join(', ')}`);
    logInfo('Running comprehensive validation...');

    // Run schema consistency validation
    if (!runSchemaValidation()) {
      logError('\n🚨 COMMIT BLOCKED: Schema validation failed!');
      logError('Please fix schema inconsistencies before committing.');
      process.exit(1);
    }

    // Run TypeScript check to catch any type errors
    if (!runTypeCheck()) {
      logError('\n🚨 COMMIT BLOCKED: TypeScript validation failed!');
      logError('Please fix TypeScript errors before committing.');
      process.exit(1);
    }

    logSuccess('\n✅ Schema validation passed!');
    logSuccess('✅ TypeScript validation passed!');
    logSuccess('Commit can proceed safely.');
  } else {
    logInfo('\n📋 No schema files in this commit.');
    logInfo('Skipping schema validation.');
  }

  log('\n' + '='.repeat(50), 'blue');
  logSuccess('Pre-commit validation completed successfully!');
}

if (require.main === module) {
  main();
}

module.exports = { main };
