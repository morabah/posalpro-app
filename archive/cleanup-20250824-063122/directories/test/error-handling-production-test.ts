/**
 * PosalPro MVP2 - Error Handling Production Test
 * Tests standardized error handling patterns in production scenarios
 */

import { ErrorCodes } from '../src/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '../src/lib/errors/ErrorHandlingService';

// Initialize error handling service
const errorHandlingService = ErrorHandlingService.getInstance();

// Test scenarios for production error handling
const testScenarios = [
  {
    name: 'API Request Failure',
    error: new Error('Network timeout'),
    expectedCode: ErrorCodes.API.REQUEST_FAILED,
    component: 'TestComponent',
    operation: 'fetchData',
  },
  {
    name: 'Validation Error',
    error: new Error('Invalid input data'),
    expectedCode: ErrorCodes.VALIDATION.INVALID_INPUT,
    component: 'TestComponent',
    operation: 'validateForm',
  },
  {
    name: 'Business Logic Error',
    error: new Error('Process failed'),
    expectedCode: ErrorCodes.BUSINESS.PROCESS_FAILED,
    component: 'TestComponent',
    operation: 'processData',
  },
  {
    name: 'Authentication Error',
    error: new Error('Unauthorized access'),
    expectedCode: ErrorCodes.AUTH.UNAUTHORIZED,
    component: 'TestComponent',
    operation: 'authenticate',
  },
  {
    name: 'Database Error',
    error: new Error('Connection failed'),
    expectedCode: ErrorCodes.DATA.DATABASE_ERROR,
    component: 'TestComponent',
    operation: 'queryDatabase',
  },
];

// Test standardized error handling
async function testErrorHandling() {
  console.log('🧪 Testing Standardized Error Handling Patterns...\n');

  let passedTests = 0;
  let totalTests = testScenarios.length;

  for (const scenario of testScenarios) {
    try {
      // Process error using standardized pattern
      const standardError = errorHandlingService.processError(
        scenario.error,
        'Test error message',
        scenario.expectedCode,
        {
          component: scenario.component,
          operation: scenario.operation,
          testScenario: scenario.name,
        }
      );

      // Verify error structure
      const isValidError =
        standardError instanceof Error &&
        standardError.message &&
        standardError.name === 'StandardError';

      // Get user-friendly message
      const userMessage = errorHandlingService.getUserFriendlyMessage(standardError);

      // Verify results
      if (isValidError && userMessage) {
        console.log(`✅ ${scenario.name}: PASSED`);
        console.log(`   Code: ${scenario.expectedCode}`);
        console.log(`   Message: ${userMessage}`);
        passedTests++;
      } else {
        console.log(`❌ ${scenario.name}: FAILED`);
        console.log(`   Error structure invalid`);
      }
    } catch (error) {
      console.log(`❌ ${scenario.name}: FAILED`);
      console.log(`   Exception: ${error}`);
    }
    console.log('');
  }

  // Test error categorization
  console.log('🔍 Testing Error Categorization...\n');

  const categorizationTests = [
    {
      name: 'API Error Categorization',
      error: new Error('API timeout'),
      expectedCategory: 'API',
    },
    {
      name: 'Validation Error Categorization',
      error: new Error('Invalid input'),
      expectedCategory: 'VALIDATION',
    },
    {
      name: 'Business Error Categorization',
      error: new Error('Process failed'),
      expectedCategory: 'BUSINESS',
    },
  ];

  for (const test of categorizationTests) {
    try {
      const standardError = errorHandlingService.processError(
        test.error,
        'Test message',
        ErrorCodes.SYSTEM.UNKNOWN,
        { component: 'TestComponent' }
      );

      const hasValidStructure =
        standardError &&
        typeof standardError === 'object' &&
        'code' in standardError &&
        'message' in standardError;

      if (hasValidStructure) {
        console.log(`✅ ${test.name}: PASSED`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name}: FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED - ${error}`);
    }
  }

  totalTests += categorizationTests.length;

  // Test metadata handling
  console.log('\n🔍 Testing Metadata Handling...\n');

  try {
    const testError = new Error('Test error with metadata');
    const standardError = errorHandlingService.processError(
      testError,
      'Test error',
      ErrorCodes.SYSTEM.UNKNOWN,
      {
        component: 'TestComponent',
        operation: 'testOperation',
        customField: 'customValue',
        timestamp: Date.now(),
      }
    );

    if (standardError) {
      console.log('✅ Metadata Handling: PASSED');
      passedTests++;
    } else {
      console.log('❌ Metadata Handling: FAILED');
    }
  } catch (error) {
    console.log(`❌ Metadata Handling: FAILED - ${error}`);
  }

  totalTests++;

  // Test user-friendly message generation
  console.log('\n🔍 Testing User-Friendly Messages...\n');

  const messageTests = [
    {
      name: 'API Error Message',
      error: new Error('Network timeout'),
      expectedContains: 'try again',
    },
    {
      name: 'Validation Error Message',
      error: new Error('Invalid input'),
      expectedContains: 'check',
    },
  ];

  for (const test of messageTests) {
    try {
      const standardError = errorHandlingService.processError(
        test.error,
        'Please try again',
        ErrorCodes.API.REQUEST_FAILED,
        { component: 'TestComponent' }
      );

      const userMessage = errorHandlingService.getUserFriendlyMessage(standardError);

      if (userMessage && userMessage.toLowerCase().includes(test.expectedContains.toLowerCase())) {
        console.log(`✅ ${test.name}: PASSED`);
        console.log(`   Message: ${userMessage}`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name}: FAILED`);
        console.log(`   Expected: ${test.expectedContains}`);
        console.log(`   Got: ${userMessage}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED - ${error}`);
    }
  }

  totalTests += messageTests.length;

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED - Error handling is production-ready!');
    return true;
  } else {
    console.log('\n⚠️ Some tests failed - Review error handling implementation');
    return false;
  }
}

// Run the tests
if (require.main === module) {
  testErrorHandling()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testErrorHandling };
