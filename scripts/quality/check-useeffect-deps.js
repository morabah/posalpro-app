const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

// This regex is designed to find useEffect hooks that are missing their second argument (the dependency array).
// It looks for `useEffect(...)` that is NOT followed by a comma and a second argument within the parentheses.
// It specifically targets patterns like `useEffect(() => { ... });`
const USE_EFFECT_NO_DEPS_REGEX = /useEffect\(\s*\(\s*\)\s*=>\s*{[^}]*}(?!\s*,\s*\[)/;

const SRC_DIR = path.join(process.cwd(), 'src');
const PAGES_DIR = path.join(SRC_DIR, 'app');

async function findUseEffectErrors() {
  console.log(
    '🔍 Searching for useEffect hooks with missing dependency arrays in page components...'
  );
  // We only scan page.tsx files as this is where the issue is most critical.
  const files = await fg('**/page.tsx', {
    cwd: PAGES_DIR,
    ignore: ['**/*.test.*', '**/node_modules/**'],
  });

  const filesWithErrors = [];

  for (const file of files) {
    const filePath = path.join(PAGES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    if (USE_EFFECT_NO_DEPS_REGEX.test(content)) {
      filesWithErrors.push(file);
    }
  }

  return filesWithErrors;
}

async function run() {
  const filesWithErrors = await findUseEffectErrors();

  if (filesWithErrors.length > 0) {
    console.error(
      '❌ Error: Found page components with useEffect hooks missing a dependency array.'
    );
    console.error(
      'This is a critical performance issue that causes re-renders and duplicate events.'
    );
    console.error(
      'Please add an empty dependency array `[]` to the useEffect hooks in the following files:'
    );
    filesWithErrors.forEach(file => console.log(`  - src/app/${file}`));
    process.exit(1);
  } else {
    console.log('✅ Success: No page components with missing useEffect dependency arrays found.');
    process.exit(0);
  }
}

run();
