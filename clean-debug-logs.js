#!/usr/bin/env node

/**
 * Clean Debug Logs Script
 * Remove all malformed debug logging statements from proposal API routes
 */

const fs = require('fs');
const path = require('path');

// File to clean
const filePath = 'src/app/api/proposals/[id]/route.ts';

console.log('🧹 Cleaning malformed debug logs from proposal API routes...\n');

// Read the file
let content = fs.readFileSync(filePath, 'utf-8');
const originalLength = content.length;

// Pattern to find malformed logInfo calls (missing opening parenthesis)
const malformedLogPattern = /logInfo\('[^']*component:\s*'[^']*',\s*([\s\S]*?)\);/g;

// Replace malformed logInfo calls with properly structured ones
content = content.replace(malformedLogPattern, (match, params) => {
  // Extract the first parameter (message)
  const messageMatch = match.match(/logInfo\('([^']*)'/);
  const message = messageMatch ? messageMatch[1].trim() : 'DEBUG';

  // Clean up the parameters
  const cleanParams = params
    .replace(/^\s*component:\s*'[^']*',\s*/, '') // Remove component
    .replace(/^\s*operation:\s*'[^']*',\s*/, '') // Remove operation
    .replace(/,\s*$/, '') // Remove trailing comma
    .trim();

  if (cleanParams) {
    return `logInfo('${message}', {\n${cleanParams}\n});`;
  } else {
    return `logInfo('${message}');`;
  }
});

// Pattern to find orphaned object properties (lines that start with property names without proper context)
const orphanedPropertyPattern = /^(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([^,\n]+),\s*$/gm;

// This is tricky to fix automatically without more context. For now, let's just remove obvious orphaned properties
content = content.replace(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*[^,\n]+,\s*$/gm, '');

// Write the cleaned file
fs.writeFileSync(filePath, content);

console.log(`✅ Cleaned ${filePath}`);
console.log(`📊 File size: ${originalLength} → ${content.length} characters`);
console.log(`📈 Reduction: ${originalLength - content.length} characters removed`);

console.log('\n🎯 Manual fixes may still be needed for complex cases.');
console.log('💡 Tip: Use structured logging with proper logInfo() calls instead of debug statements.');
