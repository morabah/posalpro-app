const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

// This regex looks for patterns like `someEntity.query(` or `anotherEntity.findUnique(`.
// It detects direct data entity/model access, which should be restricted to the API layer.
const DIRECT_ACCESS_REGEX =
  /[a-zA-Z]+Entity\.(query|findUnique|findMany|create|update|delete|upsert)\(/;

const SRC_DIR = path.join(process.cwd(), 'src');
const UI_DIRS = ['app', 'components', 'contexts', 'hooks'];

async function findDirectAccessViolations() {
  console.log('🔍 Searching for direct data entity access from the UI layer...');
  const searchPatterns = UI_DIRS.map(dir => `${dir}/**/*.{ts,tsx}`);
  const files = await fg(searchPatterns, {
    cwd: SRC_DIR,
    ignore: ['**/*.test.*', '**/node_modules/**', '**/api/**'],
  });

  const filesWithErrors = [];

  for (const file of files) {
    const filePath = path.join(SRC_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    if (DIRECT_ACCESS_REGEX.test(content)) {
      filesWithErrors.push(file);
    }
  }

  return filesWithErrors;
}

async function run() {
  const filesWithErrors = await findDirectAccessViolations();

  if (filesWithErrors.length > 0) {
    console.error('❌ Error: Found direct data entity access from the UI layer.');
    console.error(
      'UI components should never access data entities directly. Use the `useApiClient` hook instead.'
    );
    console.error('The following files violate this architectural rule:');
    filesWithErrors.forEach(file => console.log(`  - src/${file}`));
    process.exit(1);
  } else {
    console.log('✅ Success: No direct data entity access from the UI layer found.');
    process.exit(0);
  }
}

run();
