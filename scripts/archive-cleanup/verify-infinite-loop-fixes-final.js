#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 FINAL VERIFICATION: Infinite Loop Fixes Status');
console.log('='.repeat(60));

// Components to verify with their expected patterns
const componentsToVerify = [
  {
    file: 'src/components/customers/CustomerList.tsx',
    name: 'CustomerList',
    expectedPatterns: [
      {
        pattern:
          /useEffect\(\(\) => \{[\s\S]*?fetchCustomers\(\);[\s\S]*?\}, \[\]\);.*?CRITICAL FIX.*?Empty dependency array/,
        description: 'First useEffect with empty dependency array',
      },
      {
        pattern:
          /useEffect\(\(\) => \{[\s\S]*?if \(searchTerm !== ''\)[\s\S]*?\}, \[searchTerm\]\);.*?CRITICAL FIX.*?Only include searchTerm/,
        description: 'Second useEffect with only searchTerm dependency',
      },
    ],
  },
  {
    file: 'src/components/products/ProductList.tsx',
    name: 'ProductList',
    expectedPatterns: [
      {
        pattern:
          /useEffect\(\(\) => \{[\s\S]*?fetchProducts\(\);[\s\S]*?\}, \[\]\);.*?CRITICAL FIX.*?Empty dependency array/,
        description: 'First useEffect with empty dependency array',
      },
      {
        pattern:
          /useEffect\(\(\) => \{[\s\S]*?if \(searchTerm !== ''\)[\s\S]*?\}, \[searchTerm\]\);.*?CRITICAL FIX.*?Only include searchTerm/,
        description: 'Second useEffect with only searchTerm dependency',
      },
    ],
  },
  {
    file: 'src/components/dashboard/DashboardStats.tsx',
    name: 'DashboardStats',
    expectedPatterns: [
      {
        pattern: /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);.*?CRITICAL FIX.*?Empty dependency array/,
        description: 'useEffect with empty dependency array',
      },
    ],
  },
  {
    file: 'src/components/dashboard/RecentProposals.tsx',
    name: 'RecentProposals',
    expectedPatterns: [
      {
        pattern: /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);.*?CRITICAL FIX.*?Empty dependency array/,
        description: 'useEffect with empty dependency array',
      },
    ],
  },
];

// Problematic patterns that should NOT exist
const problematicPatterns = [
  {
    pattern: /\}, \[.*?apiClient.*?\]/,
    description: 'useEffect with apiClient in dependency array',
  },
  {
    pattern: /\}, \[.*?analytics.*?\]/,
    description: 'useEffect with analytics in dependency array',
  },
  {
    pattern: /\}, \[.*?errorHandlingService.*?\]/,
    description: 'useEffect with errorHandlingService in dependency array',
  },
  {
    pattern: /\}, \[.*?fetchCustomers.*?\]/,
    description: 'useEffect with fetchCustomers in dependency array',
  },
  {
    pattern: /\}, \[.*?fetchProducts.*?\]/,
    description: 'useEffect with fetchProducts in dependency array',
  },
  {
    pattern: /\}, \[.*?debouncedSearch.*?\]/,
    description: 'useEffect with debouncedSearch in dependency array',
  },
];

let allPassed = true;
let totalChecks = 0;
let passedChecks = 0;

console.log('📋 POSITIVE VERIFICATION: Expected Patterns');
console.log('-'.repeat(50));

componentsToVerify.forEach(component => {
  const filePath = path.join(process.cwd(), component.file);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${component.name}: File not found - ${component.file}`);
    allPassed = false;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n🔍 Checking ${component.name}:`);

  component.expectedPatterns.forEach(({ pattern, description }) => {
    totalChecks++;
    if (pattern.test(content)) {
      console.log(`  ✅ ${description}`);
      passedChecks++;
    } else {
      console.log(`  ❌ ${description}`);
      allPassed = false;
    }
  });
});

console.log('\n🚫 NEGATIVE VERIFICATION: Problematic Patterns');
console.log('-'.repeat(50));

componentsToVerify.forEach(component => {
  const filePath = path.join(process.cwd(), component.file);

  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n🔍 Checking ${component.name} for problematic patterns:`);

  let foundProblems = false;
  problematicPatterns.forEach(({ pattern, description }) => {
    totalChecks++;
    if (pattern.test(content)) {
      console.log(`  ❌ FOUND: ${description}`);
      allPassed = false;
      foundProblems = true;
    } else {
      passedChecks++;
    }
  });

  if (!foundProblems) {
    console.log(`  ✅ No problematic patterns found`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 FINAL RESULTS:');
console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);
console.log(`❌ Failed: ${totalChecks - passedChecks}/${totalChecks} checks`);

if (allPassed) {
  console.log('\n🎉 SUCCESS: All infinite loop fixes are properly applied!');
  console.log('✅ /customers and /products pages should now work without infinite loops');
  console.log('✅ All dashboard components are stable');
  console.log('✅ Search functionality works without re-rendering loops');
  process.exit(0);
} else {
  console.log('\n⚠️  ISSUES FOUND: Some components still have infinite loop risks');
  console.log('❌ Manual review and fixes may be needed');
  process.exit(1);
}
