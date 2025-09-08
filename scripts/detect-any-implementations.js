#!/usr/bin/env node

/**
 * Comprehensive "Any" Implementation Detection Script
 * Detects all forms of "any" types in the codebase with detailed analysis
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Patterns to detect different types of "any" implementations
const patterns = {
  // Basic any type annotations
  typeAnnotation: /:\s*any\b/g,

  // Array types with any
  arrayTypes: /any\[\]|Array<any>/g,

  // Promise types with any
  promiseTypes: /Promise<any>/g,

  // Record types with any
  recordTypes: /Record<string,\s*any>/g,

  // Function parameters with any
  functionParams: /\(\s*[^)]*:\s*any[^)]*\)/g,

  // Generic constraints with any
  genericConstraints: /<[^>]*\bany\b[^>]*>/g,

  // Variable declarations with any
  variableDeclarations: /(let|const|var)\s+\w+:\s*any/g,

  // Object properties with any
  objectProperties: /{\s*[^}]*:\s*any[^}]*}/g,

  // Type assertions with any
  typeAssertions: /as\s+any\b/g,

  // Interface properties with any
  interfaceProperties: /\w+:\s*any\b/g,

  // Union types with any
  unionTypes: /\|\s*any\b|\bany\s*\|/g,

  // Intersection types with any
  intersectionTypes: /&\s*any\b|\bany\s*&/g,

  // Optional properties with any
  optionalProperties: /\w+\?:\s*any\b/g,

  // Index signatures with any
  indexSignatures: /\[\w*:\s*\w+\]:\s*any/g,

  // Function return types with any
  returnTypes: /\):\s*any\b/g,

  // Class properties with any
  classProperties: /(public|private|protected)?\s*\w+:\s*any\b/g,

  // Method parameters with any
  methodParams: /\(\s*[^)]*:\s*any[^)]*\)\s*[:{]/g,

  // Import statements with any
  importAny: /import.*\bany\b/g,

  // Export statements with any
  exportAny: /export.*\bany\b/g,

  // Comments mentioning any
  commentAny: /\/\/.*\bany\b|\/\*[\s\S]*?\bany\b[\s\S]*?\*\//g,

  // String literals containing any
  stringAny: /['"`][^'"`]*\bany\b[^'"`]*['"`]/g
};

// File patterns to include/exclude
const includePatterns = [
  /\.ts$/,
  /\.tsx$/,
  /\.js$/,
  /\.jsx$/
];

const excludePatterns = [
  /node_modules/,
  /\.d\.ts$/,
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

// Criticality levels for different file types
const criticalityLevels = {
  'src/lib/': '🔴 CRITICAL',
  'src/app/api/': '🔴 CRITICAL',
  'src/services/': '🟠 HIGH',
  'src/components/': '🟠 HIGH',
  'src/hooks/': '🟠 HIGH',
  'src/features/': '🟠 HIGH',
  'src/types/': '🟡 MEDIUM',
  'src/utils/': '🟡 MEDIUM',
  'src/middleware': '🔴 CRITICAL',
  'src/auth': '🔴 CRITICAL',
  'src/security': '🔴 CRITICAL'
};

function getCriticality(filePath) {
  for (const [pattern, level] of Object.entries(criticalityLevels)) {
    if (filePath.includes(pattern)) {
      return level;
    }
  }
  return '🟢 LOW';
}

function shouldIncludeFile(filePath) {
  // Check if file matches include patterns
  const matchesInclude = includePatterns.some(pattern => pattern.test(filePath));
  if (!matchesInclude) return false;

  // Check if file matches exclude patterns
  const matchesExclude = excludePatterns.some(pattern => pattern.test(filePath));
  if (matchesExclude) return false;

  return true;
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = {
      file: filePath,
      criticality: getCriticality(filePath),
      totalAnyCount: 0,
      patterns: {},
      lines: []
    };

    // Scan for each pattern
    for (const [patternName, pattern] of Object.entries(patterns)) {
      const matches = content.match(pattern);
      if (matches) {
        results.patterns[patternName] = matches.length;
        results.totalAnyCount += matches.length;

        // Find line numbers for each match
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            results.lines.push({
              lineNumber: index + 1,
              content: line.trim(),
              pattern: patternName
            });
          }
        });
      }
    }

    return results.totalAnyCount > 0 ? results : null;
  } catch (error) {
    console.error(`${colors.red}Error reading file ${filePath}: ${error.message}${colors.reset}`);
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
        const result = scanFile(fullPath);
        if (result) {
          results.push(result);
        }
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error scanning directory ${dirPath}: ${error.message}${colors.reset}`);
  }

  return results;
}

function generateReport(results) {
  console.log(`${colors.bold}${colors.cyan}🔍 COMPREHENSIVE "ANY" IMPLEMENTATION DETECTION REPORT${colors.reset}\n`);

  // Sort results by criticality and total count
  const sortedResults = results.sort((a, b) => {
    const criticalityOrder = { '🔴 CRITICAL': 0, '🟠 HIGH': 1, '🟡 MEDIUM': 2, '🟢 LOW': 3 };
    const aOrder = criticalityOrder[a.criticality] || 4;
    const bOrder = criticalityOrder[b.criticality] || 4;

    if (aOrder !== bOrder) return aOrder - bOrder;
    return b.totalAnyCount - a.totalAnyCount;
  });

  // Summary statistics
  const totalFiles = results.length;
  const totalAnyCount = results.reduce((sum, r) => sum + r.totalAnyCount, 0);
  const criticalFiles = results.filter(r => r.criticality.includes('CRITICAL')).length;
  const highPriorityFiles = results.filter(r => r.criticality.includes('HIGH')).length;

  console.log(`${colors.bold}📊 SUMMARY STATISTICS${colors.reset}`);
  console.log(`${colors.green}Total Files with "any" types: ${totalFiles}${colors.reset}`);
  console.log(`${colors.yellow}Total "any" implementations: ${totalAnyCount}${colors.reset}`);
  console.log(`${colors.red}Critical files: ${criticalFiles}${colors.reset}`);
  console.log(`${colors.magenta}High priority files: ${highPriorityFiles}${colors.reset}\n`);

  // Pattern distribution
  const patternStats = {};
  results.forEach(result => {
    Object.entries(result.patterns).forEach(([pattern, count]) => {
      patternStats[pattern] = (patternStats[pattern] || 0) + count;
    });
  });

  console.log(`${colors.bold}📈 PATTERN DISTRIBUTION${colors.reset}`);
  const sortedPatterns = Object.entries(patternStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  sortedPatterns.forEach(([pattern, count]) => {
    console.log(`${colors.blue}${pattern}: ${count}${colors.reset}`);
  });
  console.log();

  // Critical files section
  const criticalResults = results.filter(r => r.criticality.includes('CRITICAL'));
  if (criticalResults.length > 0) {
    console.log(`${colors.bold}${colors.red}🔴 CRITICAL FILES (${criticalResults.length})${colors.reset}`);
    criticalResults.forEach(result => {
      console.log(`${colors.red}${result.file}${colors.reset} - ${result.totalAnyCount} any types`);
      result.lines.slice(0, 3).forEach(line => {
        console.log(`  ${colors.yellow}Line ${line.lineNumber}:${colors.reset} ${line.content.substring(0, 80)}...`);
      });
      if (result.lines.length > 3) {
        console.log(`  ${colors.cyan}... and ${result.lines.length - 3} more lines${colors.reset}`);
      }
      console.log();
    });
  }

  // High priority files section
  const highResults = results.filter(r => r.criticality.includes('HIGH'));
  if (highResults.length > 0) {
    console.log(`${colors.bold}${colors.magenta}🟠 HIGH PRIORITY FILES (${highResults.length})${colors.reset}`);
    highResults.slice(0, 10).forEach(result => {
      console.log(`${colors.magenta}${result.file}${colors.reset} - ${result.totalAnyCount} any types`);
    });
    if (highResults.length > 10) {
      console.log(`${colors.cyan}... and ${highResults.length - 10} more files${colors.reset}`);
    }
    console.log();
  }

  // Detailed breakdown by pattern
  console.log(`${colors.bold}🔍 DETAILED PATTERN BREAKDOWN${colors.reset}`);
  Object.entries(patternStats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([pattern, count]) => {
      console.log(`${colors.blue}${pattern}:${colors.reset} ${count} occurrences`);

      // Show examples of this pattern
      const examples = results
        .flatMap(r => r.lines.filter(l => l.pattern === pattern))
        .slice(0, 3);

      examples.forEach(example => {
        console.log(`  ${colors.yellow}${example.file}:${example.lineNumber}${colors.reset} ${example.content.substring(0, 60)}...`);
      });
      console.log();
    });

  // Recommendations
  console.log(`${colors.bold}💡 RECOMMENDATIONS${colors.reset}`);
  console.log(`${colors.green}1. Start with CRITICAL files - these affect core functionality${colors.reset}`);
  console.log(`${colors.green}2. Focus on typeAnnotation patterns first - most common issue${colors.reset}`);
  console.log(`${colors.green}3. Use Record<string, unknown> instead of Record<string, any>${colors.reset}`);
  console.log(`${colors.green}4. Create proper interfaces for complex objects${colors.reset}`);
  console.log(`${colors.green}5. Use generic constraints instead of any in generics${colors.reset}`);
  console.log(`${colors.green}6. Implement proper error handling types${colors.reset}\n`);

  // Export results to JSON
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles,
      totalAnyCount,
      criticalFiles,
      highPriorityFiles
    },
    patternStats,
    results: sortedResults
  };

  fs.writeFileSync('any-implementation-report.json', JSON.stringify(reportData, null, 2));
  console.log(`${colors.green}📄 Detailed report exported to: any-implementation-report.json${colors.reset}`);
}

function main() {
  const startTime = Date.now();

  console.log(`${colors.bold}${colors.cyan}🚀 Starting comprehensive "any" implementation detection...${colors.reset}\n`);

  // Scan the src directory
  const results = scanDirectory('./src');

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`${colors.green}✅ Scan completed in ${duration}s${colors.reset}\n`);

  if (results.length === 0) {
    console.log(`${colors.green}🎉 No "any" implementations found!${colors.reset}`);
    return;
  }

  generateReport(results);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { scanFile, scanDirectory, generateReport };
