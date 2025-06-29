#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 VALIDATING IMPORT PATHS');
console.log('='.repeat(50));

// Problematic import patterns to check for
const problematicImports = [
  {
    pattern: /@\/contexts\/AuthContext/g,
    correct: '@/components/providers/AuthProvider',
    description: 'AuthContext should be imported from AuthProvider',
  },
  {
    pattern: /@\/hooks\/useErrorHandler/g,
    correct: '@/hooks/useErrorHandling',
    description: 'Error handling hook should be useErrorHandling',
  },
];

// Files to check
const filesToCheck = ['src/**/*.tsx', 'src/**/*.ts'];

let totalFiles = 0;
let filesWithIssues = 0;
let totalIssues = 0;

console.log('📋 Scanning files for import issues...\n');

filesToCheck.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: process.cwd() });

  files.forEach(file => {
    const filePath = path.join(process.cwd(), file);

    if (!fs.existsSync(filePath)) return;

    totalFiles++;
    const content = fs.readFileSync(filePath, 'utf8');
    let fileHasIssues = false;

    problematicImports.forEach(({ pattern, correct, description }) => {
      const matches = content.match(pattern);

      if (matches) {
        if (!fileHasIssues) {
          console.log(`❌ ${file}:`);
          fileHasIssues = true;
          filesWithIssues++;
        }

        matches.forEach(match => {
          console.log(`   • ${description}`);
          console.log(`     Found: ${match}`);
          console.log(`     Should be: ${correct}`);
          totalIssues++;
        });
      }
    });

    if (fileHasIssues) {
      console.log('');
    }
  });
});

console.log('📊 VALIDATION RESULTS:');
console.log(`   Files scanned: ${totalFiles}`);
console.log(`   Files with issues: ${filesWithIssues}`);
console.log(`   Total issues: ${totalIssues}`);

if (totalIssues === 0) {
  console.log('\n🎉 SUCCESS: All import paths are correct!');
  process.exit(0);
} else {
  console.log('\n⚠️  ISSUES FOUND: Please fix the import paths above');
  console.log('\nTo fix automatically, run:');
  console.log('  npm run fix:imports');
  process.exit(1);
}
