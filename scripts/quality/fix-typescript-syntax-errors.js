#!/usr/bin/env node

/**
 * Fix TypeScript Syntax Errors - Phase 6 Performance Optimization
 *
 * This script fixes critical syntax errors preventing TypeScript compilation:
 * 1. Malformed useEffect usage inside Promise callbacks
 * 2. Missing closing braces and parentheses
 * 3. Other syntax patterns that break TypeScript parsing
 *
 * Part of the comprehensive performance issue resolution framework.
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class TypeScriptSyntaxFixer {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
    this.patterns = [
      {
        name: 'Malformed useEffect in Promise',
        pattern:
          /await new Promise\(resolve => useEffect\(\(\) => \{\s*const timeoutId = setTimeout\(resolve, \d+\);\s*return \(\) => clearTimeout\(timeoutId\);\s*\}, \[\]\);\s*\}, \[\]\)\; \/\/ Add appropriate dependencies\)\;/gm,
        replacement: (match, timeout) => {
          const timeoutMatch = match.match(/setTimeout\(resolve, (\d+)\)/);
          const timeoutValue = timeoutMatch ? timeoutMatch[1] : '1000';
          return `await new Promise(resolve => setTimeout(resolve, ${timeoutValue}));`;
        },
      },
      {
        name: 'Malformed useEffect in Promise (Generic)',
        pattern:
          /await new Promise\(resolve => useEffect\(\(\) => \{\s*const timeoutId = setTimeout\(([^,]+), ([^)]+)\);\s*return \(\) => clearTimeout\(timeoutId\);\s*\}, \[\]\);\s*\}, \[\]\)\; \/\/ Add appropriate dependencies\)\;/gm,
        replacement: (match, callback, timeout) => {
          return `await new Promise(resolve => setTimeout(resolve, ${timeout}));`;
        },
      },
    ];

    this.targetFiles = [
      'src/app/(dashboard)/admin/AdminInternal.tsx',
      'src/app/(dashboard)/content/search/page.tsx',
    ];
  }

  async fixFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return false;
      }

      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      const originalContent = content;

      // Apply each pattern fix
      for (const { name, pattern, replacement } of this.patterns) {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`🔧 Fixing ${name} in ${filePath}`);
          console.log(`   Found ${matches.length} instances`);

          if (typeof replacement === 'function') {
            content = content.replace(pattern, replacement);
          } else {
            content = content.replace(pattern, replacement);
          }
          modified = true;
        }
      }

      // Additional specific fixes for AdminInternal.tsx
      if (filePath.includes('AdminInternal.tsx')) {
        // Fix the specific malformed promise in AdminInternal.tsx
        const adminPattern =
          /await new Promise\(resolve => useEffect\(\(\) => \{\s*const timeoutId = setTimeout\(resolve, 1000\);\s*return \(\) => clearTimeout\(timeoutId\);\s*\}, \[\]\);\s*\}, \[\]\)\; \/\/ Add appropriate dependencies\)\;/g;
        if (adminPattern.test(content)) {
          content = content.replace(
            adminPattern,
            'await new Promise(resolve => setTimeout(resolve, 1000));'
          );
          modified = true;
          console.log(`🔧 Fixed AdminInternal.tsx specific syntax error`);
        }
      }

      // Additional specific fixes for ContentSearch page
      if (filePath.includes('content/search/page.tsx')) {
        // Fix the specific malformed promise in content search
        const searchPattern =
          /await new Promise\(resolve => useEffect\(\(\) => \{\s*const timeoutId = setTimeout\(resolve, 500\);\s*return \(\) => clearTimeout\(timeoutId\);\s*\}, \[\]\);\s*\}, \[\]\)\; \/\/ Add appropriate dependencies\)\;/g;
        if (searchPattern.test(content)) {
          content = content.replace(
            searchPattern,
            'await new Promise(resolve => setTimeout(resolve, 500));'
          );
          modified = true;
          console.log(`🔧 Fixed ContentSearch specific syntax error`);
        }
      }

      if (modified) {
        // Backup original file
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, originalContent);

        // Write fixed content
        fs.writeFileSync(filePath, content);

        this.fixedFiles.push({
          file: filePath,
          backup: backupPath,
          changes: content.length - originalContent.length,
        });

        console.log(`✅ Fixed syntax errors in ${filePath}`);
        return true;
      } else {
        console.log(`📄 No syntax errors found in ${filePath}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
      this.errors.push({ file: filePath, error: error.message });
      return false;
    }
  }

  async fixAllFiles() {
    console.log('🚀 Starting TypeScript Syntax Error Fixes...\n');
    const startTime = performance.now();

    let fixedCount = 0;
    for (const filePath of this.targetFiles) {
      const fixed = await this.fixFile(filePath);
      if (fixed) fixedCount++;
    }

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    console.log('\n📊 TypeScript Syntax Fix Summary:');
    console.log('═'.repeat(50));
    console.log(`⏱️  Total time: ${duration}ms`);
    console.log(`📁 Files processed: ${this.targetFiles.length}`);
    console.log(`✅ Files fixed: ${fixedCount}`);
    console.log(`❌ Errors: ${this.errors.length}`);

    if (this.fixedFiles.length > 0) {
      console.log('\n🔧 Fixed Files:');
      this.fixedFiles.forEach(({ file, backup, changes }) => {
        console.log(`   📄 ${file}`);
        console.log(`      💾 Backup: ${backup}`);
        console.log(`      📏 Size change: ${changes > 0 ? '+' : ''}${changes} bytes`);
      });
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(({ file, error }) => {
        console.log(`   📄 ${file}: ${error}`);
      });
    }

    return {
      processed: this.targetFiles.length,
      fixed: fixedCount,
      errors: this.errors.length,
      duration: parseFloat(duration),
    };
  }

  async verifyFixes() {
    console.log('\n🔍 Verifying TypeScript compilation...');

    const { spawn } = require('child_process');

    return new Promise(resolve => {
      const typeCheck = spawn('npm', ['run', 'type-check'], {
        stdio: 'pipe',
        shell: true,
      });

      let output = '';
      let errorOutput = '';

      typeCheck.stdout.on('data', data => {
        output += data.toString();
      });

      typeCheck.stderr.on('data', data => {
        errorOutput += data.toString();
      });

      typeCheck.on('close', code => {
        const success = code === 0;

        if (success) {
          console.log('✅ TypeScript compilation successful!');
        } else {
          console.log('❌ TypeScript compilation still has errors');
          const errorLines = errorOutput
            .split('\n')
            .filter(
              line =>
                line.includes('error TS') ||
                line.includes('AdminInternal.tsx') ||
                line.includes('content/search/page.tsx')
            )
            .slice(0, 10);

          console.log('📋 Sample remaining errors:');
          errorLines.forEach(line => console.log(`   ${line}`));
        }

        resolve({
          success,
          output: output + errorOutput,
          errorCount: (errorOutput.match(/error TS\d+/g) || []).length,
        });
      });
    });
  }
}

async function main() {
  const fixer = new TypeScriptSyntaxFixer();

  try {
    const results = await fixer.fixAllFiles();
    const verification = await fixer.verifyFixes();

    console.log('\n🎯 Final Results:');
    console.log('═'.repeat(50));
    console.log(`📊 Files fixed: ${results.fixed}/${results.processed}`);
    console.log(
      `⚡ TypeScript compilation: ${verification.success ? '✅ Success' : '❌ Still has errors'}`
    );
    console.log(`🔢 Remaining TS errors: ${verification.errorCount || 0}`);
    console.log(`⏱️  Total duration: ${results.duration}ms`);

    if (results.fixed > 0) {
      console.log('\n🔄 Next steps:');
      console.log('   1. Run `npm run type-check` to verify all fixes');
      console.log('   2. Test affected components manually');
      console.log('   3. Run the full test suite if compilation succeeds');
    }

    process.exit(verification.success ? 0 : 1);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { TypeScriptSyntaxFixer };
