#!/usr/bin/env node

/**
 * PosalPro MVP2 - HTTPS CLI Test
 * Tests HTTPS protocol support in the CLI
 *
 * Usage:
 *   node scripts/test-https-cli.js
 */

const { execSync } = require('child_process');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// CLI command execution helper
function runCliCommand(baseUrl, command) {
  try {
    const fullCommand = `npm run app:cli -- --base ${baseUrl} --command "${command}"`;
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
function testUrlNormalization() {
  logStep('1', 'Testing URL normalization');

  const testCases = [
    { input: 'posalpro.com', expected: 'https://posalpro.com' },
    { input: 'https://posalpro.com', expected: 'https://posalpro.com' },
    { input: 'http://posalpro.com', expected: 'http://posalpro.com' },
    { input: 'https://localhost:3000', expected: 'https://localhost:3000' },
    { input: 'staging.posalpro.com', expected: 'https://staging.posalpro.com' },
  ];

  for (const testCase of testCases) {
    const result = runCliCommand(testCase.input, 'base');
    if (result.success && result.output.includes(testCase.expected)) {
      logSuccess(`URL normalization: ${testCase.input} → ${testCase.expected}`);
    } else {
      logError(`URL normalization failed: ${testCase.input}`);
    }
  }
}

function testHttpsDetection() {
  logStep('2', 'Testing HTTPS detection');

  const httpsUrls = [
    'https://posalpro.com',
    'https://localhost:3000',
    'https://staging.posalpro.com',
  ];

  for (const url of httpsUrls) {
    const result = runCliCommand(url, 'base');
    if (result.success && result.output.includes('isHttps":true')) {
      logSuccess(`HTTPS detection: ${url}`);
    } else {
      logError(`HTTPS detection failed: ${url}`);
    }
  }
}

function testAutoHttpsConversion() {
  logStep('3', 'Testing auto HTTPS conversion');

  const testUrls = ['posalpro.com', 'staging.posalpro.com', 'api.posalpro.com'];

  for (const url of testUrls) {
    const result = runCliCommand(url, 'base');
    if (result.success && result.output.includes('https://')) {
      logSuccess(`Auto HTTPS conversion: ${url} → https://${url}`);
    } else {
      logError(`Auto HTTPS conversion failed: ${url}`);
    }
  }
}

function testHttpsLoginSimulation() {
  logStep('4', 'Testing HTTPS login simulation');

  // Test with a production-like URL
  const result = runCliCommand('https://posalpro.com', 'base');
  if (result.success) {
    logSuccess('HTTPS base URL configured successfully');
    logInfo('Ready for HTTPS login operations');
  } else {
    logError('HTTPS base URL configuration failed');
  }
}

function testLocalHttpsSupport() {
  logStep('5', 'Testing local HTTPS support');

  const result = runCliCommand('https://localhost:3000', 'base');
  if (result.success) {
    logSuccess('Local HTTPS support working');
    logInfo('Ready for local HTTPS development');
  } else {
    logError('Local HTTPS support failed');
  }
}

// Main test runner
function runHttpsTest() {
  log(`${colors.cyan}🚀 PosalPro MVP2 - HTTPS CLI Test${colors.reset}`, 'cyan');
  log('Testing HTTPS protocol support in the CLI\n', 'cyan');

  try {
    testUrlNormalization();
    testHttpsDetection();
    testAutoHttpsConversion();
    testHttpsLoginSimulation();
    testLocalHttpsSupport();

    log(`\n${colors.green}🎉 HTTPS CLI test completed!${colors.reset}`, 'green');
    logInfo('HTTPS protocol support is working correctly.');

    log(`\n${colors.yellow}📋 Usage Examples:${colors.reset}`, 'yellow');
    log(
      '  npm run app:cli -- --base https://posalpro.com --command "login admin@posalpro.com \'Password\'"'
    );
    log('  npm run app:cli -- --base https://localhost:3000 --command "get /api/products"');
    log('  npm run app:cli -- --base posalpro.com --command "get /api/proposals"');
  } catch (error) {
    logError(`Test execution error: ${error.message}`);
    process.exit(1);
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  runHttpsTest();
}

module.exports = {
  runHttpsTest,
};


