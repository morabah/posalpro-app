#!/usr/bin/env node

/**
 * PosalPro MVP2 - Proposal Edit Functionality Test
 * Tests the complete proposal edit workflow without browser
 *
 * Usage:
 *   node scripts/test-proposal-edit.js
 *   node scripts/test-proposal-edit.js --proposal-id <id>
 *   node scripts/test-proposal-edit.js --verbose
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const proposalIdArg = args.find(arg => arg.startsWith('--proposal-id='));
const proposalId = proposalIdArg ? proposalIdArg.split('=')[1] : null;

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'admin@posalpro.com',
  adminPassword: 'ProposalPro2024!',
  adminRole: 'System Administrator',
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

// CLI command execution helper
function runCliCommand(command) {
  try {
    const fullCommand = `npm run app:cli -- --base ${TEST_CONFIG.baseUrl} --command "${command}"`;
    if (verbose) {
      log(`Running: ${fullCommand}`, 'magenta');
    }

    const result = execSync(fullCommand, {
      encoding: 'utf8',
      timeout: TEST_CONFIG.timeout,
      stdio: verbose ? 'inherit' : 'pipe',
    });

    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || error.stderr || error.message,
    };
  }
}

// Test functions
async function testServerHealth() {
  logStep('1', 'Testing server health');

  const result = runCliCommand('get /api/health');
  if (result.success) {
    recordTest('Server health check', true);
    return true;
  } else {
    recordTest('Server health check', false, 'Server not responding');
    return false;
  }
}

async function testAuthentication() {
  logStep('2', 'Testing authentication');

  const loginCommand = `login ${TEST_CONFIG.adminEmail} '${TEST_CONFIG.adminPassword}' '${TEST_CONFIG.adminRole}'`;
  const result = runCliCommand(loginCommand);

  if (result.success) {
    recordTest('Admin authentication', true);
    return true;
  } else {
    recordTest('Admin authentication', false, result.error);
    return false;
  }
}

async function testGetProposal() {
  logStep('3', 'Getting test proposal');

  let testProposalId = proposalId;

  if (!testProposalId) {
    // Get first available proposal
    const listResult = runCliCommand(
      'db proposal findFirst \'{"where":{"status":{"not":"DRAFT"}},"select":{"id":true,"title":true}}\''
    );

    if (!listResult.success) {
      recordTest('Get proposal list', false, listResult.error);
      return false;
    }

    try {
      const proposal = JSON.parse(listResult.output);
      if (proposal && proposal.id) {
        testProposalId = proposal.id;
        logInfo(`Using proposal: ${proposal.title} (${testProposalId})`);
      } else {
        recordTest('Get proposal list', false, 'No proposals found');
        return false;
      }
    } catch (error) {
      recordTest('Get proposal list', false, 'Invalid JSON response');
      return false;
    }
  }

  // Get proposal details
  const getResult = runCliCommand(`get /api/proposals/${testProposalId}`);

  if (getResult.success) {
    try {
      const proposal = JSON.parse(getResult.output);
      if (proposal && proposal.id) {
        recordTest('Get proposal details', true);
        return { success: true, proposalId: testProposalId, proposal };
      } else {
        recordTest('Get proposal details', false, 'Invalid proposal data');
        return false;
      }
    } catch (error) {
      recordTest('Get proposal details', false, 'Invalid JSON response');
      return false;
    }
  } else {
    recordTest('Get proposal details', false, getResult.error);
    return false;
  }
}

async function testProposalEditPageAccess() {
  logStep('4', 'Testing edit page access');

  const result = runCliCommand(`get /proposals/${testResults.proposalId}/edit`);

  if (result.success) {
    // Check if page contains expected elements
    const hasEditProposal = result.output.includes('Edit Proposal');
    const hasBreadcrumbs = result.output.includes('Breadcrumbs');
    const hasForm = result.output.includes('ProposalEditForm');

    if (hasEditProposal && hasBreadcrumbs) {
      recordTest('Edit page access', true);
      return true;
    } else {
      recordTest('Edit page access', false, 'Page missing expected elements');
      return false;
    }
  } else {
    recordTest('Edit page access', false, result.error);
    return false;
  }
}

async function testProposalUpdate() {
  logStep('5', 'Testing proposal update via API');

  const updateData = {
    title: `Updated Proposal - ${new Date().toISOString()}`,
    description: 'Updated description for testing',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  };

  const updateCommand = `put /api/proposals/${testResults.proposalId} '${JSON.stringify(updateData)}'`;
  const result = runCliCommand(updateCommand);

  if (result.success) {
    try {
      const response = JSON.parse(result.output);
      if (response && response.id) {
        recordTest('Proposal update API', true);
        return true;
      } else {
        recordTest('Proposal update API', false, 'Invalid update response');
        return false;
      }
    } catch (error) {
      recordTest('Proposal update API', false, 'Invalid JSON response');
      return false;
    }
  } else {
    recordTest('Proposal update API', false, result.error);
    return false;
  }
}

async function testProposalProductsUpdate() {
  logStep('6', 'Testing proposal products update');

  // Get available products
  const productsResult = runCliCommand(
    'db product findMany \'{"take":2,"select":{"id":true,"name":true,"price":true}}\''
  );

  if (!productsResult.success) {
    recordTest('Get products for update', false, productsResult.error);
    return false;
  }

  try {
    const products = JSON.parse(productsResult.output);
    if (!products || products.length === 0) {
      recordTest('Get products for update', false, 'No products available');
      return false;
    }

    // Add products to proposal
    for (const product of products.slice(0, 2)) {
      const addCommand = `proposals add-product ${testResults.proposalId} ${product.id} 2 ${product.price} 10`;
      const addResult = runCliCommand(addCommand);

      if (addResult.success) {
        recordTest(`Add product ${product.name}`, true);
      } else {
        recordTest(`Add product ${product.name}`, false, addResult.error);
      }
    }

    return true;
  } catch (error) {
    recordTest('Get products for update', false, 'Invalid JSON response');
    return false;
  }
}

async function testProposalValueCalculation() {
  logStep('7', 'Testing proposal value calculation');

  const getResult = runCliCommand(`get /api/proposals/${testResults.proposalId}`);

  if (getResult.success) {
    try {
      const proposal = JSON.parse(getResult.output);
      if (proposal && proposal.value !== undefined) {
        recordTest('Proposal value calculation', true);
        logInfo(`Proposal value: ${proposal.value}`);
        return true;
      } else {
        recordTest('Proposal value calculation', false, 'No value field in response');
        return false;
      }
    } catch (error) {
      recordTest('Proposal value calculation', false, 'Invalid JSON response');
      return false;
    }
  } else {
    recordTest('Proposal value calculation', false, getResult.error);
    return false;
  }
}

async function testProposalVersionHistory() {
  logStep('8', 'Testing proposal version history');

  const versionsResult = runCliCommand(`versions for ${testResults.proposalId} 5`);

  if (versionsResult.success) {
    try {
      const versions = JSON.parse(versionsResult.output);
      if (Array.isArray(versions)) {
        recordTest('Proposal version history', true);
        logInfo(`Found ${versions.length} versions`);
        return true;
      } else {
        recordTest('Proposal version history', false, 'Invalid versions response');
        return false;
      }
    } catch (error) {
      recordTest('Proposal version history', false, 'Invalid JSON response');
      return false;
    }
  } else {
    recordTest('Proposal version history', false, versionsResult.error);
    return false;
  }
}

async function testRBACPermissions() {
  logStep('9', 'Testing RBAC permissions for proposal edit');

  const rbacTests = [
    { method: 'GET', path: `/api/proposals/${testResults.proposalId}`, expect: 200 },
    { method: 'PUT', path: `/api/proposals/${testResults.proposalId}`, expect: 200 },
    { method: 'GET', path: `/api/proposals/${testResults.proposalId}/versions`, expect: 200 },
  ];

  for (const test of rbacTests) {
    const rbacCommand = `rbac try ${test.method} ${test.path}`;
    const result = runCliCommand(rbacCommand);

    if (result.success) {
      recordTest(`RBAC ${test.method} ${test.path}`, true);
    } else {
      recordTest(`RBAC ${test.method} ${test.path}`, false, result.error);
    }
  }

  return true;
}

// Main test runner
async function runAllTests() {
  log(`${colors.bright}🚀 PosalPro MVP2 - Proposal Edit Functionality Test${colors.reset}`, 'cyan');
  log('Testing complete proposal edit workflow without browser\n', 'cyan');

  // Store test data
  testResults.proposalId = null;
  testResults.proposal = null;

  try {
    // Run tests in sequence
    const tests = [
      testServerHealth,
      testAuthentication,
      testGetProposal,
      testProposalEditPageAccess,
      testProposalUpdate,
      testProposalProductsUpdate,
      testProposalValueCalculation,
      testProposalVersionHistory,
      testRBACPermissions,
    ];

    for (const test of tests) {
      const result = await test();
      if (result === false) {
        logWarning('Test failed, but continuing with remaining tests...');
      }
    }
  } catch (error) {
    logError(`Test execution error: ${error.message}`);
  }

  // Generate test report
  generateTestReport();
}

function generateTestReport() {
  log(`\n${colors.bright}📊 Test Results Summary${colors.reset}`, 'cyan');
  log('=====================================', 'cyan');

  log(`Total Tests: ${testResults.total}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'blue');

  if (testResults.failed > 0) {
    log(`\n${colors.bright}❌ Failed Tests:${colors.reset}`, 'red');
    testResults.errors.forEach(error => {
      log(`  - ${error.name}: ${error.error}`, 'red');
    });
  }

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: (testResults.passed / testResults.total) * 100,
    },
    errors: testResults.errors,
    config: TEST_CONFIG,
  };

  const reportPath = path.join(__dirname, '..', 'test-reports', 'proposal-edit-test-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log(`\n📄 Detailed report saved to: ${reportPath}`, 'blue');

  // Exit with appropriate code
  if (testResults.failed > 0) {
    process.exit(1);
  } else {
    log(
      `\n${colors.bright}🎉 All tests passed! Proposal edit functionality is working correctly.${colors.reset}`,
      'green'
    );
    process.exit(0);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Test runner error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults,
};


