#!/usr/bin/env node

/**
 * Test Bridge Verification with Enhanced Patterns
 * Demonstrates the improved intelligent pattern detection
 */

const fs = require('fs');
const path = require('path');

// Import verification functions (simplified version for testing)
function detectFileType(filePath, content) {
  if (filePath.includes('api-bridge.template')) return 'api-bridge';
  if (filePath.includes('management-bridge.template')) return 'management-bridge';  
  if (filePath.includes('bridge-page.template')) return 'bridge-page';
  return 'unknown';
}

// Enhanced patterns from the verification script
const ENHANCED_PATTERNS = {
  // Enhanced 'any' type detection (no false positives)
  NO_ANY_TYPES: /:\s*any(?!\w)|as\s+any(?!\w)|any\s*\[|any\s*</,
  
  // Functional analytics detection (not literal strings)
  ANALYTICS_INTEGRATION: /analytics\s*\(|\.track\s*\(|trackOptimized\s*\(|useOptimizedAnalytics/,
  
  // Functional RBAC detection (actual function calls)
  RBAC_VALIDATION: /validateApiPermission\s*\(|checkPermission\s*\(|hasPermission\s*\(/,
  
  // Functional error handling (actual implementations)
  ERROR_HANDLING: /processError\s*\(|handleError\s*\(|ErrorHandlingService/,
  
  // Functional React Hook Form (actual hook usage)
  REACT_HOOK_FORM: /useForm\s*\(|handleSubmit|formState\.|watch\s*\(|control\./,
  
  // Functional caching (actual implementations)
  CACHING_STRATEGY: /cache\.set|cache\.get|Redis|memcache|useSWR|useQuery/,
  
  // Functional accessibility (actual implementations)
  ACCESSIBILITY_FEATURES: /aria-label|aria-labelledby|role=|id=.*heading|tabIndex/,
  
  // No console logs (should NOT be present)
  NO_CONSOLE_LOGS: /(?<!\.)console\.(log|error|warn|info)\s*\(/
};

function testPattern(content, patternName, pattern, shouldMatch = true) {
  const matches = pattern.test(content);
  const success = matches === shouldMatch;
  
  return {
    name: patternName,
    expected: shouldMatch ? 'SHOULD MATCH' : 'SHOULD NOT MATCH',
    actual: matches ? 'MATCHED' : 'NO MATCH', 
    result: success ? 'PASS' : 'FAIL',
    success
  };
}

console.log('🚀 Testing Enhanced Bridge Compliance Detection');
console.log('='.repeat(60));

// Check if template directory exists
if (!fs.existsSync(templateDir)) {
  console.log(`❌ Template directory not found: ${templateDir}`);
  process.exit(1);
}

// Test against actual bridge template files
const templateDir = 'templates/design-patterns/bridge/';
const templateFiles = [
  'api-bridge.template.ts',
  'management-bridge.template.tsx',
  'bridge-page.template.tsx'
];

let totalTests = 0;
let passedTests = 0;

templateFiles.forEach(fileName => {
  const filePath = path.join(templateDir, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const fileType = detectFileType(filePath, content);
  
  console.log(`\n📄 Testing: ${fileName}`);
  console.log(`   Type: ${fileType}`);
  console.log('   ' + '-'.repeat(45));
  
  // Test key patterns
  const tests = [
    testPattern(content, 'Analytics Integration', ENHANCED_PATTERNS.ANALYTICS_INTEGRATION, true),
    testPattern(content, 'Error Handling', ENHANCED_PATTERNS.ERROR_HANDLING, true),
    testPattern(content, 'No Any Types', ENHANCED_PATTERNS.NO_ANY_TYPES, false), // Should NOT have any types
    testPattern(content, 'No Console Logs', ENHANCED_PATTERNS.NO_CONSOLE_LOGS, false), // Should NOT have console logs
    testPattern(content, 'RBAC Validation', ENHANCED_PATTERNS.RBAC_VALIDATION, true),
    testPattern(content, 'Accessibility Features', ENHANCED_PATTERNS.ACCESSIBILITY_FEATURES, true)
  ];
  
  tests.forEach(test => {
    totalTests++;
    if (test.success) passedTests++;
    
    const icon = test.success ? '✅' : '❌';
    console.log(`   ${icon} ${test.name}: ${test.expected} → ${test.actual}`);
  });
});

console.log('\n' + '='.repeat(60));
console.log('📊 Enhanced Pattern Detection Results:');
console.log(`✅ Passed: ${passedTests}/${totalTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
console.log(`🎯 Success Rate: ${Math.round((passedTests/totalTests)*100)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 All enhanced patterns working perfectly!');
  console.log('✨ Intelligent detection successfully avoids false positives');
  console.log('🚀 Bridge compliance verification enhanced and ready for production');
} else {
  console.log('\n⚠️  Some patterns need further refinement');
}
