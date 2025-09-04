#!/usr/bin/env node

/**
 * PosalPro MVP2 - Comprehensive RBAC Security Testing
 * Tests RBAC enforcement with different user roles and sessions
 * Validates security vulnerabilities and authorization bypass attempts
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  testUsers: {
    admin: {
      email: 'admin@posalpro.com',
      password: 'ProposalPro2024!',
      expectedRole: 'System Administrator',
      shouldAccessAdmin: true,
      description: 'System Administrator - Full Access'
    },
    manager: {
      email: 'qa.manager@posalpro.com',
      password: 'ProposalPro2024!',
      expectedRole: 'Proposal Manager',
      shouldAccessAdmin: false,
      description: 'Proposal Manager - Limited Access'
    },
    sme: {
      email: 'qa.sme@posalpro.com',
      password: 'ProposalPro2024!',
      expectedRole: 'SME',
      shouldAccessAdmin: false,
      description: 'SME - Read-Only Access'
    }
  },
  adminEndpoints: [
    '/api/admin/users',
    '/api/admin/metrics',
    '/api/admin/audit'
  ],
  nonAdminEndpoints: [
    '/api/proposals',
    '/api/customers',
    '/api/products'
  ]
};

// Test results storage
const testResults = {
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    securityBreachTests: 0
  },
  tests: [],
  securityIssues: []
};

// Logging utilities
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  console.log(logMessage);

  if (level === 'error' || level === 'security') {
    testResults.securityIssues.push({
      timestamp,
      level,
      message
    });
  }
}

function logTest(testName, result, details = {}) {
  const testResult = {
    testName,
    result,
    details,
    timestamp: new Date().toISOString()
  };

  testResults.tests.push(testResult);
  testResults.summary.totalTests++;

  if (result === 'PASS') {
    testResults.summary.passedTests++;
  } else if (result === 'SECURITY_BREACH') {
    testResults.summary.failedTests++;
    testResults.summary.securityBreachTests++;
  } else {
    testResults.summary.failedTests++;
  }

  log(`Test: ${testName} - ${result}`, result === 'SECURITY_BREACH' ? 'security' : (result === 'PASS' ? 'info' : 'error'));
}

// CLI command execution utility
function executeCliCommand(command, description) {
  return new Promise((resolve, reject) => {
    log(`Executing: ${description} - ${command}`);

    const child = spawn('npm', ['run', 'app:cli', '--', command], {
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      const result = {
        code,
        stdout,
        stderr,
        success: code === 0
      };

      if (code === 0) {
        log(`Command completed successfully: ${description}`);
      } else {
        log(`Command failed (${code}): ${description}`, 'error');
        if (stderr) {
          log(`STDERR: ${stderr}`, 'error');
        }
      }

      resolve(result);
    });

    child.on('error', (error) => {
      log(`Command error: ${error.message}`, 'error');
      reject(error);
    });
  });
}

// Test authentication and session management
async function testAuthentication() {
  log('\n🔐 Testing Authentication & Session Management');

  for (const [userKey, userConfig] of Object.entries(CONFIG.testUsers)) {
    const testName = `Authentication - ${userConfig.description}`;

    try {
      // Test login
      const loginResult = await executeCliCommand(
        `login-as ${userConfig.email} '${userConfig.password}' '${userConfig.expectedRole}' ${userKey}_session`,
        `Login as ${userConfig.description}`
      );

      if (!loginResult.success) {
        logTest(testName, 'FAIL', { error: 'Login failed', details: loginResult.stderr });
        continue;
      }

      // Switch to user session
      const switchResult = await executeCliCommand(
        `use-session ${userKey}_session`,
        `Switch to ${userConfig.description} session`
      );

      if (!switchResult.success) {
        logTest(testName, 'FAIL', { error: 'Session switch failed', details: switchResult.stderr });
        continue;
      }

      // Verify session identity
      const whoamiResult = await executeCliCommand(
        'whoami',
        `Verify identity for ${userConfig.description}`
      );

      if (whoamiResult.success && whoamiResult.stdout.includes(userConfig.email)) {
        logTest(testName, 'PASS', {
          user: userConfig.email,
          expectedRole: userConfig.expectedRole,
          session: `${userKey}_session`
        });
      } else {
        logTest(testName, 'FAIL', {
          error: 'Session verification failed',
          expectedEmail: userConfig.email,
          actualOutput: whoamiResult.stdout
        });
      }

    } catch (error) {
      logTest(testName, 'ERROR', { error: error.message });
    }
  }
}

// Test RBAC enforcement for admin endpoints
async function testRBACEnforcement() {
  log('\n🔒 Testing RBAC Enforcement for Admin Endpoints');

  for (const [userKey, userConfig] of Object.entries(CONFIG.testUsers)) {
    // Switch to user session first
    await executeCliCommand(`use-session ${userKey}_session`, `Switch to ${userConfig.description} session`);

    for (const endpoint of CONFIG.adminEndpoints) {
      const testName = `RBAC - ${userConfig.description} -> ${endpoint}`;

      try {
        const result = await executeCliCommand(
          `get ${endpoint}`,
          `${userConfig.description} accessing ${endpoint}`
        );

        const shouldHaveAccess = userConfig.shouldAccessAdmin;
        const actuallyHasAccess = result.success && result.stdout.includes('"ok":true');

        if (shouldHaveAccess && actuallyHasAccess) {
          logTest(testName, 'PASS', {
            expected: 'ACCESS_GRANTED',
            actual: 'ACCESS_GRANTED',
            endpoint,
            userRole: userConfig.expectedRole
          });
        } else if (!shouldHaveAccess && !actuallyHasAccess) {
          logTest(testName, 'PASS', {
            expected: 'ACCESS_DENIED',
            actual: 'ACCESS_DENIED',
            endpoint,
            userRole: userConfig.expectedRole
          });
        } else if (!shouldHaveAccess && actuallyHasAccess) {
          logTest(testName, 'SECURITY_BREACH', {
            expected: 'ACCESS_DENIED',
            actual: 'ACCESS_GRANTED',
            endpoint,
            userRole: userConfig.expectedRole,
            vulnerability: 'RBAC_BYPASS'
          });
        } else {
          logTest(testName, 'FAIL', {
            expected: 'ACCESS_GRANTED',
            actual: 'ACCESS_DENIED',
            endpoint,
            userRole: userConfig.expectedRole
          });
        }

      } catch (error) {
        logTest(testName, 'ERROR', { error: error.message });
      }
    }
  }
}

// Test non-admin endpoint access (should work for all users)
async function testNonAdminAccess() {
  log('\n✅ Testing Non-Admin Endpoint Access');

  for (const [userKey, userConfig] of Object.entries(CONFIG.testUsers)) {
    // Switch to user session first
    await executeCliCommand(`use-session ${userKey}_session`, `Switch to ${userConfig.description} session`);

    for (const endpoint of CONFIG.nonAdminEndpoints) {
      const testName = `Non-Admin Access - ${userConfig.description} -> ${endpoint}`;

      try {
        const result = await executeCliCommand(
          `get ${endpoint}?limit=1`,
          `${userConfig.description} accessing ${endpoint}`
        );

        if (result.success && result.stdout.includes('"ok":true')) {
          logTest(testName, 'PASS', {
            endpoint,
            userRole: userConfig.expectedRole
          });
        } else {
          logTest(testName, 'FAIL', {
            endpoint,
            userRole: userConfig.expectedRole,
            error: result.stderr
          });
        }

      } catch (error) {
        logTest(testName, 'ERROR', { error: error.message });
      }
    }
  }
}

// Test session isolation
async function testSessionIsolation() {
  log('\n🔄 Testing Session Isolation');

  // Test 1: Verify sessions don't interfere with each other
  const testName = 'Session Isolation Test';

  try {
    // Login as admin
    await executeCliCommand(`login-as ${CONFIG.testUsers.admin.email} '${CONFIG.testUsers.admin.password}' '${CONFIG.testUsers.admin.expectedRole}' admin_test_session`, 'Login as admin for isolation test');
    await executeCliCommand('use-session admin_test_session', 'Switch to admin session');

    const adminWhoami = await executeCliCommand('whoami', 'Verify admin session');
    const adminHasAccess = adminWhoami.stdout.includes(CONFIG.testUsers.admin.email);

    // Login as SME
    await executeCliCommand(`login-as ${CONFIG.testUsers.sme.email} '${CONFIG.testUsers.sme.password}' '${CONFIG.testUsers.sme.expectedRole}' sme_test_session`, 'Login as SME for isolation test');
    await executeCliCommand('use-session sme_test_session', 'Switch to SME session');

    const smeWhoami = await executeCliCommand('whoami', 'Verify SME session');
    const smeHasAccess = smeWhoami.stdout.includes(CONFIG.testUsers.sme.email);

    // Switch back to admin session
    await executeCliCommand('use-session admin_test_session', 'Switch back to admin session');
    const adminWhoami2 = await executeCliCommand('whoami', 'Verify admin session after switch');
    const adminStillHasAccess = adminWhoami2.stdout.includes(CONFIG.testUsers.admin.email);

    if (adminHasAccess && smeHasAccess && adminStillHasAccess) {
      logTest(testName, 'PASS', {
        adminSessionIsolated: true,
        smeSessionIsolated: true,
        sessionSwitchingWorks: true
      });
    } else {
      logTest(testName, 'FAIL', {
        adminSessionIsolated: adminHasAccess,
        smeSessionIsolated: smeHasAccess,
        sessionSwitchingWorks: adminStillHasAccess
      });
    }

  } catch (error) {
    logTest(testName, 'ERROR', { error: error.message });
  }
}

// Generate comprehensive test report
function generateReport() {
  log('\n📊 RBAC SECURITY TEST REPORT');
  log('=' .repeat(50));

  // Summary
  log(`\n📈 SUMMARY:`);
  log(`Total Tests: ${testResults.summary.totalTests}`);
  log(`Passed: ${testResults.summary.passedTests}`);
  log(`Failed: ${testResults.summary.failedTests}`);
  log(`Security Breaches: ${testResults.summary.securityBreachTests}`);
  log(`Success Rate: ${((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(1)}%`);

  // Security Issues
  if (testResults.securityIssues.length > 0) {
    log(`\n🚨 SECURITY ISSUES DETECTED:`);
    testResults.securityIssues.forEach((issue, index) => {
      log(`${index + 1}. ${issue.message}`);
    });
  }

  // Test Results by Category
  const passedTests = testResults.tests.filter(t => t.result === 'PASS');
  const failedTests = testResults.tests.filter(t => t.result !== 'PASS');
  const securityBreaches = testResults.tests.filter(t => t.result === 'SECURITY_BREACH');

  if (passedTests.length > 0) {
    log(`\n✅ PASSED TESTS:`);
    passedTests.forEach(test => log(`✓ ${test.testName}`));
  }

  if (failedTests.length > 0) {
    log(`\n❌ FAILED TESTS:`);
    failedTests.forEach(test => log(`✗ ${test.testName}`));
  }

  if (securityBreaches.length > 0) {
    log(`\n🚨 SECURITY BREACHES:`);
    securityBreaches.forEach(test => {
      log(`🔴 ${test.testName}`);
      if (test.details.vulnerability) {
        log(`   Vulnerability: ${test.details.vulnerability}`);
      }
    });
  }

  // Overall Assessment
  log(`\n🎯 OVERALL ASSESSMENT:`);
  if (testResults.summary.securityBreachTests === 0) {
    log('✅ SECURITY: PASS - No RBAC bypasses detected');
  } else {
    log('🚨 SECURITY: FAIL - RBAC bypasses detected');
  }

  if (testResults.summary.failedTests === 0) {
    log('✅ FUNCTIONALITY: PASS - All tests passed');
  } else {
    log('⚠️ FUNCTIONALITY: ISSUES - Some tests failed');
  }

  // Recommendations
  if (testResults.summary.securityBreachTests > 0) {
    log(`\n💡 RECOMMENDATIONS:`);
    log('1. Immediate: Fix RBAC bypass vulnerabilities');
    log('2. Review: Session management implementation');
    log('3. Enhance: Add additional security logging');
    log('4. Monitor: Implement security monitoring');
  }
}

// Main test execution
async function runRBACSecurityTests() {
  log('🚀 Starting PosalPro MVP2 RBAC Security Testing');
  log('=' .repeat(60));

  try {
    // Phase 1: Authentication & Session Management
    await testAuthentication();

    // Phase 2: RBAC Enforcement for Admin Endpoints
    await testRBACEnforcement();

    // Phase 3: Non-Admin Endpoint Access
    await testNonAdminAccess();

    // Phase 4: Session Isolation
    await testSessionIsolation();

  } catch (error) {
    log(`Critical test execution error: ${error.message}`, 'error');
  }

  // Generate final report
  generateReport();

  // Exit with appropriate code
  const exitCode = testResults.summary.securityBreachTests > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Execute tests
if (require.main === module) {
  runRBACSecurityTests().catch(error => {
    log(`Test suite failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runRBACSecurityTests, CONFIG, testResults };
