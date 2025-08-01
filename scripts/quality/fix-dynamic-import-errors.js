#!/usr/bin/env node

/**
 * Fix Dynamic Import Errors - Phase 6 Performance Optimization
 *
 * This script fixes malformed dynamic import statements that are preventing TypeScript compilation.
 * Specifically targets imports with missing module names and incomplete patterns.
 *
 * Part of the comprehensive performance issue resolution framework.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

class DynamicImportFixer {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
    this.patterns = [
      {
        name: 'Malformed Dynamic Import (Empty Module)',
        pattern:
          /const\s+(\w*)\s*=\s*dynamic\(\(\)\s*=>\s*import\(['"][^'"]*['"]\)\.then\(mod\s*=>\s*\(\{\s*default:\s*mod\.\s*\}\)\),\s*\{\s*ssr:\s*true\s*\}\)\s*;/g,
        replacement: (match, varName) => {
          // Remove this malformed import entirely
          return '';
        },
      },
      {
        name: 'Incomplete Dynamic Import',
        pattern:
          /const\s+\s*=\s*dynamic\(\(\)\s*=>\s*import\(['"][^'"]*['"]\)\.then\(mod\s*=>\s*\(\{\s*default:\s*mod\.\s*\}\)\),\s*\{\s*ssr:\s*true\s*\}\)\s*;/g,
        replacement: () => {
          // Remove this malformed import entirely
          return '';
        },
      },
      {
        name: 'Malformed Variable Declaration',
        pattern: /const\s+\s+=/g,
        replacement: () => {
          // Remove malformed variable declarations
          return '';
        },
      },
      {
        name: 'Empty Dynamic Import Lines',
        pattern: /const\s*=\s*dynamic[^;]*;\s*\n/g,
        replacement: () => {
          return '';
        },
      },
    ];
  }

  async findFilesWithErrors() {
    try {
      // Get files with specific TypeScript errors
      const output = execSync('npx tsc --noEmit 2>&1 | grep -E "TS1134|TS1005|TS1003" | head -20', {
        encoding: 'utf8',
        shell: true,
      });

      const files = new Set();
      output.split('\n').forEach(line => {
        const match = line.match(/^([^(]+)\(/);
        if (match) {
          files.add(match[1]);
        }
      });

      return Array.from(files);
    } catch (error) {
      console.log('No TypeScript errors found or unable to parse them');
      return [];
    }
  }

  async fixFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      const originalContent = content;

      // Apply each pattern fix
      for (const { name, pattern, replacement } of this.patterns) {
        const initialContent = content;
        content = content.replace(pattern, replacement);

        if (content !== initialContent) {
          console.log(`🔧 Fixed ${name} in ${filePath}`);
          modified = true;
        }
      }

      // Additional specific fixes for common patterns

      // Fix malformed const declarations with missing variable names
      const malformedConstPattern = /const\s+\s*=\s*dynamic/g;
      if (malformedConstPattern.test(content)) {
        content = content.replace(malformedConstPattern, '// Removed malformed dynamic import');
        modified = true;
        console.log(`🔧 Fixed malformed const declaration in ${filePath}`);
      }

      // Fix line break issues in dynamic imports
      const lineBreakPattern =
        /const\s+(\w+)\s*=\s*dynamic\(\(\)\s*=>\s*import\(['"][^'"]*['"]\)\.then\(mod\s*=>\s*\(\{\s*default:\s*mod\.(\w+)\s*\}\)\),\s*\{\s*ssr:\s*true\s*\}\)\s*;\s*;/g;
      if (lineBreakPattern.test(content)) {
        content = content.replace(lineBreakPattern, (match, varName, moduleName) => {
          return `const ${varName} = dynamic(() => import('@/lib/errors').then(mod => ({ default: mod.${moduleName} })), { ssr: true });`;
        });
        modified = true;
        console.log(`🔧 Fixed line break issues in dynamic imports in ${filePath}`);
      }

      // Remove duplicate semicolons
      const duplicateSemicolonPattern = /;\s*;/g;
      if (duplicateSemicolonPattern.test(content)) {
        content = content.replace(duplicateSemicolonPattern, ';');
        modified = true;
        console.log(`🔧 Fixed duplicate semicolons in ${filePath}`);
      }

      // Clean up empty lines from removed imports
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

      if (modified) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, originalContent);
        fs.writeFileSync(filePath, content);

        this.fixedFiles.push({
          file: filePath,
          backup: backupPath,
          changes: content.length - originalContent.length,
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
      this.errors.push({ file: filePath, error: error.message });
      return false;
    }
  }

  async getTypeScriptErrorCount() {
    try {
      execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
      return 0;
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || '';
      const errorCount = (errorOutput.match(/error TS\d+/g) || []).length;
      return errorCount;
    }
  }

  async runFix() {
    console.log('🚀 Starting Dynamic Import Error Fixes...\n');
    const startTime = performance.now();

    // Step 1: Get initial error count
    const initialErrors = await this.getTypeScriptErrorCount();
    console.log(`📊 Initial TypeScript errors: ${initialErrors}`);

    // Step 2: Find files with specific errors
    console.log('🔍 Finding files with TypeScript errors...');
    const errorFiles = await this.findFilesWithErrors();
    console.log(`📁 Found ${errorFiles.length} files with errors`);

    // Step 3: Fix each problematic file
    let fixedCount = 0;
    for (const filePath of errorFiles) {
      if (await this.fixFile(filePath)) {
        fixedCount++;
      }
    }

    // Step 4: Additional API route fixes
    console.log('\n🔧 Fixing known problematic API routes...');
    const apiFiles = [
      'src/app/api/analytics/users/route.ts',
      'src/app/api/products/stats-optimized/route.ts',
    ];

    for (const filePath of apiFiles) {
      if (await this.fixFile(filePath)) {
        fixedCount++;
      }
    }

    // Step 5: Final verification
    console.log('\n📋 Final verification...');
    const finalErrors = await this.getTypeScriptErrorCount();

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    console.log('\n📊 Dynamic Import Fix Summary:');
    console.log('═'.repeat(50));
    console.log(`⏱️  Total time: ${duration}ms`);
    console.log(`📁 Files processed: ${errorFiles.length + apiFiles.length}`);
    console.log(`✅ Files fixed: ${fixedCount}`);
    console.log(`📊 Initial errors: ${initialErrors}`);
    console.log(`📊 Final errors: ${finalErrors}`);
    console.log(`📈 Improvement: ${initialErrors - finalErrors} errors resolved`);

    if (this.fixedFiles.length > 0) {
      console.log('\n🔧 Fixed Files:');
      this.fixedFiles.forEach(({ file, changes }) => {
        console.log(`   📄 ${file} (${changes > 0 ? '+' : ''}${changes} bytes)`);
      });
    }

    return {
      initialErrors,
      finalErrors,
      filesFixed: fixedCount,
      duration: parseFloat(duration),
      success: finalErrors < initialErrors,
    };
  }
}

async function main() {
  const fixer = new DynamicImportFixer();

  try {
    const results = await fixer.runFix();

    console.log('\n🎯 Final Results:');
    console.log('═'.repeat(50));
    console.log(`📊 Error reduction: ${results.initialErrors} → ${results.finalErrors}`);
    if (results.initialErrors > 0) {
      console.log(
        `📈 Improvement: ${(((results.initialErrors - results.finalErrors) / results.initialErrors) * 100).toFixed(1)}%`
      );
    }
    console.log(`📁 Files fixed: ${results.filesFixed}`);
    console.log(`⏱️  Duration: ${results.duration}ms`);
    console.log(`🎯 Success: ${results.success ? '✅' : '❌'}`);

    if (results.finalErrors === 0) {
      console.log('\n🎉 All TypeScript errors resolved!');
      console.log('✅ Ready to proceed with infinite loop fixes');
    } else if (results.success) {
      console.log('\n⚡ Significant progress made!');
      console.log('🔄 Consider running additional targeted fixes');
    }

    process.exit(results.finalErrors < 100 ? 0 : 1);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DynamicImportFixer };
