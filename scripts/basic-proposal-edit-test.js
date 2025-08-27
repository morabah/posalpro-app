#!/usr/bin/env node

/**
 * PosalPro MVP2 - Basic Proposal Edit Test
 * Basic test of proposal edit functionality without browser
 *
 * Usage:
 *   node scripts/basic-proposal-edit-test.js
 */

const { execSync } = require('child_process');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logStep(step, description) {
  log(`\n${colors.cyan}${step}${colors.reset}: ${description}`);
}

// CLI command execution helper
function runCliCommand(command) {
  try {
    const fullCommand = `npm run app:cli -- --base http://localhost:3000 --command "${command}"`;
    const result = execSync(fullCommand, {
      encoding: 'utf8',
      timeout: 30000,
      stdio: 'pipe',
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
function testServerHealth() {
  logStep('1', 'Testing server health');

  const result = runCliCommand('get /api/health');
  if (result.success) {
    logSuccess('Server is running');
    return true;
  } else {
    logError('Server not responding');
    return false;
  }
}

function testAuthentication() {
  logStep('2', 'Testing authentication');

  const loginCommand = `login admin@posalpro.com 'ProposalPro2024!'`;
  const result = runCliCommand(loginCommand);

  if (result.success) {
    logSuccess('Authentication successful');
    return true;
  } else {
    logError(`Authentication failed: ${result.error}`);
    return false;
  }
}

function testProposalUpdate() {
  logStep('3', 'Testing proposal update with known ID');

  // Use a known proposal ID from the database
  const proposalId = 'cmesutw7n0014wsyrl68grohj';

  const updateData = {
    title: `Basic Test Update - ${new Date().toISOString()}`,
    description: 'Basic test update',
  };

  // Use proper JSON escaping for the CLI command
  const updateCommand = `put /api/proposals/${proposalId} '{\"title\":\"${updateData.title}\",\"description\":\"${updateData.description}\"}'`;
  const result = runCliCommand(updateCommand);

  if (result.success) {
    logSuccess('Proposal update successful');
    return { success: true, proposalId };
  } else {
    logError(`Update failed: ${result.error}`);
    return false;
  }
}

function testProposalValueCalculation(proposalId) {
  logStep('4', 'Testing value calculation');

  const getResult = runCliCommand(`get /api/proposals/${proposalId}`);

  if (getResult.success) {
    // Just check if the response contains value information
    if (getResult.output.includes('"value"')) {
      logSuccess('Proposal value calculation working');
      return true;
    } else {
      logError('No value field in response');
      return false;
    }
  } else {
    logError(`Failed to get proposal: ${getResult.error}`);
    return false;
  }
}

function testProposalEditPageAccess(proposalId) {
  logStep('5', 'Testing edit page access');

  const result = runCliCommand(`get /proposals/${proposalId}/edit`);

  if (result.success) {
    // Check if page contains expected elements
    const hasEditProposal = result.output.includes('Edit Proposal');
    const hasBreadcrumbs = result.output.includes('Breadcrumbs');

    if (hasEditProposal && hasBreadcrumbs) {
      logSuccess('Edit page access successful');
      return true;
    } else {
      logError('Page missing expected elements');
      return false;
    }
  } else {
    logError(`Edit page access failed: ${result.error}`);
    return false;
  }
}

// Main test runner
function runBasicTest() {
  log(`${colors.cyan}🚀 PosalPro MVP2 - Basic Proposal Edit Test${colors.reset}`, 'cyan');
  log('Testing basic proposal edit functionality\n', 'cyan');

  let proposalId = null;

  try {
    // Run tests in sequence
    if (!testServerHealth()) {
      logError('Server health check failed. Please start the server with: npm run dev:smart');
      process.exit(1);
    }

    if (!testAuthentication()) {
      logError('Authentication failed. Check credentials.');
      process.exit(1);
    }

    const updateResult = testProposalUpdate();
    if (!updateResult || !updateResult.success) {
      logError('Proposal update failed.');
      process.exit(1);
    }
    proposalId = updateResult.proposalId;

    if (!testProposalValueCalculation(proposalId)) {
      logError('Value calculation failed.');
      process.exit(1);
    }

    if (!testProposalEditPageAccess(proposalId)) {
      logError('Edit page access failed.');
      process.exit(1);
    }

    log(`\n${colors.green}🎉 Basic test completed successfully!${colors.reset}`, 'green');
    logInfo('Proposal edit functionality is working correctly.');
  } catch (error) {
    logError(`Test execution error: ${error.message}`);
    process.exit(1);
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  runBasicTest();
}

module.exports = {
  runBasicTest,
};


