/**
 * PosalPro MVP2 - Phase 2.2.4: API Endpoint Validation
 * Tests API endpoints via HTTP calls to validate data integrity and type consistency
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

/**
 * Test helper functions
 */
const log = (message: string) => {
  console.log(`🔍 ${message}`);
};

const logSuccess = (message: string) => {
  console.log(`✅ ${message}`);
};

const logError = (message: string, error?: any) => {
  console.error(`❌ ${message}`);
  if (error) {
    console.error(error);
  }
};

const logSection = (title: string) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${title}`);
  console.log(`${'='.repeat(60)}`);
};

/**
 * HTTP request helper
 */
async function makeRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<{ ok: boolean; data: any; status: number }> {
  try {
    const url = `${BASE_URL}/api${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    return {
      ok: response.ok,
      data,
      status: response.status,
    };
  } catch (error) {
    throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test 1: API Endpoint Availability
 */
async function testEndpointAvailability(): Promise<TestResult[]> {
  logSection('API ENDPOINT AVAILABILITY');

  const endpoints = [
    { path: '/proposals', method: 'GET' as const },
    { path: '/customers', method: 'GET' as const },
    { path: '/products', method: 'GET' as const },
    { path: '/content', method: 'GET' as const },
  ];

  const results: TestResult[] = [];

  for (const endpoint of endpoints) {
    try {
      log(`Testing ${endpoint.method} ${endpoint.path}...`);
      const result = await makeRequest(endpoint.path, endpoint.method);

      if (result.ok) {
        logSuccess(`${endpoint.method} ${endpoint.path} - Available`);
        results.push({
          name: `${endpoint.method} ${endpoint.path}`,
          passed: true,
          details: { status: result.status },
        });
      } else {
        logError(`${endpoint.method} ${endpoint.path} - Failed`, result.data);
        results.push({
          name: `${endpoint.method} ${endpoint.path}`,
          passed: false,
          error: `Status: ${result.status}`,
          details: result.data,
        });
      }
    } catch (error) {
      logError(`${endpoint.method} ${endpoint.path} - Error`, error);
      results.push({
        name: `${endpoint.method} ${endpoint.path}`,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Test 2: Customer API CRUD
 */
async function testCustomerAPI(): Promise<TestResult[]> {
  logSection('CUSTOMER API CRUD TESTING');

  const results: TestResult[] = [];
  let customerId: string | null = null;

  try {
    // CREATE Customer
    log('Testing POST /customers - Create customer...');
    const createData = {
      name: 'API Test Customer',
      email: 'apitest@example.com',
      phone: '+1-555-9999',
      website: 'https://apitest.com',
      industry: 'Testing',
      tier: 'STANDARD',
    };

    const createResult = await makeRequest('/customers', 'POST', createData);

    if (createResult.ok && createResult.data.success) {
      customerId = createResult.data.data.id;
      logSuccess('Customer creation successful');
      results.push({
        name: 'POST /customers',
        passed: true,
        details: { id: customerId },
      });
    } else {
      throw new Error(`Create failed: ${JSON.stringify(createResult.data)}`);
    }

    // READ Customer
    if (customerId) {
      log(`Testing GET /customers/${customerId} - Get customer...`);
      const getResult = await makeRequest(`/customers/${customerId}`);

      if (getResult.ok && getResult.data.success) {
        logSuccess('Customer retrieval successful');
        results.push({
          name: 'GET /customers/[id]',
          passed: true,
          details: { name: getResult.data.data.name },
        });
      } else {
        throw new Error(`Get failed: ${JSON.stringify(getResult.data)}`);
      }

      // UPDATE Customer
      log(`Testing PUT /customers/${customerId} - Update customer...`);
      const updateData = {
        revenue: 1000000,
        tier: 'PREMIUM',
      };

      const updateResult = await makeRequest(`/customers/${customerId}`, 'PUT', updateData);

      if (updateResult.ok && updateResult.data.success) {
        logSuccess('Customer update successful');
        results.push({
          name: 'PUT /customers/[id]',
          passed: true,
          details: { tier: updateResult.data.data.tier },
        });
      } else {
        throw new Error(`Update failed: ${JSON.stringify(updateResult.data)}`);
      }

      // DELETE Customer (cleanup)
      log(`Testing DELETE /customers/${customerId} - Delete customer...`);
      const deleteResult = await makeRequest(`/customers/${customerId}`, 'DELETE');

      if (deleteResult.ok && deleteResult.data.success) {
        logSuccess('Customer deletion successful');
        results.push({
          name: 'DELETE /customers/[id]',
          passed: true,
        });
      } else {
        throw new Error(`Delete failed: ${JSON.stringify(deleteResult.data)}`);
      }
    }
  } catch (error) {
    logError('Customer API test failed', error);
    results.push({
      name: 'Customer API CRUD',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return results;
}

/**
 * Test 3: Product API CRUD
 */
async function testProductAPI(): Promise<TestResult[]> {
  logSection('PRODUCT API CRUD TESTING');

  const results: TestResult[] = [];
  let productId: string | null = null;

  try {
    // CREATE Product
    log('Testing POST /products - Create product...');
    const createData = {
      name: 'API Test Product',
      sku: 'API-TEST-001',
      price: 99.99,
      currency: 'USD',
      category: ['testing'],
      tags: ['api', 'test'],
    };

    const createResult = await makeRequest('/products', 'POST', createData);

    if (createResult.ok && createResult.data.success) {
      productId = createResult.data.data.id;
      logSuccess('Product creation successful');
      results.push({
        name: 'POST /products',
        passed: true,
        details: { id: productId, sku: createResult.data.data.sku },
      });
    } else {
      throw new Error(`Create failed: ${JSON.stringify(createResult.data)}`);
    }

    // READ Product
    if (productId) {
      log(`Testing GET /products/${productId} - Get product...`);
      const getResult = await makeRequest(`/products/${productId}`);

      if (getResult.ok && getResult.data.success) {
        logSuccess('Product retrieval successful');
        results.push({
          name: 'GET /products/[id]',
          passed: true,
          details: { name: getResult.data.data.name },
        });
      } else {
        throw new Error(`Get failed: ${JSON.stringify(getResult.data)}`);
      }

      // UPDATE Product
      log(`Testing PUT /products/${productId} - Update product...`);
      const updateData = {
        price: 149.99,
        tags: ['api', 'test', 'updated'],
      };

      const updateResult = await makeRequest(`/products/${productId}`, 'PUT', updateData);

      if (updateResult.ok && updateResult.data.success) {
        logSuccess('Product update successful');
        results.push({
          name: 'PUT /products/[id]',
          passed: true,
          details: { price: updateResult.data.data.price },
        });
      } else {
        throw new Error(`Update failed: ${JSON.stringify(updateResult.data)}`);
      }

      // DELETE Product (cleanup)
      log(`Testing DELETE /products/${productId} - Delete product...`);
      const deleteResult = await makeRequest(`/products/${productId}`, 'DELETE');

      if (deleteResult.ok && deleteResult.data.success) {
        logSuccess('Product deletion successful');
        results.push({
          name: 'DELETE /products/[id]',
          passed: true,
        });
      } else {
        throw new Error(`Delete failed: ${JSON.stringify(deleteResult.data)}`);
      }
    }
  } catch (error) {
    logError('Product API test failed', error);
    results.push({
      name: 'Product API CRUD',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return results;
}

/**
 * Test 4: Content API CRUD
 */
async function testContentAPI(): Promise<TestResult[]> {
  logSection('CONTENT API CRUD TESTING');

  const results: TestResult[] = [];
  let contentId: string | null = null;

  try {
    // CREATE Content
    log('Testing POST /content - Create content...');
    const createData = {
      title: 'API Test Content',
      type: 'TEMPLATE',
      content: 'This is test content created via API for validation purposes.',
      tags: ['api', 'test'],
      isPublic: false,
    };

    const createResult = await makeRequest('/content', 'POST', createData);

    if (createResult.ok && createResult.data.success) {
      contentId = createResult.data.data.id;
      logSuccess('Content creation successful');
      results.push({
        name: 'POST /content',
        passed: true,
        details: { id: contentId, title: createResult.data.data.title },
      });
    } else {
      throw new Error(`Create failed: ${JSON.stringify(createResult.data)}`);
    }

    // READ Content
    if (contentId) {
      log(`Testing GET /content/${contentId} - Get content...`);
      const getResult = await makeRequest(`/content/${contentId}`);

      if (getResult.ok && getResult.data.success) {
        logSuccess('Content retrieval successful');
        results.push({
          name: 'GET /content/[id]',
          passed: true,
          details: { title: getResult.data.data.title },
        });
      } else {
        throw new Error(`Get failed: ${JSON.stringify(getResult.data)}`);
      }

      // UPDATE Content
      log(`Testing PUT /content/${contentId} - Update content...`);
      const updateData = {
        title: 'API Test Content (Updated)',
        isPublic: true,
        tags: ['api', 'test', 'updated'],
      };

      const updateResult = await makeRequest(`/content/${contentId}`, 'PUT', updateData);

      if (updateResult.ok && updateResult.data.success) {
        logSuccess('Content update successful');
        results.push({
          name: 'PUT /content/[id]',
          passed: true,
          details: { title: updateResult.data.data.title },
        });
      } else {
        throw new Error(`Update failed: ${JSON.stringify(updateResult.data)}`);
      }

      // DELETE Content (cleanup)
      log(`Testing DELETE /content/${contentId} - Delete content...`);
      const deleteResult = await makeRequest(`/content/${contentId}`, 'DELETE');

      if (deleteResult.ok && deleteResult.data.success) {
        logSuccess('Content deletion successful');
        results.push({
          name: 'DELETE /content/[id]',
          passed: true,
        });
      } else {
        throw new Error(`Delete failed: ${JSON.stringify(deleteResult.data)}`);
      }
    }
  } catch (error) {
    logError('Content API test failed', error);
    results.push({
      name: 'Content API CRUD',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return results;
}

/**
 * Test 5: Data Validation and Type Consistency
 */
async function testDataValidation(): Promise<TestResult[]> {
  logSection('DATA VALIDATION & TYPE CONSISTENCY');

  const results: TestResult[] = [];

  try {
    // Test invalid data rejection
    log('Testing validation - Invalid customer data...');
    const invalidCustomerData = {
      name: '', // Invalid: empty name
      email: 'invalid-email', // Invalid: bad email format
      website: 'not-a-url', // Invalid: bad URL format
    };

    const invalidResult = await makeRequest('/customers', 'POST', invalidCustomerData);

    if (!invalidResult.ok && invalidResult.status === 400) {
      logSuccess('Invalid data properly rejected');
      results.push({
        name: 'Validation - Invalid data rejection',
        passed: true,
        details: { errors: invalidResult.data.details },
      });
    } else {
      throw new Error('Invalid data was not rejected');
    }

    // Test enum validation
    log('Testing validation - Invalid enum values...');
    const invalidEnumData = {
      name: 'Test Customer',
      email: 'test@example.com',
      tier: 'INVALID_TIER', // Invalid enum value
    };

    const enumResult = await makeRequest('/customers', 'POST', invalidEnumData);

    if (!enumResult.ok && enumResult.status === 400) {
      logSuccess('Invalid enum values properly rejected');
      results.push({
        name: 'Validation - Invalid enum rejection',
        passed: true,
        details: { errors: enumResult.data.details },
      });
    } else {
      throw new Error('Invalid enum value was not rejected');
    }

    // Test required field validation
    log('Testing validation - Missing required fields...');
    const missingFieldsData = {
      description: 'Missing name and SKU',
      // Missing required fields: name, sku, price
    };

    const missingResult = await makeRequest('/products', 'POST', missingFieldsData);

    if (!missingResult.ok && missingResult.status === 400) {
      logSuccess('Missing required fields properly rejected');
      results.push({
        name: 'Validation - Missing fields rejection',
        passed: true,
        details: { errors: missingResult.data.details },
      });
    } else {
      throw new Error('Missing required fields were not rejected');
    }
  } catch (error) {
    logError('Data validation test failed', error);
    results.push({
      name: 'Data Validation',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return results;
}

/**
 * Main test runner
 */
async function runAPIValidationTests() {
  console.log('\n🚀 Starting PosalPro MVP2 Phase 2.2.4 API Validation Tests');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🌐 Testing API at: ${BASE_URL}`);

  const allResults: TestResult[] = [];

  try {
    // Run all test suites
    const endpointResults = await testEndpointAvailability();
    const customerResults = await testCustomerAPI();
    const productResults = await testProductAPI();
    const contentResults = await testContentAPI();
    const validationResults = await testDataValidation();

    allResults.push(
      ...endpointResults,
      ...customerResults,
      ...productResults,
      ...contentResults,
      ...validationResults
    );
  } catch (error) {
    logError('Test execution failed', error);
  }

  // Generate final report
  logSection('API VALIDATION TEST RESULTS');

  const passed = allResults.filter(r => r.passed).length;
  const total = allResults.length;

  console.log('\n📊 Test Results Summary:');
  allResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const error = result.error ? ` - ${result.error}` : '';
    console.log(`${status} ${result.name}${error}`);
  });

  console.log(`\n🎯 Overall Result: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 ALL API TESTS PASSED - Phase 2.2.4 validation successful!');
    return true;
  } else {
    console.log('⚠️  Some API tests failed - review the results above');
    return false;
  }
}

// Export for use in other test files
export { runAPIValidationTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runAPIValidationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('API test runner failed:', error);
      process.exit(1);
    });
}
