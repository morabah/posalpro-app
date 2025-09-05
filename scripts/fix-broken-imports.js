#!/usr/bin/env node

/**
 * Fix broken import statements created by the database import script
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing broken import statements...');

const routesDir = path.join(__dirname, '..', 'src', 'app', 'api');

// Recursively find all .ts files
function findTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findTsFiles(fullPath));
    } else if (item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

const tsFiles = findTsFiles(routesDir);
let fixedCount = 0;

tsFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let modified = false;

  // Fix pattern 1: "fimport { ... } from" -> "import { ... } from"
  content = content.replace(/fimport \{([^}]+)\} from/g, 'import {$1} from');

  // Fix pattern 2: broken multi-line imports
  content = content.replace(/\} from ([^;]+)import \{([^}]+)\} from ([^;]+);/g,
    (match, from1, imports2, from2) => {
      return `} from ${from1};\nimport {${imports2}} from ${from2};`;
    });

  // Fix pattern 3: "Epimport" -> "import"
  content = content.replace(/Epimport/g, 'import');

  // Fix pattern 4: "Repimport" -> "import"
  content = content.replace(/Repimport/g, 'import');

  // Fix pattern 5: "imimport" -> "import"
  content = content.replace(/imimport/g, 'import');

  // Fix pattern 6: "horization';\nimport" -> "horization';\n\nimport"
  content = content.replace(/horization';\nimport/g, "horization';\n\nimport");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    fixedCount++;
    modified = true;
  }

  // Additional check for specific broken patterns
  if (!modified) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('import') && lines[i].includes('fimport')) {
        console.log(`⚠️  Still broken: ${path.relative(process.cwd(), filePath)}:${i + 1}`);
        console.log(`   ${lines[i]}`);
      }
    }
  }
});

console.log(`\n🎉 Fixed ${fixedCount} files with broken imports`);
console.log('\n📝 Next steps:');
console.log('1. Test the build: npm run build');
console.log('2. If successful, update Prisma usage to use database utility');
