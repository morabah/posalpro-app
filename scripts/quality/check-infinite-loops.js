const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(process.cwd(), 'src');
const SEARCH_PATTERNS = ['**/*.tsx', '**/*.ts'];

// Patterns that commonly cause infinite loops
const INFINITE_LOOP_PATTERNS = [
  // useEffect with missing dependencies
  {
    pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*{[\s\S]*?}\s*,\s*\[\s*\]\s*\)/g,
    name: 'useEffect with empty dependency array but references external values',
    severity: 'warning',
  },
  // State setter in useEffect without proper dependencies
  {
    pattern: /useEffect\s*\(\s*[^,]*?set[A-Z]\w*\s*\([^)]*\)[^,]*?,\s*\[[^\]]*\]\s*\)/g,
    name: 'State setter in useEffect that might cause infinite loop',
    severity: 'error',
  },
  // useCallback/useMemo with missing dependencies
  {
    pattern: /use(Callback|Memo)\s*\([^,]*?,\s*\[\s*\]\s*\)/g,
    name: 'useCallback/useMemo with empty dependency array but might reference external values',
    severity: 'warning',
  },
  // Object/array creation in dependency array
  {
    pattern: /useEffect\s*\([^,]*?,\s*\[[^\]]*{[^}]*}[^\]]*\]\s*\)/g,
    name: 'Object literal in useEffect dependency array (causes infinite re-renders)',
    severity: 'error',
  },
  {
    pattern: /useEffect\s*\([^,]*?,\s*\[[^\]]*\[[^\]]*\][^\]]*\]\s*\)/g,
    name: 'Array literal in useEffect dependency array (causes infinite re-renders)',
    severity: 'error',
  },
  // Function calls in dependency arrays
  {
    pattern: /useEffect\s*\([^,]*?,\s*\[[^\]]*\w+\([^)]*\)[^\]]*\]\s*\)/g,
    name: 'Function call in useEffect dependency array (might cause infinite re-renders)',
    severity: 'error',
  },
];

// More sophisticated analysis patterns
const ADVANCED_PATTERNS = [
  // Check for setState in useEffect without proper conditions
  {
    checker: content => {
      const useEffectBlocks = content.match(
        /useEffect\s*\(\s*(?:async\s+)?\([^)]*\)\s*=>\s*{[\s\S]*?}\s*,\s*\[[^\]]*\]\s*\)/g
      );
      if (!useEffectBlocks) return [];

      const issues = [];
      useEffectBlocks.forEach((block, index) => {
        // Check for setState without conditions
        const hasSetState = /set[A-Z]\w*\s*\(/g.test(block);
        const hasCondition = /if\s*\(/.test(block) || /\?\s*/.test(block) || /&&/.test(block);

        if (hasSetState && !hasCondition) {
          issues.push({
            pattern: block.substring(0, 100) + '...',
            name: 'useEffect contains setState without conditional logic (potential infinite loop)',
            severity: 'error',
            line: getLineNumber(content, block),
          });
        }
      });
      return issues;
    },
  },
  // Check for event listeners that aren't cleaned up
  {
    checker: content => {
      const issues = [];
      const hasAddEventListener = /addEventListener\s*\(/g.test(content);
      const hasRemoveEventListener = /removeEventListener\s*\(/g.test(content);

      if (hasAddEventListener && !hasRemoveEventListener) {
        issues.push({
          pattern: 'addEventListener without removeEventListener',
          name: 'Event listener added but not cleaned up (memory leak)',
          severity: 'warning',
          line: getLineNumber(content, 'addEventListener'),
        });
      }
      return issues;
    },
  },
  // Check for interval/timeout without cleanup
  {
    checker: content => {
      const issues = [];
      const hasSetInterval = /setInterval\s*\(/g.test(content);
      const hasSetTimeout = /setTimeout\s*\(/g.test(content);
      const hasClearInterval = /clearInterval\s*\(/g.test(content);
      const hasClearTimeout = /clearTimeout\s*\(/g.test(content);

      if (hasSetInterval && !hasClearInterval) {
        issues.push({
          pattern: 'setInterval without clearInterval',
          name: 'setInterval used but not cleaned up (memory leak)',
          severity: 'error',
          line: getLineNumber(content, 'setInterval'),
        });
      }

      if (hasSetTimeout && !hasClearTimeout) {
        // More lenient for setTimeout as it's often fire-and-forget
        issues.push({
          pattern: 'setTimeout without clearTimeout',
          name: 'setTimeout used but not cleaned up (potential memory leak)',
          severity: 'warning',
          line: getLineNumber(content, 'setTimeout'),
        });
      }
      return issues;
    },
  },
];

function getLineNumber(content, searchText) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchText)) {
      return i + 1;
    }
  }
  return 1;
}

async function findInfiniteLoopIssues() {
  console.log('🔍 Searching for infinite loop and performance issues...');

  const files = await fg(SEARCH_PATTERNS, {
    cwd: SRC_DIR,
    ignore: ['**/*.test.*', '**/node_modules/**', '**/*.d.ts'],
  });

  const allIssues = [];

  for (const file of files) {
    const filePath = path.join(SRC_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const fileIssues = [];

    // Check basic patterns
    for (const patternObj of INFINITE_LOOP_PATTERNS) {
      const matches = content.match(patternObj.pattern);
      if (matches) {
        matches.forEach(match => {
          fileIssues.push({
            file: `src/${file}`,
            line: getLineNumber(content, match),
            pattern: match.substring(0, 100) + (match.length > 100 ? '...' : ''),
            issue: patternObj.name,
            severity: patternObj.severity,
          });
        });
      }
    }

    // Check advanced patterns
    for (const advancedPattern of ADVANCED_PATTERNS) {
      const issues = advancedPattern.checker(content);
      issues.forEach(issue => {
        fileIssues.push({
          file: `src/${file}`,
          line: issue.line,
          pattern: issue.pattern,
          issue: issue.name,
          severity: issue.severity,
        });
      });
    }

    if (fileIssues.length > 0) {
      allIssues.push(...fileIssues);
    }
  }

  return allIssues;
}

async function run() {
  try {
    const issues = await findInfiniteLoopIssues();

    if (issues.length === 0) {
      console.log('✅ Success: No infinite loop or performance issues detected.');
      process.exit(0);
    }

    console.error('❌ Found potential infinite loop and performance issues:');
    console.error('');

    // Group by severity
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');

    if (errors.length > 0) {
      console.error('🚨 ERRORS (Critical - will cause infinite loops):');
      errors.forEach(issue => {
        console.error(`  📁 ${issue.file}:${issue.line}`);
        console.error(`     ${issue.issue}`);
        console.error(`     Pattern: ${issue.pattern}`);
        console.error('');
      });
    }

    if (warnings.length > 0) {
      console.error('⚠️  WARNINGS (Potential issues):');
      warnings.forEach(issue => {
        console.error(`  📁 ${issue.file}:${issue.line}`);
        console.error(`     ${issue.issue}`);
        console.error(`     Pattern: ${issue.pattern}`);
        console.error('');
      });
    }

    console.error(
      `Total issues found: ${issues.length} (${errors.length} errors, ${warnings.length} warnings)`
    );
    process.exit(1);
  } catch (error) {
    console.error('Error checking for infinite loops:', error);
    process.exit(1);
  }
}

run();
