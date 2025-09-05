#!/usr/bin/env node

/**
 * PosalPro MVP2 - Database Import Fixer Script
 * Automatically replaces static Prisma imports with dynamic database utility
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting database import fixes...');

// Find all routes with static Prisma imports
const routesWithPrisma = execSync(
  'find src/app/api -name "*.ts" -exec grep -l "^import.*prisma.*from.*@/lib/db/prisma" {} \\;',
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

console.log(`📋 Found ${routesWithPrisma.length} routes to fix:`);
routesWithPrisma.forEach(route => console.log(`  - ${route}`));

let fixedCount = 0;

routesWithPrisma.forEach(routePath => {
  try {
    let content = fs.readFileSync(routePath, 'utf8');

    // Replace static Prisma import
    const staticImportRegex = /^import prisma from ['"]@\/lib\/db\/prisma['"];?\s*$/gm;
    if (staticImportRegex.test(content)) {
      content = content.replace(staticImportRegex,
        "// import prisma from '@/lib/db/prisma'; // Replaced with dynamic imports");

      // Add database utility import if not already present
      if (!content.includes("from '@/lib/db/database'")) {
        // Find the last import statement
        const lines = content.split('\n');
        let lastImportIndex = -1;

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import')) {
            lastImportIndex = i;
          } else if (lines[i].trim() !== '' && lastImportIndex !== -1) {
            break;
          }
        }

        if (lastImportIndex !== -1) {
          // Insert after the last import
          lines.splice(lastImportIndex + 1, 0,
            "import { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';"
          );
          content = lines.join('\n');
        }
      }

      fs.writeFileSync(routePath, content);
      console.log(`✅ Fixed: ${routePath}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${routePath}:`, error.message);
  }
});

console.log(`\n🎉 Fixed ${fixedCount} out of ${routesWithPrisma.length} routes`);
console.log('\n📝 Next steps:');
console.log('1. Test the build: npm run build');
console.log('2. If build succeeds, manually update Prisma usage in each route');
console.log('3. Replace: prisma.model.operation() with: await modelQueries.operation()');

console.log('\n🔍 Example replacements:');
console.log('  prisma.customer.findMany() → await customerQueries.findMany()');
console.log('  prisma.product.create() → await productQueries.create()');
