#!/usr/bin/env node

/**
 * Quick "Any" Implementation Check
 * Fast detection of "any" types in production code
 */

const fs = require('fs');
const path = require('path');

// Simple patterns for quick detection
const patterns = {
  typeAnnotation: /:\s*any\b/g,
  arrayTypes: /any\[\]|Array<any>/g,
  recordTypes: /Record<string,\s*any>/g,
  promiseTypes: /Promise<any>/g,
  typeAssertions: /as\s+any\b/g
};

const excludePatterns = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /test/,
  /coverage/,
  /\.git/,
  /dist/,
  /build/,
  /\.next/,
  /archive/
];

function shouldIncludeFile(filePath) {
  if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) return false;
  if (excludePatterns.some(pattern => pattern.test(filePath))) return false;
  return true;
}

function quickScan(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = { file: filePath, count: 0, patterns: {} };

    for (const [patternName, pattern] of Object.entries(patterns)) {
      const matches = content.match(pattern);
      if (matches) {
        results.patterns[patternName] = matches.length;
        results.count += matches.length;
      }
    }

    return results.count > 0 ? results : null;
  } catch (error) {
    return null;
  }
}

function scanDirectory(dirPath) {
  const results = [];

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        results.push(...scanDirectory(fullPath));
      } else if (stat.isFile() && shouldIncludeFile(fullPath)) {
        const result = quickScan(fullPath);
        if (result) {
          results.push(result);
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return results;
}

function main() {
  console.log('🔍 Quick "Any" Implementation Check\n');

  const results = scanDirectory('./src');
  const totalCount = results.reduce((sum, r) => sum + r.count, 0);

  console.log(`📊 Found ${results.length} files with "any" types`);
  console.log(`📈 Total "any" implementations: ${totalCount}\n`);

  // Show top 10 files with most "any" types
  const topFiles = results
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  console.log('🔴 Top 10 files with most "any" types:');
  topFiles.forEach((result, index) => {
    const isCritical = result.file.includes('src/lib/') ||
                      result.file.includes('src/app/api/') ||
                      result.file.includes('src/services/');
    const icon = isCritical ? '🔴' : '🟠';
    console.log(`${index + 1}. ${icon} ${result.file} - ${result.count} any types`);
  });

  // Pattern summary
  const patternStats = {};
  results.forEach(result => {
    Object.entries(result.patterns).forEach(([pattern, count]) => {
      patternStats[pattern] = (patternStats[pattern] || 0) + count;
    });
  });

  console.log('\n📈 Pattern breakdown:');
  Object.entries(patternStats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([pattern, count]) => {
      console.log(`  ${pattern}: ${count}`);
    });

  console.log('\n💡 Run "node scripts/detect-any-implementations.js" for detailed analysis');
}

if (require.main === module) {
  main();
}

module.exports = { quickScan, scanDirectory };
