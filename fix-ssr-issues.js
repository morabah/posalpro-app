#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/proposals/create/page.tsx',
  'src/app/(dashboard)/profile/page.tsx',
  'src/app/(dashboard)/products/page.tsx',
  'src/app/(dashboard)/customers/page.tsx',
  'src/app/performance/mobile/page.tsx'
];

console.log('🔧 Fixing SSR issues for Next.js 15 compatibility...\n');

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`📝 Fixing ${filePath}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove ssr: false lines and their preceding commas
    content = content.replace(/,\s*ssr:\s*false/g, '');
    content = content.replace(/ssr:\s*false,?\s*/g, '');
    
    // Clean up any trailing commas in dynamic imports
    content = content.replace(/,(\s*})\s*\);/g, '$1);');
    
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Fixed ${filePath}`);
  } else {
    console.log(`   ⚠️ File not found: ${filePath}`);
  }
});

console.log('\n🎉 All SSR issues fixed!');
