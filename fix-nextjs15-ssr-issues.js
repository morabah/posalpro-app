#!/usr/bin/env node

/**
 * PosalPro MVP2 - Fix Next.js 15 SSR Compatibility Issues
 * Removes `ssr: false` options that are not allowed in Server Components in Next.js 15
 * Based on server error analysis and Next.js 15 migration requirements
 */

const fs = require('fs');
const path = require('path');

const FILES_TO_FIX = [
  'src/app/(dashboard)/dashboard/page.tsx',
  'src/app/(dashboard)/products/page.tsx',
  'src/app/(dashboard)/customers/page.tsx',
  'src/app/(dashboard)/profile/page.tsx',
  'src/app/(dashboard)/proposals/create/page.tsx',
  'src/app/performance/mobile/page.tsx',
];

function fixSSRIssues() {
  console.log('🔧 Fixing Next.js 15 SSR Compatibility Issues...\n');

  let totalFixes = 0;

  FILES_TO_FIX.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      console.log(`📝 Processing: ${filePath}`);

      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;

      // Remove ssr: false from dynamic imports
      content = content.replace(/,\s*ssr:\s*false/g, '');
      content = content.replace(/ssr:\s*false,?\s*/g, '');

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`   ✅ Fixed SSR issues in ${filePath}`);
        totalFixes++;
      } else {
        console.log(`   ℹ️ No SSR issues found in ${filePath}`);
      }
    } else {
      console.log(`   ⚠️ File not found: ${filePath}`);
    }
  });

  console.log(`\n🎉 Fixed SSR issues in ${totalFixes} files`);
  console.log('✅ Next.js 15 compatibility restored');
}

fixSSRIssues();
