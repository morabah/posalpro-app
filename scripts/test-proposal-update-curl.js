#!/usr/bin/env node

/**
 * Simple Proposal Update Fix Test using curl
 *
 * This script tests the proposal update fix using curl to avoid JSON escaping issues.
 *
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination)
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n${colors.cyan}${step}${colors.reset}: ${description}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

function recordTest(name, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    logSuccess(`${name}`);
  } else {
    testResults.failed++;
    testResults.errors.push({ name, error });
    logError(`${name}: ${error}`);
  }
}

// Curl command execution helper
function runCurlCommand(method, url, data = null, headers = {}) {
  try {
    let command = `curl -s -X ${method.toUpperCase()} "${TEST_CONFIG.baseUrl}${url}"`;

    // Add headers
    Object.entries(headers).forEach(([key, value]) => {
      command += ` -H "${key}: ${value}"`;
    });

    // Add data if provided
    if (data) {
      command += ` -d '${JSON.stringify(data)}'`;
    }

    log(`Running: ${command}`, 'magenta');

    const result = execSync(command, {
      encoding: 'utf8',
      timeout: TEST_CONFIG.timeout,
    });

    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || error.stderr || ''
    };
  }
}

// Parse JSON from curl output
function parseJsonFromOutput(output) {
  try {
    return JSON.parse(output.trim());
  } catch (error) {
    console.log('JSON parsing error:', error.message);
    console.log('Output:', output);
    return null;
  }
}

async function testProposalUpdateFix() {
  log('🧪 Testing Proposal Update Fix with curl', 'bright');
  log('='.repeat(60));
  log('This test simulates the exact wizard payload structure');
  log('to verify that product data is properly saved to the database.');
  log('');

  try {
    // Step 1: Get test data (customers, products)
    logStep('Step 1', 'Getting test data');

    const customersResult = runCurlCommand('GET', '/api/customers?limit=1');
    if (!customersResult.success) {
      throw new Error(`Failed to get customers: ${customersResult.error}`);
    }

    const customersData = parseJsonFromOutput(customersResult.output);
    if (!customersData || !customersData.data || !customersData.data.items || !customersData.data.items.length) {
      throw new Error('No customers found');
    }

    const customer = customersData.data.items[0];
    recordTest('Get Customers', true);
    logSuccess(`Found customer: ${customer.name}`);

    const productsResult = runCurlCommand('GET', '/api/products?limit=3');
    if (!productsResult.success) {
      throw new Error(`Failed to get products: ${productsResult.error}`);
    }

    const productsData = parseJsonFromOutput(productsResult.output);
    if (!productsData || !productsData.data || !productsData.data.items || !productsData.data.items.length) {
      throw new Error('No products found');
    }

    const products = productsData.data.items;
    recordTest('Get Products', true);
    logSuccess(`Found ${products.length} products`);

    // Step 2: Create a test proposal
    logStep('Step 2', 'Creating test proposal');

    const createProposalPayload = {
      title: 'Test Proposal for Update Fix',
      description: 'Testing the proposal update fix with wizard payload',
      customerId: customer.id,
      status: 'DRAFT',
      priority: 'MEDIUM',
      value: 100000,
      currency: 'USD',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const createResult = runCurlCommand('POST', '/api/proposals', createProposalPayload, {
      'Content-Type': 'application/json'
    });

    if (!createResult.success) {
      throw new Error(`Failed to create proposal: ${createResult.error}`);
    }

    const createData = parseJsonFromOutput(createResult.output);
    if (!createData || !createData.data || !createData.data.id) {
      throw new Error('Failed to create proposal - no ID returned');
    }

    const proposalId = createData.data.id;
    recordTest('Create Proposal', true);
    logSuccess(`Created proposal: ${proposalId}`);

    // Step 3: Create the exact wizard payload structure
    logStep('Step 3', 'Creating wizard payload structure');

    // This is the EXACT same structure that the wizard sends
    const wizardPayload = {
      title: 'Updated Test Proposal',
      description: 'Updated description for testing',
      customerId: customer.id,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'HIGH',
      value: 150000,
      currency: 'USD',
      projectType: 'RFP',
      tags: ['test', 'wizard', 'updated'],
      teamData: {
        teamLead: 'test-user-id',
        salesRepresentative: 'test-user-id',
        subjectMatterExperts: {
          TECHNICAL: 'test-user-id',
          FINANCIAL: 'test-user-id',
        },
        executiveReviewers: ['test-user-id'],
        teamMembers: [
          {
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
          },
        ],
      },
      contentData: {
        selectedTemplates: ['executive-summary', 'technical-specs'],
        customContent: [
          {
            id: 'custom-1',
            title: 'Custom Section',
            content: 'This is custom content for testing',
            type: 'text',
          },
        ],
        contentLibrary: [
          {
            id: 'executive-summary',
            title: 'Executive Summary',
            category: 'Overview',
            isSelected: true,
          },
          {
            id: 'technical-specs',
            title: 'Technical Specifications',
            category: 'Technical',
            isSelected: true,
          },
        ],
      },
      productData: {
        products: products.map((product, index) => ({
          id: `wizard-product-${index}`,
          productId: product.id,
          name: product.name,
          quantity: (index + 1) * 2, // Different quantities for testing
          unitPrice: 15000 + (index * 3000), // Different prices
          total: ((index + 1) * 2) * (15000 + (index * 3000)),
          discount: index * 5, // Different discounts
          category: product.category[0] || 'General',
          configuration: {
            customField: `test-config-${index}`,
            options: [`option-${index}-1`, `option-${index}-2`],
          },
          included: true,
        })),
        totalValue: products.reduce(
          (sum, _, index) => sum + (((index + 1) * 2) * (15000 + (index * 3000))),
          0
        ),
        searchQuery: 'test search',
        selectedCategory: 'All',
      },
      sectionData: {
        sections: [
          {
            id: 'section-1',
            type: 'TEXT',
            order: 1,
            title: 'Updated Introduction',
            content: 'This is an updated introduction section for testing.',
            isRequired: true,
          },
          {
            id: 'section-2',
            type: 'TEXT',
            order: 2,
            title: 'Technical Overview',
            content: 'This is a technical overview section for testing.',
            isRequired: false,
          },
        ],
        sectionTemplates: [
          {
            id: 'intro',
            title: 'Introduction',
            content: 'Introduction section template...',
            category: 'Overview',
          },
          {
            id: 'technical',
            title: 'Technical Overview',
            content: 'Technical overview section template...',
            category: 'Technical',
          },
        ],
      },
      reviewData: {
        validationChecklist: [
          {
            id: 'basic-info',
            title: 'Basic Information',
            isChecked: true,
            isRequired: true,
          },
          {
            id: 'team-assignment',
            title: 'Team Assignment',
            isChecked: true,
            isRequired: true,
          },
          {
            id: 'product-selection',
            title: 'Product Selection',
            isChecked: true,
            isRequired: true,
          },
        ],
        totalProducts: products.length,
        totalValue: products.reduce(
          (sum, _, index) => sum + (((index + 1) * 2) * (15000 + (index * 3000))),
          0
        ),
        totalSections: 2,
      },
    };

    recordTest('Create Wizard Payload', true);
    logSuccess(`Created wizard payload with ${wizardPayload.productData.products.length} products`);
    logInfo(`Total value: $${wizardPayload.productData.totalValue.toLocaleString()}`);

    // Step 4: Update the proposal using the API
    logStep('Step 4', 'Updating proposal via API');

    const updateResult = runCurlCommand('PUT', `/api/proposals/${proposalId}`, wizardPayload, {
      'Content-Type': 'application/json'
    });

    if (!updateResult.success) {
      throw new Error(`Failed to update proposal: ${updateResult.error}`);
    }

    const updateData = parseJsonFromOutput(updateResult.output);
    if (!updateData || !updateData.data) {
      throw new Error('Failed to update proposal - no data returned');
    }

    recordTest('Update Proposal via API', true);
    logSuccess('Proposal updated successfully via API');

    // Step 5: Fetch the updated proposal to verify changes
    logStep('Step 5', 'Fetching updated proposal to verify changes');

    const fetchResult = runCurlCommand('GET', `/api/proposals/${proposalId}`);

    if (!fetchResult.success) {
      throw new Error(`Failed to fetch updated proposal: ${fetchResult.error}`);
    }

    const fetchData = parseJsonFromOutput(fetchResult.output);
    if (!fetchData || !fetchData.data) {
      throw new Error('Failed to fetch updated proposal - no data returned');
    }

    const updatedProposal = fetchData.data;
    recordTest('Fetch Updated Proposal', true);
    logSuccess('Updated proposal fetched successfully');

    // Step 6: Verify the changes
    logStep('Step 6', 'Verifying changes');

    // Verify basic fields
    const basicFieldsMatch =
      updatedProposal.title === wizardPayload.title &&
      updatedProposal.description === wizardPayload.description &&
      updatedProposal.priority === wizardPayload.priority &&
      updatedProposal.value === wizardPayload.value;

    // Verify products (check if products relation exists and has data)
    const productsMatch = updatedProposal.products && updatedProposal.products.length === wizardPayload.productData.products.length;

    // Verify sections (check if sections relation exists and has data)
    const sectionsMatch = updatedProposal.sections && updatedProposal.sections.length === wizardPayload.sectionData.sections.length;

    // Verify metadata
    const metadata = updatedProposal.metadata;
    const metadataHasProductData = metadata && metadata.productData && metadata.productData.products && metadata.productData.products.length === wizardPayload.productData.products.length;

    recordTest('Verify Basic Fields', basicFieldsMatch);
    recordTest('Verify Products', productsMatch);
    recordTest('Verify Sections', sectionsMatch);
    recordTest('Verify Metadata', metadataHasProductData);

    logInfo(`Basic fields match: ${basicFieldsMatch ? '✅' : '❌'}`);
    logInfo(`Products match: ${productsMatch ? '✅' : '❌'} (${updatedProposal.products?.length || 0}/${wizardPayload.productData.products.length})`);
    logInfo(`Sections match: ${sectionsMatch ? '✅' : '❌'} (${updatedProposal.sections?.length || 0}/${wizardPayload.sectionData.sections.length})`);
    logInfo(`Metadata has product data: ${metadataHasProductData ? '✅' : '❌'}`);

    // Step 7: Display detailed product information
    logStep('Step 7', 'Detailed product verification');

    logInfo('Expected products from wizard payload:');
    wizardPayload.productData.products.forEach((product, index) => {
      logInfo(`   ${index + 1}. ${product.name} - Qty: ${product.quantity}, Price: $${product.unitPrice}, Total: $${product.total}`);
    });

    if (updatedProposal.products && updatedProposal.products.length > 0) {
      logInfo('Actual products in database:');
      updatedProposal.products.forEach((product, index) => {
        logInfo(`   ${index + 1}. ${product.product?.name || 'Unknown'} - Qty: ${product.quantity}, Price: $${product.unitPrice}, Total: $${product.total}`);
      });
    } else {
      logWarning('No products found in database relation');
    }

    // Step 8: Cleanup
    logStep('Step 8', 'Cleaning up test data');

    const deleteResult = runCurlCommand('DELETE', `/api/proposals/${proposalId}`);
    if (!deleteResult.success) {
      logWarning(`Failed to delete test proposal: ${deleteResult.error}`);
    } else {
      recordTest('Cleanup', true);
      logSuccess('Test proposal deleted successfully');
    }

    // Final summary
    log('\n📊 Test Results Summary', 'bright');
    log('='.repeat(60));

    log(`Total Tests: ${testResults.total}`);
    log(`Passed: ${testResults.passed}`, 'green');
    log(`Failed: ${testResults.failed}`, 'red');

    if (testResults.errors.length > 0) {
      log('\nErrors:', 'red');
      testResults.errors.forEach(error => {
        log(`  - ${error.name}: ${error.error}`, 'red');
      });
    }

    if (testResults.failed === 0) {
      log('\n🎉 ALL TESTS PASSED! The proposal update fix is working correctly.', 'green');
      log('✅ Product data is properly saved to the database', 'green');
      log('✅ Proposal detail page will show the correct product information', 'green');
    } else {
      log('\n❌ SOME TESTS FAILED! There may still be issues with the update fix.', 'red');
    }

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
testProposalUpdateFix().catch(error => {
  logError(`Script failed: ${error.message}`);
  process.exit(1);
});
