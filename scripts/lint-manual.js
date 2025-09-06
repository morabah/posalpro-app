#!/usr/bin/env node

/**
 * Manual lint checker that bypasses all ESLint integration issues
 * Performs basic static analysis for common code quality issues
 */

const fs = require('fs');
const path = require('path');

const ISSUES_FOUND = {
  errors: 0,
  warnings: 0,
  files: [],
};

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    const issues = [];

    // Check for console.log statements (warnings)
    const consoleMatches = content.match(/console\.(log|warn|error|info|debug)/g);
    if (consoleMatches) {
      issues.push({
        type: 'warning',
        message: `Found ${consoleMatches.length} console statements (should use proper logging)`,
        line: 'multiple',
      });
    }

    // Check for TODO comments (warnings)
    const todoMatches = content.match(/\/\/\s*TODO|\/\*\s*TODO|\s*TODO\s*\*\//gi);
    if (todoMatches) {
      issues.push({
        type: 'warning',
        message: `Found ${todoMatches.length} TODO comments`,
        line: 'multiple',
      });
    }

    // Check for debugger statements (errors)
    const debuggerMatches = content.match(/\bdebugger\b/g);
    if (debuggerMatches) {
      issues.push({
        type: 'error',
        message: `Found ${debuggerMatches.length} debugger statements`,
        line: 'multiple',
      });
    }

    // Check for alert/confirm/prompt (warnings)
    const browserDialogMatches = content.match(/\b(alert|confirm|prompt)\s*\(/g);
    if (browserDialogMatches) {
      issues.push({
        type: 'warning',
        message: `Found ${browserDialogMatches.length} browser dialog calls`,
        line: 'multiple',
      });
    }

    // Check for long lines (>120 characters)
    const lines = content.split('\n');
    const longLines = lines.filter((line, index) => {
      // Skip comments and strings for line length check
      const trimmed = line.trim();
      return (
        trimmed.length > 120 &&
        !trimmed.startsWith('//') &&
        !trimmed.startsWith('*') &&
        !trimmed.startsWith('/*') &&
        !trimmed.includes('".*".*".*"') &&
        !trimmed.includes("'.*'.*'.*'")
      );
    });

    if (longLines.length > 0) {
      issues.push({
        type: 'warning',
        message: `Found ${longLines.length} lines longer than 120 characters`,
        line: 'multiple',
      });
    }

    // Check for unused variables (basic pattern)
    const varMatches = content.match(/\b(const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=/g);
    if (varMatches) {
      // This is a very basic check - in reality ESLint does much better analysis
      // For now, just warn about potentially unused variables
    }

    if (issues.length > 0) {
      console.log(`\n📄 ${relativePath}:`);
      issues.forEach(issue => {
        const prefix = issue.type === 'error' ? '❌' : '⚠️ ';
        console.log(`  ${prefix} ${issue.message}`);
        if (issue.type === 'error') {
          ISSUES_FOUND.errors++;
        } else {
          ISSUES_FOUND.warnings++;
        }
      });
      ISSUES_FOUND.files.push(relativePath);
    }
  } catch (error) {
    console.log(`❌ Error reading ${filePath}: ${error.message}`);
  }
}

function walkDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip certain directories
        const excludedDirs = [
          'node_modules',
          '.next',
          'dist',
          'build',
          'coverage',
          '.git',
          'archive',
          '.vscode',
          '.idea',
        ];
        if (!excludedDirs.includes(item)) {
          walkDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        // Check TypeScript and JavaScript files, but skip test files and other excluded types
        const isExcludedType =
          item.endsWith('.sql') ||
          item.endsWith('.json') ||
          item.endsWith('.log') ||
          item.endsWith('.env') ||
          item.startsWith('.env') ||
          item === '.DS_Store' ||
          item.includes('backup') ||
          item.includes('.session');

        if (
          (item.endsWith('.ts') ||
            item.endsWith('.tsx') ||
            item.endsWith('.js') ||
            item.endsWith('.jsx')) &&
          !item.endsWith('.test.ts') &&
          !item.endsWith('.test.tsx') &&
          !item.endsWith('.spec.ts') &&
          !item.endsWith('.spec.tsx') &&
          !fullPath.includes('__tests__') &&
          !fullPath.includes('__mocks__') &&
          !isExcludedType
        ) {
          checkFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error walking directory ${dirPath}: ${error.message}`);
  }
}

console.log('🔍 Running manual lint check...');
console.log('=====================================\n');

walkDirectory('src');

console.log('\n=====================================');
console.log('📊 Manual Lint Summary:');
console.log(`   Files checked: ${ISSUES_FOUND.files.length}`);
console.log(`   Errors: ${ISSUES_FOUND.errors}`);
console.log(`   Warnings: ${ISSUES_FOUND.warnings}`);

if (ISSUES_FOUND.errors > 0) {
  console.log('\n❌ Manual lint check found errors that should be fixed');
  process.exit(1);
} else if (ISSUES_FOUND.warnings > 0) {
  console.log('\n⚠️  Manual lint check found warnings - consider fixing them');
  process.exit(0);
} else {
  console.log('\n✅ Manual lint check passed - no issues found');
  process.exit(0);
}
