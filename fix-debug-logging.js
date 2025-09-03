#!/usr/bin/env node

/**
 * Fix Debug Logging Issues
 * Remove excessive DEBUG logs that are cluttering the console
 */

const fs = require('fs');
const path = require('path');

// Files with excessive debug logging
const filesToFix = [
  'src/app/api/proposals/[id]/route.ts',
  'src/app/api/proposals/route.ts',
  'src/lib/api/route.ts',
  'src/services/proposalService.ts'
];

// Patterns to remove/reduce
const debugPatterns = [
  /console\.log\('🔍 DEBUG:.*?\n/g,
  /🔍 DEBUG:.*?\n/g,
  /DEBUG:.*?\n/g,
  /console\.log\('📦 \[Auth Cache\].*?\n/g,
  /📦 \[Auth Cache\].*?\n/g
];

// Function to reduce debug logging in a file
function reduceDebugLogging(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;

  // Remove excessive debug logs
  debugPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, '');
      changes += matches.length;
    }
  });

  // Replace multiple consecutive empty lines with single line
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (changes > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${filePath}: Removed ${changes} debug logs`);
  } else {
    console.log(`ℹ️  ${filePath}: No debug logs found`);
  }
}

// Process all files
console.log('🧹 Reducing debug logging in proposal files...\n');

filesToFix.forEach(filePath => {
  reduceDebugLogging(filePath);
});

console.log('\n🎉 Debug logging cleanup complete!');
console.log('💡 Tip: Use structured logging with logDebug() instead of console.log() for important debug info');
