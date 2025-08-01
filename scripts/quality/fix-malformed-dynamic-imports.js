#!/usr/bin/env node

/**
 * Fix Malformed Dynamic Imports - Comprehensive TypeScript Syntax Fix
 *
 * This script systematically fixes malformed dynamic import statements that are
 * causing TypeScript compilation errors across the codebase.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DynamicImportFixer {
  constructor() {
    this.fixedFiles = 0;
    this.errors = [];
  }

  fixMalformedDynamicImports() {
    console.log('🔧 Fixing malformed dynamic import statements...');

    // Find all TypeScript files with potential issues
    const files = execSync('find src -name "*.tsx" -o -name "*.ts" | head -50', {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(file => fs.existsSync(file));

    for (const filePath of files) {
      this.fixFileImports(filePath);
    }

    console.log(`📊 Fixed dynamic imports in ${this.fixedFiles} files`);
    return this.fixedFiles;
  }

  fixFileImports(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // Create backup
      const backupPath = `${filePath}.backup.${Date.now()}`;
      fs.writeFileSync(backupPath, content);

      // Fix malformed dynamic imports pattern: const  = dynamic(() => ...)
      const malformedPattern =
        /const\s*=\s*dynamic\(\(\)\s*=>\s*import\([^)]+\)\.then\([^)]+\),\s*\{\s*ssr:\s*true\s*\}\);?;?/g;
      if (malformedPattern.test(content)) {
        content = content.replace(malformedPattern, '// Removed malformed dynamic import');
        modified = true;
      }

      // Fix duplicate imports by removing them
      const lines = content.split('\n');
      const seenImports = new Set();
      const filteredLines = [];

      for (const line of lines) {
        if (line.includes('const ') && line.includes('dynamic(')) {
          const match = line.match(/const\s+(\w+)\s*=/);
          if (match) {
            const varName = match[1];
            if (seenImports.has(varName)) {
              // Skip duplicate
              continue;
            }
            seenImports.add(varName);
          }
        }
        filteredLines.push(line);
      }

      if (filteredLines.length !== lines.length) {
        content = filteredLines.join('\n');
        modified = true;
      }

      // Fix 'use client' syntax
      content = content.replace(/\('use client'\);?/, "'use client';");

      // Fix missing semicolons
      content = content.replace(/(\w+)\s*\n(\s*[A-Z])/g, '$1;\n$2');

      if (modified) {
        fs.writeFileSync(filePath, content);
        this.fixedFiles++;
        console.log(`   ✅ Fixed ${path.basename(filePath)}`);
      }
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.error(`   ❌ Error fixing ${filePath}:`, error.message);
    }
  }
}

async function main() {
  const fixer = new DynamicImportFixer();

  try {
    await fixer.fixMalformedDynamicImports();

    console.log('\n🎯 Checking TypeScript compilation...');
    try {
      execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
      console.log('✅ All TypeScript errors fixed!');
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || '';
      const errorCount = (errorOutput.match(/error TS\d+/g) || []).length;
      console.log(`📊 Remaining TypeScript errors: ${errorCount}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DynamicImportFixer };
