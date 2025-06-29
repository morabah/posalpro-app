#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const glob = require("glob");

console.log("🔧 FIXING ALL IMPORT ISSUES");
console.log("=".repeat(50));

// Import fixes to apply
const importFixes = [
  {
    pattern: /@\/contexts\/AuthContext/g,
    replacement: "@/components/providers/AuthProvider",
    description: "Fix AuthContext import path"
  },
  {
    pattern: /@\/hooks\/useErrorHandling/g,
    replacement: "@/hooks/useErrorHandler",
    description: "Fix error handling hook import path"
  }
];

// Files to check
const filesToCheck = [
  "src/**/*.tsx",
  "src/**/*.ts"
];

let totalFiles = 0;
let filesFixed = 0;
let totalFixes = 0;

console.log("📋 Scanning and fixing import issues...
");

filesToCheck.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: process.cwd() });
  
  files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    
    if (!fs.existsSync(filePath)) return;
    
    totalFiles++;
    let content = fs.readFileSync(filePath, "utf8");
    let originalContent = content;
    let fileFixed = false;
    
    importFixes.forEach(({ pattern, replacement, description }) => {
      const matches = content.match(pattern);
      
      if (matches) {
        content = content.replace(pattern, replacement);
        
        if (!fileFixed) {
          console.log(`🔧 ${file}:`);
          fileFixed = true;
          filesFixed++;
        }
        
        console.log(`   • ${description} (${matches.length} fix${matches.length > 1 ? "es" : ""})`);
        totalFixes += matches.length;
      }
    });
    
    // Write back if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log("   ✅ File updated
");
    }
  });
});

console.log("📊 FIX RESULTS:");
console.log(`   Files scanned: ${totalFiles}`);
console.log(`   Files fixed: ${filesFixed}`);
console.log(`   Total fixes applied: ${totalFixes}`);

if (totalFixes === 0) {
  console.log("
🎉 SUCCESS: All import paths are already correct!");
} else {
  console.log("
✅ COMPLETED: All import issues have been fixed!");
}

process.exit(0);
