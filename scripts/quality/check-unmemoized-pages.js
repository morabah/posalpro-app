const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

// Regex to find components using context hooks that often trigger re-renders
const CONTEXT_HOOK_REGEX = /useSession|useProposals|useAuth/;
// Regex to check if the component is wrapped in React.memo
const MEMO_WRAPPER_REGEX = /export\s+default\s+memo\(/;

const SRC_DIR = path.join(process.cwd(), 'src');
const PAGES_DIR = path.join(SRC_DIR, 'app');

async function findUnmemoizedPages() {
  console.log('🔍 Searching for unmemoized page components that consume global context...');
  const files = await fg('**/(page|layout).tsx', {
    cwd: PAGES_DIR,
    ignore: ['**/*.test.*', '**/node_modules/**'],
  });

  const filesWithErrors = [];

  for (const file of files) {
    const filePath = path.join(PAGES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    const usesContext = CONTEXT_HOOK_REGEX.test(content);
    const isMemoized = MEMO_WRAPPER_REGEX.test(content);

    // If a page uses a global context hook but is not wrapped in memo, it's a violation.
    if (usesContext && !isMemoized) {
      filesWithErrors.push(file);
    }
  }

  return filesWithErrors;
}

async function run() {
  const filesWithErrors = await findUnmemoizedPages();

  if (filesWithErrors.length > 0) {
    console.error(
      '❌ Error: Found page components that consume global context but are not memoized.'
    );
    console.error('This can cause significant performance issues due to unnecessary re-renders.');
    console.error('Please wrap the default export of the following files in `React.memo`:');
    filesWithErrors.forEach(file => console.log(`  - src/app/${file}`));
    process.exit(1);
  } else {
    console.log('✅ Success: All pages consuming global context appear to be memoized.');
    process.exit(0);
  }
}

run();
