const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(process.cwd(), 'src');
const SEARCH_PATTERNS = ['**/*.tsx', '**/*.ts'];

// Memory leak patterns to detect and fix
const MEMORY_LEAK_PATTERNS = [
  {
    name: 'setTimeout without cleanup',
    pattern: /setTimeout\s*\(\s*[^,]*,\s*[^)]*\)\s*;?/g,
    severity: 'medium',
    fix: (match, content, fileContext) => {
      // Check if it's already in a useEffect with cleanup
      if (content.includes('clearTimeout') && content.includes('return () =>')) {
        return null; // Already fixed
      }

      return {
        type: 'timeout_cleanup',
        suggestion: 'Add clearTimeout in useEffect cleanup',
        replacement: addTimeoutCleanup(match, fileContext),
      };
    },
  },
  {
    name: 'setInterval without cleanup',
    pattern: /setInterval\s*\(\s*[^,]*,\s*[^)]*\)\s*;?/g,
    severity: 'high',
    fix: (match, content, fileContext) => {
      if (content.includes('clearInterval') && content.includes('return () =>')) {
        return null;
      }

      return {
        type: 'interval_cleanup',
        suggestion: 'Add clearInterval in useEffect cleanup',
        replacement: addIntervalCleanup(match, fileContext),
      };
    },
  },
  {
    name: 'addEventListener without cleanup',
    pattern: /addEventListener\s*\(\s*['"`][^'"`]+['"`]\s*,\s*[^)]*\)\s*;?/g,
    severity: 'high',
    fix: (match, content, fileContext) => {
      if (content.includes('removeEventListener') && content.includes('return () =>')) {
        return null;
      }

      return {
        type: 'event_listener_cleanup',
        suggestion: 'Add removeEventListener in useEffect cleanup',
        replacement: addEventListenerCleanup(match, fileContext),
      };
    },
  },
  {
    name: 'useEffect missing cleanup',
    pattern:
      /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?(?:setTimeout|setInterval|addEventListener)[\s\S]*?\}\s*,\s*\[[^\]]*\]\s*\)\s*;?/g,
    severity: 'high',
    fix: (match, content, fileContext) => {
      if (
        match.includes('return () =>') ||
        match.includes('clearTimeout') ||
        match.includes('clearInterval') ||
        match.includes('removeEventListener')
      ) {
        return null;
      }

      return {
        type: 'missing_cleanup',
        suggestion: 'Add cleanup function to useEffect',
        replacement: addUseEffectCleanup(match),
      };
    },
  },
  {
    name: 'ref.current access without null check',
    pattern: /\w+\.current\.[a-zA-Z]+\(/g,
    severity: 'low',
    fix: (match, content, fileContext) => {
      const refName = match.split('.')[0];
      if (content.includes(`${refName}.current &&`) || content.includes(`${refName}.current?.`)) {
        return null;
      }

      return {
        type: 'ref_null_check',
        suggestion: 'Add null check for ref.current',
        replacement: match.replace(/(\w+)\.current\./, '$1.current?.'),
      };
    },
  },
];

function addTimeoutCleanup(match, fileContext) {
  // Extract the timeout call
  const timeoutMatch = match.match(/setTimeout\s*\(\s*([^,]*),\s*([^)]*)\)/);
  if (!timeoutMatch) return match;

  const [, callback, delay] = timeoutMatch;

  return `useEffect(() => {
    const timeoutId = setTimeout(${callback}, ${delay});
    return () => clearTimeout(timeoutId);
  }, []); // Add appropriate dependencies`;
}

function addIntervalCleanup(match, fileContext) {
  const intervalMatch = match.match(/setInterval\s*\(\s*([^,]*),\s*([^)]*)\)/);
  if (!intervalMatch) return match;

  const [, callback, delay] = intervalMatch;

  return `useEffect(() => {
    const intervalId = setInterval(${callback}, ${delay});
    return () => clearInterval(intervalId);
  }, []); // Add appropriate dependencies`;
}

function addEventListenerCleanup(match, fileContext) {
  const eventMatch = match.match(/addEventListener\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^)]*)\)/);
  if (!eventMatch) return match;

  const [, eventType, handler] = eventMatch;

  return `useEffect(() => {
    const handleEvent = ${handler};
    window.addEventListener('${eventType}', handleEvent);
    return () => window.removeEventListener('${eventType}', handleEvent);
  }, []); // Add appropriate dependencies`;
}

function addUseEffectCleanup(match) {
  // Find where to insert cleanup
  const effectBody = match.match(/useEffect\s*\(\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*,/);
  if (!effectBody) return match;

  const [, body] = effectBody;
  let cleanupCode = '';

  // Detect what needs cleanup
  if (body.includes('setTimeout')) {
    cleanupCode += '\n    if (timeoutId) clearTimeout(timeoutId);';
  }
  if (body.includes('setInterval')) {
    cleanupCode += '\n    if (intervalId) clearInterval(intervalId);';
  }
  if (body.includes('addEventListener')) {
    cleanupCode += '\n    // Remove event listeners';
  }

  if (cleanupCode) {
    const cleanupFunction = `\n    return () => {${cleanupCode}\n    };`;
    return match.replace(/(\{[\s\S]*?)\}\s*,/, `$1${cleanupFunction}\n  },`);
  }

  return match;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  let fixedContent = content;
  let modificationsCount = 0;

  for (const pattern of MEMORY_LEAK_PATTERNS) {
    const matches = content.match(pattern.pattern);

    if (matches) {
      matches.forEach(match => {
        const fix = pattern.fix(match, content, { filePath });

        if (fix) {
          issues.push({
            pattern: pattern.name,
            severity: pattern.severity,
            match: match.substring(0, 100) + (match.length > 100 ? '...' : ''),
            fix: fix.suggestion,
            type: fix.type,
          });

          if (fix.replacement && fix.replacement !== match) {
            fixedContent = fixedContent.replace(match, fix.replacement);
            modificationsCount++;
          }
        }
      });
    }
  }

  // Special case: Add React imports if we added useEffect
  if (
    modificationsCount > 0 &&
    fixedContent.includes('useEffect') &&
    !content.includes('useEffect')
  ) {
    if (!fixedContent.includes('import React') && !fixedContent.includes('import { useEffect }')) {
      const firstImport = fixedContent.match(/^import.*$/m);
      if (firstImport) {
        fixedContent = fixedContent.replace(
          firstImport[0],
          `import React, { useEffect } from 'react';\n${firstImport[0]}`
        );
      } else {
        fixedContent = `import React, { useEffect } from 'react';\n\n${fixedContent}`;
      }
    }
  }

  return {
    issues,
    fixedContent,
    modified: fixedContent !== content,
    modificationsCount,
  };
}

async function detectAndFixMemoryLeaks() {
  console.log('🔍 Detecting and fixing memory leaks...');

  const files = await fg(SEARCH_PATTERNS, {
    cwd: SRC_DIR,
    ignore: ['**/*.test.*', '**/node_modules/**', '**/*.d.ts'],
  });

  let totalIssuesFound = 0;
  let totalFilesFixed = 0;
  let totalModifications = 0;
  const issuesByType = {};
  const issuesBySeverity = { high: 0, medium: 0, low: 0 };
  const fixedFiles = [];

  for (const file of files) {
    const filePath = path.join(SRC_DIR, file);
    const result = analyzeFile(filePath);

    if (result.issues.length > 0) {
      totalIssuesFound += result.issues.length;

      // Count issues by type and severity
      result.issues.forEach(issue => {
        issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
        issuesBySeverity[issue.severity]++;
      });

      if (result.modified) {
        fs.writeFileSync(filePath, result.fixedContent);
        totalFilesFixed++;
        totalModifications += result.modificationsCount;

        fixedFiles.push({
          file: `src/${file}`,
          issues: result.issues,
          modifications: result.modificationsCount,
        });
      }
    }
  }

  return {
    totalIssuesFound,
    totalFilesFixed,
    totalModifications,
    issuesByType,
    issuesBySeverity,
    fixedFiles,
  };
}

async function run() {
  try {
    const results = await detectAndFixMemoryLeaks();

    if (results.totalIssuesFound === 0) {
      console.log('✅ No memory leaks detected or all are already fixed.');
      process.exit(0);
    }

    console.log('✅ Memory leak detection and fixes completed:');
    console.log('');
    console.log(`📊 Summary:`);
    console.log(`  • Issues found: ${results.totalIssuesFound}`);
    console.log(`  • Files fixed: ${results.totalFilesFixed}`);
    console.log(`  • Total modifications: ${results.totalModifications}`);
    console.log('');

    console.log('⚠️  Issues by severity:');
    Object.entries(results.issuesBySeverity).forEach(([severity, count]) => {
      if (count > 0) {
        const emoji = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
        console.log(`  ${emoji} ${severity}: ${count} issues`);
      }
    });
    console.log('');

    if (Object.keys(results.issuesByType).length > 0) {
      console.log('🔧 Issues by type:');
      Object.entries(results.issuesByType).forEach(([type, count]) => {
        console.log(`  • ${type.replace(/_/g, ' ')}: ${count} issues`);
      });
      console.log('');
    }

    if (results.fixedFiles.length > 0 && results.fixedFiles.length <= 15) {
      console.log('📁 Fixed files:');
      results.fixedFiles.forEach(file => {
        console.log(
          `  • ${file.file}: ${file.issues.length} issues, ${file.modifications} fixes applied`
        );
      });
    } else if (results.fixedFiles.length > 15) {
      console.log(`📁 Fixed ${results.fixedFiles.length} files (showing first 10):`);
      results.fixedFiles.slice(0, 10).forEach(file => {
        console.log(
          `  • ${file.file}: ${file.issues.length} issues, ${file.modifications} fixes applied`
        );
      });
      console.log(`  ... and ${results.fixedFiles.length - 10} more files`);
    }

    console.log('');
    console.log(
      'ℹ️  Note: Please review the fixes and add appropriate dependencies to useEffect hooks.'
    );
    console.log('ℹ️  Some manual adjustments may be needed for complex cases.');

    process.exit(0);
  } catch (error) {
    console.error('Error fixing memory leaks:', error);
    process.exit(1);
  }
}

run();
