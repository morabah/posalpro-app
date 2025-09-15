#!/usr/bin/env node

/**
 * Runtime Guard Auto-Fix Script
 *
 * This script automatically adds missing runtime guards to API routes.
 * It adds both 'export const runtime = 'nodejs'' and 'export const dynamic = 'force-dynamic''
 * to the top of each route file (after imports).
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

function analyzeRoute(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(projectRoot, filePath);

  const hasRuntime = content.includes("export const runtime = 'nodejs'");
  const hasDynamic = content.includes("export const dynamic = 'force-dynamic'");

  return {
    filePath: relativePath,
    fullPath: filePath,
    content,
    hasRuntime,
    hasDynamic,
    needsRuntime: !hasRuntime,
    needsDynamic: !hasDynamic,
    needsFixing: !hasRuntime || !hasDynamic
  };
}

function fixRoute(route) {
  if (!route.needsFixing) {
    return { fixed: false, reason: 'Already has both guards' };
  }

  let newContent = route.content;
  let changes = [];

  // Find the best place to insert the runtime guards
  // Look for the end of imports or the first export
  const lines = newContent.split('\n');
  let insertIndex = 0;

  // Find the last import statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('import{')) {
      insertIndex = i + 1;
    }
  }

  // If no imports found, look for the first export or function
  if (insertIndex === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('export ') || line.startsWith('function ') || line.startsWith('const ') || line.startsWith('let ') || line.startsWith('var ')) {
        insertIndex = i;
        break;
      }
    }
  }

  // Prepare the guards to add
  const guardsToAdd = [];

  if (route.needsRuntime) {
    guardsToAdd.push("export const runtime = 'nodejs';");
    changes.push('Added runtime guard');
  }

  if (route.needsDynamic) {
    guardsToAdd.push("export const dynamic = 'force-dynamic';");
    changes.push('Added dynamic guard');
  }

  // Insert the guards
  if (guardsToAdd.length > 0) {
    // Add a blank line before guards if there are imports
    if (insertIndex > 0 && lines[insertIndex - 1].trim().startsWith('import ')) {
      guardsToAdd.unshift('');
    }

    // Add guards
    lines.splice(insertIndex, 0, ...guardsToAdd);
    newContent = lines.join('\n');
  }

  // Write the fixed content back to the file
  fs.writeFileSync(route.fullPath, newContent, 'utf8');

  return {
    fixed: true,
    changes: changes,
    guardsAdded: guardsToAdd.length
  };
}

function main() {
  console.log(colorize('🔧 Auto-fixing runtime guards in API routes...', 'cyan'));
  console.log('');

  const routes = findApiRoutes();
  const analyzedRoutes = routes.map(analyzeRoute);

  const routesNeedingFix = analyzedRoutes.filter(r => r.needsFixing);
  const routesAlreadyFixed = analyzedRoutes.filter(r => !r.needsFixing);

  console.log(colorize('📊 Route Analysis:', 'bold'));
  console.log(`   Total API routes: ${colorize(routes.length.toString(), 'blue')}`);
  console.log(`   ✅ Already fixed: ${colorize(routesAlreadyFixed.length.toString(), 'green')}`);
  console.log(`   🔧 Need fixing: ${colorize(routesNeedingFix.length.toString(), 'yellow')}`);
  console.log('');

  if (routesNeedingFix.length === 0) {
    console.log(colorize('✅ All routes already have proper runtime guards!', 'green'));
    process.exit(0);
  }

  console.log(colorize('🔧 Fixing routes...', 'yellow'));
  console.log('');

  let fixedCount = 0;
  let totalGuardsAdded = 0;

  for (const route of routesNeedingFix) {
    const result = fixRoute(route);

    if (result.fixed) {
      console.log(`   ${colorize('✅', 'green')} ${route.filePath}`);
      console.log(`      ${colorize('•', 'cyan')} ${result.changes.join(', ')}`);
      fixedCount++;
      totalGuardsAdded += result.guardsAdded;
    } else {
      console.log(`   ${colorize('ℹ️', 'blue')} ${route.filePath} - ${result.reason}`);
    }
  }

  console.log('');
  console.log(colorize('📊 Fix Summary:', 'bold'));
  console.log(`   Routes fixed: ${colorize(fixedCount.toString(), 'green')}`);
  console.log(`   Guards added: ${colorize(totalGuardsAdded.toString(), 'green')}`);
  console.log('');

  if (fixedCount > 0) {
    console.log(colorize('✅ Runtime guard fixes complete!', 'green'));
    console.log('');
    console.log(colorize('🔍 Verifying fixes...', 'cyan'));

    // Run the verification script to confirm all routes are now fixed
    const verifyResult = spawnSync('node', ['scripts/check-runtime-guards.js'], {
      cwd: projectRoot,
      stdio: 'pipe',
      encoding: 'utf8'
    });

    if (verifyResult.status === 0) {
      console.log(colorize('✅ All routes now have proper runtime guards!', 'green'));
    } else {
      console.log(colorize('⚠️ Some routes may still need manual fixing', 'yellow'));
      console.log('Run "node scripts/check-runtime-guards.js" to see remaining issues');
    }
  } else {
    console.log(colorize('ℹ️ No routes needed fixing', 'blue'));
  }

  console.log('');
  console.log(colorize('💡 Next steps:', 'cyan'));
  console.log('   1. Test the application to ensure all API routes work correctly');
  console.log('   2. Run "npm run lint" to verify no linting issues');
  console.log('   3. Commit the changes to version control');
  console.log('   4. Deploy to verify Edge Function conflicts are resolved');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(colorize('Runtime Guard Auto-Fix Script', 'bold'));
  console.log('');
  console.log('Usage: node scripts/fix-runtime-guards.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h    Show this help message');
  console.log('');
  console.log('This script automatically adds missing runtime guards to API routes:');
  console.log('  • export const runtime = \'nodejs\';');
  console.log('  • export const dynamic = \'force-dynamic\';');
  console.log('');
  console.log('The script will:');
  console.log('  1. Scan all API routes in src/app/api/**/route.ts');
  console.log('  2. Identify routes missing runtime guards');
  console.log('  3. Automatically add the missing guards');
  console.log('  4. Verify all routes are properly configured');
  process.exit(0);
}

main().catch(error => {
  console.error(colorize('❌ Error:', 'red'), error.message);
  process.exit(1);
});
