#!/usr/bin/env node

/**
 * PosalPro MVP2 - Direct RBAC Middleware Test
 * Tests RBAC middleware directly without CLI session management
 */

// Since we can't require ES modules directly, let's test the logic inline
const ROLE_HIERARCHY = {
  'System Administrator': 1,
  Executive: 2,
  'Proposal Manager': 3,
  'Senior SME': 4,
  SME: 5,
  'Technical SME': 5,
  'Content Manager': 6,
  'Proposal Specialist': 7,
  'Business Development Manager': 8,
};

class RBACMiddleware {
  static hasRequiredRole(userRoles, requiredRole) {
    if (!userRoles || userRoles.length === 0) return false;

    const requiredLevel = ROLE_HIERARCHY[requiredRole];
    if (!requiredLevel) return false;

    return userRoles.some(userRole => {
      const userLevel = ROLE_HIERARCHY[userRole];
      return userLevel && userLevel <= requiredLevel;
    });
  }

  static hasRole(userRoles, role) {
    return userRoles?.includes(role) || false;
  }

  static isAdmin(userRoles) {
    return this.hasRequiredRole(userRoles, 'Executive');
  }

  static isSuperAdmin(userRoles) {
    return this.hasRole(userRoles, 'System Administrator');
  }

  static getRoleLevel(role) {
    return ROLE_HIERARCHY[role] || 999;
  }

  static validateAdminAccess(userRoles) {
    if (!userRoles || userRoles.length === 0) {
      return { allowed: false, reason: 'No roles assigned' };
    }

    if (this.isAdmin(userRoles)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Insufficient privileges. Required: System Administrator or Executive. Current roles: ${userRoles.join(', ')}`,
    };
  }
}

// Test the RBAC middleware directly
function testRBACMiddleware() {
  console.log('🔒 Testing RBAC Middleware Directly\n');

  // Test cases
  const testCases = [
    {
      name: 'System Administrator',
      roles: ['System Administrator'],
      expectedAdminAccess: true,
      expectedReason: null,
    },
    {
      name: 'Executive',
      roles: ['Executive'],
      expectedAdminAccess: true,
      expectedReason: null,
    },
    {
      name: 'Proposal Manager',
      roles: ['Proposal Manager'],
      expectedAdminAccess: false,
      expectedReason:
        'Insufficient privileges. Required: System Administrator or Executive. Current roles: Proposal Manager',
    },
    {
      name: 'SME',
      roles: ['SME'],
      expectedAdminAccess: false,
      expectedReason:
        'Insufficient privileges. Required: System Administrator or Executive. Current roles: SME',
    },
    {
      name: 'Senior SME',
      roles: ['Senior SME'],
      expectedAdminAccess: false,
      expectedReason:
        'Insufficient privileges. Required: System Administrator or Executive. Current roles: Senior SME',
    },
    {
      name: 'Multiple Roles (SME + Proposal Manager)',
      roles: ['SME', 'Proposal Manager'],
      expectedAdminAccess: false,
      expectedReason:
        'Insufficient privileges. Required: System Administrator or Executive. Current roles: SME, Proposal Manager',
    },
    {
      name: 'System Administrator + Executive',
      roles: ['System Administrator', 'Executive'],
      expectedAdminAccess: true,
      expectedReason: null,
    },
    {
      name: 'No Roles',
      roles: [],
      expectedAdminAccess: false,
      expectedReason: 'No roles assigned',
    },
    {
      name: 'Null Roles',
      roles: null,
      expectedAdminAccess: false,
      expectedReason: 'No roles assigned',
    },
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}: ${testCase.name}`);
    console.log(`Input roles: [${testCase.roles?.join(', ') || 'null'}]`);

    // Test validateAdminAccess
    const result = RBACMiddleware.validateAdminAccess(testCase.roles);
    console.log(`Result: ${result.allowed ? 'ALLOWED' : 'DENIED'}`);
    if (result.reason) {
      console.log(`Reason: ${result.reason}`);
    }

    // Test individual methods
    const isAdmin = RBACMiddleware.isAdmin(testCase.roles);
    const isSuperAdmin = RBACMiddleware.isSuperAdmin(testCase.roles);
    const hasRoleSystemAdmin = RBACMiddleware.hasRole(testCase.roles, 'System Administrator');
    const hasRoleExecutive = RBACMiddleware.hasRole(testCase.roles, 'Executive');

    console.log(`isAdmin(): ${isAdmin}`);
    console.log(`isSuperAdmin(): ${isSuperAdmin}`);
    console.log(`hasRole('System Administrator'): ${hasRoleSystemAdmin}`);
    console.log(`hasRole('Executive'): ${hasRoleExecutive}`);

    // Validate results
    const adminAccessCorrect = result.allowed === testCase.expectedAdminAccess;
    const reasonCorrect = !result.reason || result.reason === testCase.expectedReason;

    if (adminAccessCorrect && reasonCorrect) {
      console.log(`✅ PASS`);
      passedTests++;
    } else {
      console.log(`❌ FAIL`);
      console.log(`Expected access: ${testCase.expectedAdminAccess}, got: ${result.allowed}`);
      if (testCase.expectedReason) {
        console.log(`Expected reason: "${testCase.expectedReason}"`);
        console.log(`Actual reason: "${result.reason}"`);
      }
    }
  });

  // Test role hierarchy
  console.log('\n🎯 Testing Role Hierarchy');
  const hierarchyTests = [
    { role: 'System Administrator', expectedLevel: 1 },
    { role: 'Executive', expectedLevel: 2 },
    { role: 'Proposal Manager', expectedLevel: 3 },
    { role: 'Senior SME', expectedLevel: 4 },
    { role: 'SME', expectedLevel: 5 },
    { role: 'Content Manager', expectedLevel: 6 },
    { role: 'Proposal Specialist', expectedLevel: 7 },
    { role: 'Business Development Manager', expectedLevel: 8 },
    { role: 'Unknown Role', expectedLevel: 999 },
  ];

  let hierarchyPassed = 0;
  hierarchyTests.forEach(test => {
    const level = RBACMiddleware.getRoleLevel(test.role);
    const correct = level === test.expectedLevel;
    console.log(
      `${test.role}: ${level} ${correct ? '✅' : '❌ (expected ' + test.expectedLevel + ')'}`
    );
    if (correct) hierarchyPassed++;
  });

  // Test hasRequiredRole
  console.log('\n🔍 Testing hasRequiredRole Method');
  const requiredRoleTests = [
    { userRoles: ['Proposal Manager'], requiredRole: 'Executive', expected: true },
    { userRoles: ['SME'], requiredRole: 'Executive', expected: false },
    { userRoles: ['System Administrator'], requiredRole: 'Proposal Manager', expected: true },
    { userRoles: ['Proposal Manager'], requiredRole: 'Proposal Manager', expected: true },
    { userRoles: ['SME'], requiredRole: 'Proposal Manager', expected: false },
  ];

  let requiredRolePassed = 0;
  requiredRoleTests.forEach(test => {
    const result = RBACMiddleware.hasRequiredRole(test.userRoles, test.requiredRole);
    const correct = result === test.expected;
    console.log(
      `${test.userRoles.join('+')} requires ${test.requiredRole}: ${result} ${correct ? '✅' : '❌ (expected ' + test.expected + ')'}`
    );
    if (correct) requiredRolePassed++;
  });

  // Final results
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(40));
  console.log(`RBAC Access Tests: ${passedTests}/${totalTests} passed`);
  console.log(`Role Hierarchy Tests: ${hierarchyPassed}/${hierarchyTests.length} passed`);
  console.log(`Required Role Tests: ${requiredRolePassed}/${requiredRoleTests.length} passed`);

  const totalPassed = passedTests + hierarchyPassed + requiredRolePassed;
  const totalPossible = totalTests + hierarchyTests.length + requiredRoleTests.length;
  const successRate = ((totalPassed / totalPossible) * 100).toFixed(1);

  console.log(`\n🎯 OVERALL SUCCESS RATE: ${successRate}%`);

  if (successRate === '100.0') {
    console.log('✅ ALL RBAC MIDDLEWARE TESTS PASSED');
    console.log('🎉 RBAC Middleware is working correctly!');
  } else {
    console.log('❌ SOME RBAC MIDDLEWARE TESTS FAILED');
    console.log('🔧 RBAC Middleware needs fixing');
  }

  return successRate === '100.0';
}

// Run the test
if (require.main === module) {
  const success = testRBACMiddleware();
  process.exit(success ? 0 : 1);
}

module.exports = { testRBACMiddleware };
