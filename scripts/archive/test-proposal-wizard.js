#!/usr/bin/env node

/**
 * ProposalWizard Validation Test Script
 * Tests ProposalWizard component functionality without browser
 * Validates data transformation, API calls, error handling, and state management
 *
 * Usage: node scripts/test-proposal-wizard.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 ProposalWizard Validation Test Suite');
console.log('=====================================\n');

// Test configuration
const TEST_CONFIG = {
  testFile: 'test/proposal-wizard-validation.test.ts',
  timeout: 30000, // 30 seconds
  verbose: true,
};

// Test categories
const TEST_CATEGORIES = [
  {
    name: 'Data Transformation',
    description: 'Validates wizard data transformation to API schema',
    tests: [
      'should transform wizard data to match API schema',
      'should handle missing optional fields correctly',
    ],
  },
  {
    name: 'Validation',
    description: 'Validates form field validation logic',
    tests: [
      'should validate required fields correctly',
      'should validate customer ID format correctly',
    ],
  },
  {
    name: 'API Integration',
    description: 'Validates API call functionality',
    tests: [
      'should make correct API call with transformed data',
      'should handle API errors correctly',
      'should handle validation errors from API',
    ],
  },
  {
    name: 'State Management',
    description: 'Validates component state management',
    tests: ['should handle step navigation correctly', 'should validate step data correctly'],
  },
  {
    name: 'Error Handling',
    description: 'Validates error handling mechanisms',
    tests: [
      'should process errors through ErrorHandlingService',
      'should provide user-friendly error messages',
    ],
  },
  {
    name: 'Data Persistence',
    description: 'Validates localStorage operations',
    tests: ['should handle localStorage operations correctly'],
  },
  {
    name: 'Performance',
    description: 'Validates performance optimizations',
    tests: ['should debounce updates correctly'],
  },
  {
    name: 'Component Integration',
    description: 'Validates component integration',
    tests: [
      'should pass correct props to step components',
      'should handle step component lazy loading',
    ],
  },
];

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix =
    type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function checkPrerequisites() {
  log('Checking prerequisites...');

  // Check if test file exists
  if (!fs.existsSync(TEST_CONFIG.testFile)) {
    log(`Test file not found: ${TEST_CONFIG.testFile}`, 'error');
    return false;
  }

  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    log('package.json not found', 'error');
    return false;
  }

  // Check if jest is available
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!packageJson.scripts || !packageJson.scripts.test) {
      log('Jest test script not found in package.json', 'error');
      return false;
    }
  } catch (error) {
    log('Failed to read package.json', 'error');
    return false;
  }

  log('Prerequisites check passed', 'success');
  return true;
}

function runTests() {
  log('Running ProposalWizard validation tests...');

  try {
    const command = `npm test -- ${TEST_CONFIG.testFile}`;
    const result = execSync(command, {
      encoding: 'utf8',
      timeout: TEST_CONFIG.timeout,
      stdio: 'pipe',
    });

    log('Tests completed successfully', 'success');
    return { success: true, output: result };
  } catch (error) {
    log('Tests failed', 'error');
    return { success: false, output: error.stdout || error.message };
  }
}

function analyzeResults(testOutput) {
  log('Analyzing test results...');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    categories: {},
  };

  // Parse test output
  const lines = testOutput.split('\n');
  let currentCategory = '';

  lines.forEach(line => {
    // Count total tests
    if (line.includes('Tests:')) {
      const match = line.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed/);
      if (match) {
        results.passed = parseInt(match[1]);
        results.failed = parseInt(match[2]);
        results.total = results.passed + results.failed;
      }
    }

    // Track test categories
    TEST_CATEGORIES.forEach(category => {
      category.tests.forEach(test => {
        if (line.includes(test)) {
          if (!results.categories[category.name]) {
            results.categories[category.name] = { passed: 0, failed: 0, total: 0 };
          }
          results.categories[category.name].total++;

          if (line.includes('✓')) {
            results.categories[category.name].passed++;
          } else if (line.includes('✕')) {
            results.categories[category.name].failed++;
          }
        }
      });
    });
  });

  return results;
}

function generateReport(results) {
  log('Generating test report...');

  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  console.log('\n📋 Category Breakdown');
  console.log('====================');

  Object.entries(results.categories).forEach(([category, stats]) => {
    const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
    const status = stats.failed === 0 ? '✅' : '❌';
    console.log(`${status} ${category}: ${stats.passed}/${stats.total} (${successRate}%)`);
  });

  console.log('\n🔍 Key Validation Areas');
  console.log('=======================');

  TEST_CATEGORIES.forEach(category => {
    const stats = results.categories[category.name] || { passed: 0, total: 0 };
    const status = stats.total > 0 && stats.passed === stats.total ? '✅' : '❌';
    console.log(`${status} ${category.name}: ${category.description}`);
  });
}

function generateRecommendations(results) {
  console.log('\n💡 Recommendations');
  console.log('==================');

  if (results.failed === 0) {
    console.log('✅ All tests passed! ProposalWizard is functioning correctly.');
    console.log('✅ Data transformation is working properly.');
    console.log('✅ API integration is functioning.');
    console.log('✅ Error handling is robust.');
    console.log('✅ State management is stable.');
  } else {
    console.log('⚠️  Some tests failed. Please review the following areas:');

    Object.entries(results.categories).forEach(([category, stats]) => {
      if (stats.failed > 0) {
        console.log(`❌ ${category}: ${stats.failed} test(s) failed`);

        // Provide specific recommendations based on category
        switch (category) {
          case 'Data Transformation':
            console.log('   - Check API schema compatibility');
            console.log('   - Verify data field mapping');
            break;
          case 'Validation':
            console.log('   - Review form validation logic');
            console.log('   - Check required field handling');
            break;
          case 'API Integration':
            console.log('   - Verify API endpoint configuration');
            console.log('   - Check error response handling');
            break;
          case 'State Management':
            console.log('   - Review component state updates');
            console.log('   - Check step navigation logic');
            break;
          case 'Error Handling':
            console.log('   - Verify ErrorHandlingService integration');
            console.log('   - Check user-friendly error messages');
            break;
        }
      }
    });
  }
}

function main() {
  console.log('🚀 Starting ProposalWizard Validation Test Suite\n');

  // Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1);
  }

  // Run tests
  const testResult = runTests();

  if (!testResult.success) {
    log('Test execution failed', 'error');
    console.log('\nTest Output:');
    console.log(testResult.output);
    process.exit(1);
  }

  // Analyze results
  const results = analyzeResults(testResult.output);

  // Generate report
  generateReport(results);

  // Generate recommendations
  generateRecommendations(results);

  console.log('\n🎯 Test Summary');
  console.log('===============');
  if (results.failed === 0) {
    log('All ProposalWizard tests passed! Component is ready for production use.', 'success');
    process.exit(0);
  } else {
    log(
      `${results.failed} test(s) failed. Please review and fix issues before deployment.`,
      'error'
    );
    process.exit(1);
  }
}

// Run the test suite
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  runTests,
  analyzeResults,
  generateReport,
  generateRecommendations,
};
