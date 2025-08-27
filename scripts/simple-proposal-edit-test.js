#!/usr/bin/env node

/**
 * PosalPro MVP2 - Simple Proposal Edit Test
 * Simple test of proposal edit functionality without browser
 *
 * Usage:
 *   node scripts/simple-proposal-edit-test.js
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

function testGetProposal() {
  logStep('3', 'Getting test proposal');

  // Get first available proposal using proper JSON escaping
  const listResult = runCliCommand('db proposal findFirst \'{"select":{"id":true,"title":true}}\'');

  if (!listResult.success) {
    logError(`Failed to get proposal: ${listResult.error}`);
    return false;
  }

  try {
    const proposal = JSON.parse(listResult.output);
    if (proposal && proposal.id) {
      logSuccess(`Found proposal: ${proposal.title} (${proposal.id})`);
      return { success: true, proposalId: proposal.id, proposal };
    } else {
      logError('No proposals found');
      return false;
    }
  } catch (error) {
    logError('Invalid JSON response');
    return false;
  }
}

function testProposalUpdate(proposalId) {
  logStep('4', 'Testing proposal update');

  const updateData = {
    title: `Simple Test Update - ${new Date().toISOString()}`,
    description: 'Simple test update',
  };

  const updateCommand = `put /api/proposals/${proposalId} '${JSON.stringify(updateData)}'`;
  const result = runCliCommand(updateCommand);

  if (result.success) {
    try {
      const response = JSON.parse(result.output);
      if (response && response.id) {
        logSuccess('Proposal update successful');
        return true;
      } else {
        logError('Invalid update response');
        return false;
      }
    } catch (error) {
      logError('Invalid JSON response');
      return false;
    }
  } else {
    logError(`Update failed: ${result.error}`);
    return false;
  }
}

function testProposalValueCalculation(proposalId) {
  logStep('5', 'Testing value calculation');

  const getResult = runCliCommand(`get /api/proposals/${proposalId}`);

  if (getResult.success) {
    try {
      const proposal = JSON.parse(getResult.output);
      if (proposal && proposal.value !== undefined) {
        logSuccess(`Proposal value: ${proposal.value}`);
        return true;
      } else {
        logError('No value field in response');
        return false;
      }
    } catch (error) {
      logError('Invalid JSON response');
      return false;
    }
  } else {
    logError(`Failed to get proposal: ${getResult.error}`);
    return false;
  }
}

// Main test runner
function runSimpleTest() {
  log(`${colors.cyan}🚀 PosalPro MVP2 - Simple Proposal Edit Test${colors.reset}`, 'cyan');
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

    const proposalResult = testGetProposal();
    if (!proposalResult || !proposalResult.success) {
      logError('Failed to get test proposal.');
      process.exit(1);
    }
    proposalId = proposalResult.proposalId;

    if (!testProposalUpdate(proposalId)) {
      logError('Proposal update failed.');
      process.exit(1);
    }

    if (!testProposalValueCalculation(proposalId)) {
      logError('Value calculation failed.');
      process.exit(1);
    }

    log(`\n${colors.green}🎉 Simple test completed successfully!${colors.reset}`, 'green');
    logInfo('Proposal edit functionality is working correctly.');
  } catch (error) {
    logError(`Test execution error: ${error.message}`);
    process.exit(1);
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  runSimpleTest();
}

module.exports = {
  runSimpleTest,
};


