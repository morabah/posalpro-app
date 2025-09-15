#!/usr/bin/env node

/**
 * Fix Edge Runtime Issues - Add Node.js runtime to API routes
 *
 * This script adds `export const runtime = 'nodejs';` to all API routes
 * that use Prisma or service layers to prevent Edge Function conflicts.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all route.ts files that use Prisma or services
const findRouteFiles = () => {
  try {
    const output = execSync(
      'find src/app -name "route.ts" | xargs grep -l "prisma\\|@prisma/client\\|customerService\\|productService\\|proposalService\\|adminService"',
      { encoding: 'utf8' }
    );
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.log('No route files found with Prisma/services');
    return [];
  }
};

// Check if file already has runtime declaration
const hasRuntimeDeclaration = (content) => {
  return content.includes('export const runtime') || content.includes('runtime =');
};

// Add Node.js runtime declaration
const addNodeRuntime = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    if (hasRuntimeDeclaration(content)) {
      console.log(`✅ ${filePath} - Already has runtime declaration`);
      return false;
    }

    // Find the first import or comment after the header
    const lines = content.split('\n');
    let insertIndex = 0;

    // Find where to insert the runtime declaration
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Insert after the main comment block
      if (line.includes('*/') && i < lines.length - 1) {
        insertIndex = i + 1;
        break;
      }
      // Or after the first import
      if (line.startsWith('import ') && insertIndex === 0) {
        insertIndex = i;
        break;
      }
    }

    // Insert the runtime declaration
    const runtimeDeclaration = [
      '',
      '// Force Node.js runtime to avoid Edge Function conflicts with Prisma',
      "export const runtime = 'nodejs';",
      ''
    ];

    lines.splice(insertIndex, 0, ...runtimeDeclaration);

    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`✅ ${filePath} - Added Node.js runtime`);
    return true;
  } catch (error) {
    console.error(`❌ ${filePath} - Error: ${error.message}`);
    return false;
  }
};

// Main execution
const main = () => {
  console.log('🔍 Finding API routes that need Node.js runtime...');

  const routeFiles = findRouteFiles();

  if (routeFiles.length === 0) {
    console.log('No route files found that need runtime configuration');
    return;
  }

  console.log(`Found ${routeFiles.length} route files:`);
  routeFiles.forEach(file => console.log(`  - ${file}`));

  console.log('\n🔧 Adding Node.js runtime declarations...');

  let modifiedCount = 0;
  routeFiles.forEach(file => {
    if (addNodeRuntime(file)) {
      modifiedCount++;
    }
  });

  console.log(`\n✅ Modified ${modifiedCount} files`);
  console.log('🎯 All API routes now explicitly use Node.js runtime');
};

main();
