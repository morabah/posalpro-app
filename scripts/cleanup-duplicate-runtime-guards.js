#!/usr/bin/env node

/**
 * Cleanup Duplicate Runtime Guards Script
 *
 * This script removes duplicate runtime guards that were accidentally created
 * by the auto-fix script. It keeps only the first occurrence of each guard.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function findApiRoutes() {
  const apiDir = path.join(projectRoot, 'src/app/api');
  const routes = [];

  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) {
      return;
    }

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        scanDirectory(itemPath);
      } else if (item === 'route.ts') {
        routes.push(itemPath);
      }
    }
  }

  scanDirectory(apiDir);
  return routes;
}

function cleanupDuplicateGuards(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(projectRoot, filePath);
  const lines = content.split('\n');

  let cleanedLines = [];
  let runtimeFound = false;
  let dynamicFound = false;
  let changes = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for runtime guard
    if (line.includes("export const runtime = 'nodejs'") || line.includes('export const runtime = "nodejs"')) {
      if (!runtimeFound) {
        cleanedLines.push(line);
        runtimeFound = true;
      } else {
        changes.push('Removed duplicate runtime guard');
      }
    }
    // Check for dynamic guard
    else if (line.includes("export const dynamic = 'force-dynamic'") || line.includes('export const dynamic = "force-dynamic"')) {
      if (!dynamicFound) {
        cleanedLines.push(line);
        dynamicFound = true;
      } else {
        changes.push('Removed duplicate dynamic guard');
      }
    }
    // Keep all other lines
    else {
      cleanedLines.push(line);
    }
  }

  if (changes.length > 0) {
    const newContent = cleanedLines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    return {
      fixed: true,
      changes: changes
    };
  }

  return {
    fixed: false,
    reason: 'No duplicates found'
  };
}

function main() {
  console.log(colorize('🧹 Cleaning up duplicate runtime guards...', 'cyan'));
  console.log('');

  const routes = findApiRoutes();
  let fixedCount = 0;
  let totalChanges = 0;

  for (const route of routes) {
    const result = cleanupDuplicateGuards(route);
    const relativePath = path.relative(projectRoot, route);

    if (result.fixed) {
      console.log(`   ${colorize('✅', 'green')} ${relativePath}`);
      console.log(`      ${colorize('•', 'cyan')} ${result.changes.join(', ')}`);
      fixedCount++;
      totalChanges += result.changes.length;
    }
  }

  console.log('');
  console.log(colorize('📊 Cleanup Summary:', 'bold'));
  console.log(`   Files cleaned: ${colorize(fixedCount.toString(), 'green')}`);
  console.log(`   Duplicates removed: ${colorize(totalChanges.toString(), 'green')}`);
  console.log('');

  if (fixedCount > 0) {
    console.log(colorize('✅ Duplicate cleanup complete!', 'green'));
    console.log('');
    console.log(colorize('🔍 Verifying cleanup...', 'cyan'));

    // Run TypeScript check to verify no more errors
    const tsResult = spawnSync('npm', ['run', 'type-check'], {
      cwd: projectRoot,
      stdio: 'pipe',
      encoding: 'utf8'
    });

    if (tsResult.status === 0) {
      console.log(colorize('✅ TypeScript compilation successful!', 'green'));
    } else {
      console.log(colorize('⚠️ TypeScript errors still exist', 'yellow'));
      console.log('Run "npm run type-check" to see remaining issues');
    }
  } else {
    console.log(colorize('ℹ️ No duplicate guards found', 'blue'));
  }

  console.log('');
  console.log(colorize('💡 Next steps:', 'cyan'));
  console.log('   1. Run "npm run type-check" to verify TypeScript compilation');
  console.log('   2. Run "npm run pre-commit:runtime-guards" to verify all guards are correct');
  console.log('   3. Test the application to ensure all API routes work correctly');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(colorize('Duplicate Runtime Guard Cleanup Script', 'bold'));
  console.log('');
  console.log('Usage: node scripts/cleanup-duplicate-runtime-guards.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h    Show this help message');
  console.log('');
  console.log('This script removes duplicate runtime guards from API routes:');
  console.log('  • Removes duplicate "export const runtime = \'nodejs\';" declarations');
  console.log('  • Removes duplicate "export const dynamic = \'force-dynamic\';" declarations');
  console.log('  • Keeps only the first occurrence of each guard');
  console.log('');
  console.log('The script will:');
  console.log('  1. Scan all API routes in src/app/api/**/route.ts');
  console.log('  2. Identify duplicate runtime guard declarations');
  console.log('  3. Remove duplicates while preserving the first occurrence');
  console.log('  4. Verify TypeScript compilation');
  process.exit(0);
}

main().catch(error => {
  console.error(colorize('❌ Error:', 'red'), error.message);
  process.exit(1);
});
