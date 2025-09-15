#!/usr/bin/env node

/**
 * Runtime Guard Enforcement Script
 *
 * This script scans all API routes in src/app/api/route.ts to ensure
 * they have the required runtime guards to prevent Edge Function conflicts
 * with Prisma and other Node.js-specific dependencies.
 *
 * Required runtime guards:
 * - export const runtime = 'nodejs';
 * - export const dynamic = 'force-dynamic';
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function checkRuntimeGuards(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(projectRoot, filePath);

  const hasRuntime = content.includes("export const runtime = 'nodejs'") || content.includes('export const runtime = "nodejs"');
  const hasDynamic = content.includes("export const dynamic = 'force-dynamic'") || content.includes('export const dynamic = "force-dynamic"');

  return {
    filePath: relativePath,
    hasRuntime,
    hasDynamic,
    isValid: hasRuntime && hasDynamic
  };
}

function generateFixSuggestion(filePath) {
  return `// Add these exports at the top of the file (after imports):
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Then your route handlers...`;
}

function main() {
  console.log(colorize('🔍 Scanning API routes for runtime guards...', 'cyan'));
  console.log('');

  const routes = findApiRoutes();
  const results = routes.map(checkRuntimeGuards);

  const validRoutes = results.filter(r => r.isValid);
  const invalidRoutes = results.filter(r => !r.isValid);

  // Summary
  console.log(colorize('📊 Runtime Guard Check Results:', 'bold'));
  console.log(`   Total API routes: ${colorize(routes.length.toString(), 'blue')}`);
  console.log(`   ✅ Valid routes: ${colorize(validRoutes.length.toString(), 'green')}`);
  console.log(`   ❌ Invalid routes: ${colorize(invalidRoutes.length.toString(), 'red')}`);
  console.log('');

  if (invalidRoutes.length > 0) {
    console.log(colorize('❌ Routes missing runtime guards:', 'red'));
    console.log('');

    for (const route of invalidRoutes) {
      console.log(`   ${colorize('•', 'red')} ${route.filePath}`);

      if (!route.hasRuntime) {
        console.log(`     ${colorize('⚠️', 'yellow')} Missing: export const runtime = 'nodejs';`);
      }

      if (!route.hasDynamic) {
        console.log(`     ${colorize('⚠️', 'yellow')} Missing: export const dynamic = 'force-dynamic';`);
      }

      console.log('');
    }

    console.log(colorize('🔧 How to fix:', 'yellow'));
    console.log('');
    console.log('Add these exports at the top of each route file (after imports):');
    console.log('');
    console.log(colorize('export const runtime = \'nodejs\';', 'green'));
    console.log(colorize('export const dynamic = \'force-dynamic\';', 'green'));
    console.log('');
    console.log(colorize('💡 Why these guards are needed:', 'cyan'));
    console.log('   • Prevents API routes from running as Edge Functions');
    console.log('   • Ensures Prisma and other Node.js dependencies work correctly');
    console.log('   • Prevents "engine=none" and Data Proxy connection errors');
    console.log('   • Required for all API routes that use database connections');
    console.log('');

    process.exit(1);
  } else {
    console.log(colorize('✅ All API routes have proper runtime guards!', 'green'));
    console.log('');
    console.log(colorize('🛡️ Runtime Guard Status:', 'cyan'));
    console.log('   • All routes configured for Node.js runtime');
    console.log('   • Edge Function conflicts prevented');
    console.log('   • Prisma compatibility ensured');
    console.log('');

    process.exit(0);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(colorize('Runtime Guard Enforcement Script', 'bold'));
  console.log('');
  console.log('Usage: node scripts/check-runtime-guards.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h    Show this help message');
  console.log('');
  console.log('This script checks that all API routes have the required runtime guards:');
  console.log('  • export const runtime = \'nodejs\';');
  console.log('  • export const dynamic = \'force-dynamic\';');
  console.log('');
  console.log('Exit codes:');
  console.log('  0 - All routes have proper runtime guards');
  console.log('  1 - Some routes are missing runtime guards');
  process.exit(0);
}

main();
