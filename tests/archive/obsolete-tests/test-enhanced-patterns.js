#!/usr/bin/env node

/**
 * Test Enhanced Intelligent Pattern Detection
 * Tests the improved regex patterns for bridge compliance verification
 */

// Test the enhanced 'any' type detection pattern (fixed)
const NO_ANY_TYPES = /:\s*any(?!\w)|as\s+any(?!\w)|any\s*\[|any\s*</;

const testCases = [
  // Should NOT match (false positives to avoid)
  { code: 'const company = "any string here";', shouldMatch: false, desc: 'string containing any' },
  { code: 'const manager = "any manager";', shouldMatch: false, desc: 'string containing any' },
  { code: 'const anyVar = getValue();', shouldMatch: false, desc: 'variable name starting with any' },
  { code: 'company.anyMethod();', shouldMatch: false, desc: 'method name starting with any' },
  
  // Should match (actual TypeScript any type usage)
  { code: 'const data: any = someValue;', shouldMatch: true, desc: 'type annotation' },
  { code: 'const result = something as any;', shouldMatch: true, desc: 'type assertion' },
  { code: 'const items: any[] = [];', shouldMatch: true, desc: 'array type' },
  { code: 'function test(param: any) {}', shouldMatch: true, desc: 'parameter type' },
  { code: 'const obj: any<string> = {};', shouldMatch: true, desc: 'generic type' }
];

console.log('🧪 Testing Enhanced "any" Type Detection');
console.log('='.repeat(50));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, i) => {
  const matches = NO_ANY_TYPES.test(testCase.code);
  const success = matches === testCase.shouldMatch;
  
  console.log(`\n${i + 1}. ${testCase.desc}`);
  console.log(`   Code: ${testCase.code}`);
  console.log(`   Expected: ${testCase.shouldMatch ? 'MATCH' : 'NO MATCH'}`);
  console.log(`   Actual: ${matches ? 'MATCH' : 'NO MATCH'}`);
  console.log(`   Result: ${success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (success) passed++;
  else failed++;
});

console.log(`\n📊 Test Results:`);
console.log(`✅ Passed: ${passed}/${testCases.length}`);
console.log(`❌ Failed: ${failed}/${testCases.length}`);
console.log(`🎯 Success Rate: ${Math.round((passed/testCases.length)*100)}%`);

// Test functional detection patterns
console.log('\n' + '='.repeat(50));
console.log('🔍 Testing Functional Detection Patterns');

const functionalTests = [
  {
    name: 'Analytics Tracking',
    pattern: /analytics\s*\(|\.track\s*\(|trackOptimized\s*\(/,
    goodCode: 'analytics("event", data); trackOptimized("event", data);',
    badCode: 'const analytics = "tracking system";'
  },
  {
    name: 'RBAC Validation',
    pattern: /validateApiPermission\s*\(|checkPermission\s*\(|hasPermission\s*\(/,
    goodCode: 'await validateApiPermission(user, action);',
    badCode: 'const permission = "validate user access";'
  },
  {
    name: 'Error Handling',
    pattern: /processError\s*\(|handleError\s*\(|ErrorHandlingService/,
    goodCode: 'ErrorHandlingService.processError(error);',
    badCode: 'const errorMessage = "handle this error";'
  }
];

functionalTests.forEach(test => {
  const goodMatch = test.pattern.test(test.goodCode);
  const badMatch = test.pattern.test(test.badCode);
  
  console.log(`\n📋 ${test.name}:`);
  console.log(`   Pattern: ${test.pattern}`);
  console.log(`   Good Code: "${test.goodCode}" → ${goodMatch ? '✅' : '❌'}`);
  console.log(`   Bad Code: "${test.badCode}" → ${badMatch ? '❌' : '✅'}`);
  console.log(`   Status: ${goodMatch && !badMatch ? '✅ CORRECT' : '❌ NEEDS IMPROVEMENT'}`);
});

console.log('\n🎉 Enhanced Pattern Detection Test Complete!');
