const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

// Heuristic for a React component export (PascalCase name)
const COMPONENT_EXPORT_REGEX = /export\s+(const|function)\s+([A-Z]\w*)/;
const DEFAULT_COMPONENT_EXPORT_REGEX = /export\s+default\s+([A-Z]\w*)/;

// Heuristic for a non-component export (a hook `use...` or a utility in `camelCase`)
const HOOK_EXPORT_REGEX = /export\s+function\s+(use[A-Z]\w*)/;
const UTIL_EXPORT_REGEX = /export\s+const\s+([a-z]\w*)/;

const SRC_DIR = path.join(process.cwd(), 'src');
const UI_DIRS = ['components', 'contexts', 'hooks', 'app'];

async function findMixedExportViolations() {
  console.log('🔍 Searching for files with mixed React component and utility/hook exports...');
  const searchPatterns = UI_DIRS.map(dir => `${dir}/**/*.tsx`);
  const files = await fg(searchPatterns, {
    cwd: SRC_DIR,
    ignore: ['**/*.test.*', '**/node_modules/**'],
  });

  const filesWithErrors = [];

  for (const file of files) {
    const filePath = path.join(SRC_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    const hasComponentExport =
      COMPONENT_EXPORT_REGEX.test(content) || DEFAULT_COMPONENT_EXPORT_REGEX.test(content);
    const hasHookExport = HOOK_EXPORT_REGEX.test(content);
    // Also check for non-hook, non-component const exports
    const hasUtilExport = content.match(UTIL_EXPORT_REGEX) && !content.match(/=\s*createContext/);

    if (hasComponentExport && (hasHookExport || hasUtilExport)) {
      filesWithErrors.push(file);
    }
  }

  return filesWithErrors;
}

async function run() {
  const filesWithErrors = await findMixedExportViolations();

  if (filesWithErrors.length > 0) {
    console.error(
      '❌ Error: Found files that export both React components and non-component values (hooks/utils).'
    );
    console.error(
      'This is an anti-pattern that breaks Next.js Fast Refresh. Please separate them into different files.'
    );
    console.error('The following files violate this architectural rule:');
    filesWithErrors.forEach(file => console.log(`  - src/${file}`));
    process.exit(1);
  } else {
    console.log('✅ Success: No files with mixed component and hook/utility exports were found.');
    process.exit(0);
  }
}

run();
