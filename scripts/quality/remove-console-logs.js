const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(process.cwd(), 'src');
const SEARCH_PATTERNS = ['**/*.tsx', '**/*.ts'];

// Patterns to identify and remove/replace console logs
const CONSOLE_PATTERNS = [
  // Debug/development console logs that should be removed
  {
    pattern: /console\.log\s*\(\s*['"`].*?['"`]\s*\)\s*;?/g,
    replacement: '',
    description: 'Simple string console.log statements',
  },
  {
    pattern: /console\.log\s*\(\s*['"`][^'"`]*?['"`]\s*,\s*[^)]*?\)\s*;?/g,
    replacement: '',
    description: 'Console.log with string and variables',
  },
  // Performance/analytics console logs that should be removed in production
  {
    pattern: /console\.log\s*\(\s*['"`].*?performance.*?['"`][^)]*?\)\s*;?/gi,
    replacement: '// Performance logging removed for production',
    description: 'Performance-related console logs',
  },
  {
    pattern: /console\.log\s*\(\s*['"`].*?analytics.*?['"`][^)]*?\)\s*;?/gi,
    replacement: '// Analytics logging removed for production',
    description: 'Analytics-related console logs',
  },
  // Component lifecycle logs
  {
    pattern: /console\.log\s*\(\s*['"`]\[.*?\].*?['"`][^)]*?\)\s*;?/g,
    replacement: '',
    description: 'Component lifecycle logs with [ComponentName] pattern',
  },
  // API/fetch related logs
  {
    pattern: /console\.log\s*\(\s*['"`].*?(API|api|fetch|request|response).*?['"`][^)]*?\)\s*;?/gi,
    replacement: '',
    description: 'API/fetch related console logs',
  },
];

// Keep these console statements (errors, warnings, important info)
const KEEP_PATTERNS = [
  /console\.error/,
  /console\.warn/,
  /console\.info.*error/i,
  /console\.info.*warn/i,
  /console\.debug/,
  /console\.trace/,
  /console\.table/,
  // Keep logs in test files
  /\.test\.|\.spec\./,
  // Keep logs in development utilities
  /test-infrastructure/,
  /debug/i,
];

function shouldKeepFile(filePath) {
  return KEEP_PATTERNS.some(pattern => {
    if (typeof pattern === 'string') {
      return filePath.includes(pattern);
    }
    return pattern.test(filePath);
  });
}

function shouldKeepLine(line) {
  return KEEP_PATTERNS.some(pattern => {
    if (typeof pattern === 'string') {
      return line.includes(pattern);
    }
    return pattern.test(line);
  });
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let modifiedLines = [];
  let removedCount = 0;
  let replacedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let originalLine = line;
    let lineModified = false;

    // Skip if this line should be kept
    if (shouldKeepLine(line)) {
      modifiedLines.push(line);
      continue;
    }

    // Apply console log patterns
    for (const patternObj of CONSOLE_PATTERNS) {
      const matches = line.match(patternObj.pattern);
      if (matches) {
        if (patternObj.replacement === '') {
          // Remove the line entirely if it only contains console.log
          const trimmedLine = line.trim();
          if (
            trimmedLine.match(patternObj.pattern) &&
            trimmedLine.replace(patternObj.pattern, '').trim() === ''
          ) {
            line = ''; // Remove entire line
            removedCount++;
          } else {
            // Replace just the console.log part
            line = line.replace(patternObj.pattern, patternObj.replacement);
            replacedCount++;
          }
        } else {
          line = line.replace(patternObj.pattern, patternObj.replacement);
          replacedCount++;
        }
        lineModified = true;
      }
    }

    // Only add non-empty lines or lines that weren't completely removed
    if (line.trim() !== '' || !lineModified) {
      modifiedLines.push(line);
    }
  }

  // Join lines and clean up extra blank lines
  let newContent = modifiedLines.join('\n');

  // Remove multiple consecutive blank lines
  newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');

  // Only write if content changed
  if (newContent !== content && (removedCount > 0 || replacedCount > 0)) {
    fs.writeFileSync(filePath, newContent);
    return { removedCount, replacedCount, modified: true };
  }

  return { removedCount: 0, replacedCount: 0, modified: false };
}

async function findAndRemoveConsoleLogs() {
  console.log('🔍 Searching for and removing excessive console.log statements...');

  const files = await fg(SEARCH_PATTERNS, {
    cwd: SRC_DIR,
    ignore: ['**/*.test.*', '**/node_modules/**', '**/*.d.ts'],
  });

  let totalRemoved = 0;
  let totalReplaced = 0;
  let totalFilesModified = 0;
  const modifiedFiles = [];

  for (const file of files) {
    const filePath = path.join(SRC_DIR, file);

    // Skip files that should be kept
    if (shouldKeepFile(filePath)) {
      continue;
    }

    const result = processFile(filePath);

    if (result.modified) {
      totalRemoved += result.removedCount;
      totalReplaced += result.replacedCount;
      totalFilesModified++;
      modifiedFiles.push({
        file: `src/${file}`,
        removed: result.removedCount,
        replaced: result.replacedCount,
      });
    }
  }

  return {
    totalRemoved,
    totalReplaced,
    totalFilesModified,
    modifiedFiles,
  };
}

async function run() {
  try {
    const results = await findAndRemoveConsoleLogs();

    if (results.totalFilesModified === 0) {
      console.log('✅ No excessive console.log statements found or all are already optimized.');
      process.exit(0);
    }

    console.log('✅ Console.log cleanup completed:');
    console.log('');
    console.log(`📊 Summary:`);
    console.log(`  • Files modified: ${results.totalFilesModified}`);
    console.log(`  • Console.log statements removed: ${results.totalRemoved}`);
    console.log(`  • Console.log statements replaced: ${results.totalReplaced}`);
    console.log(
      `  • Total console.log statements eliminated: ${results.totalRemoved + results.totalReplaced}`
    );
    console.log('');

    if (results.modifiedFiles.length > 0) {
      console.log('📁 Modified files:');
      results.modifiedFiles.forEach(file => {
        const total = file.removed + file.replaced;
        console.log(`  • ${file.file}: ${total} console.log statements cleaned up`);
      });
    }

    console.log('');
    console.log('ℹ️  Note: console.error, console.warn, and debug-related logs were preserved.');

    process.exit(0);
  } catch (error) {
    console.error('Error removing console logs:', error);
    process.exit(1);
  }
}

run();
