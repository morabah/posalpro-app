const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

// This regex detects direct, synchronous usage of localStorage.
const SYNC_STORAGE_REGEX = /localStorage\.(getItem|setItem|removeItem|clear)\(/;

const SRC_DIR = path.join(process.cwd(), 'src');
// We scan UI-related directories. Direct storage access should be in a service.
const UI_DIRS = ['components', 'hooks', 'app'];

async function findSyncStorageViolations() {
  console.log('🔍 Searching for synchronous localStorage access from the UI layer...');
  const searchPatterns = UI_DIRS.map(dir => `${dir}/**/*.{ts,tsx}`);
  const files = await fg(searchPatterns, {
    cwd: SRC_DIR,
    ignore: ['**/*.test.*', '**/node_modules/**', '**/api/**'],
  });

  const filesWithErrors = [];

  for (const file of files) {
    const filePath = path.join(SRC_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    if (SYNC_STORAGE_REGEX.test(content)) {
      filesWithErrors.push(file);
    }
  }

  return filesWithErrors;
}

async function run() {
  const filesWithErrors = await findSyncStorageViolations();

  if (filesWithErrors.length > 0) {
    console.error('❌ Error: Found direct synchronous `localStorage` access from the UI layer.');
    console.error(
      'This is a critical performance anti-pattern. All storage operations must be abstracted into a non-blocking service.'
    );
    console.error('The following files violate this architectural rule:');
    filesWithErrors.forEach(file => console.log(`  - src/${file}`));
    process.exit(1);
  } else {
    console.log('✅ Success: No synchronous localStorage access found in the UI layer.');
    process.exit(0);
  }
}

run();
