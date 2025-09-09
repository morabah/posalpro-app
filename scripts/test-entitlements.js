#!/usr/bin/env node

/**
 * Test script for entitlement system validation
 * Usage: node scripts/test-entitlements.js
 */

const {
  PLAN_TIER_ENTITLEMENTS,
  hasEntitlement,
  getEntitlementsForPlan,
  getAllEntitlementKeys,
  isEntitlementAvailable,
  getMinimumTierForEntitlement,
  getUpgradeEntitlements
} = require('../src/lib/billing/entitlementMapping.ts');

console.log('🧪 Testing PosalPro Entitlement System\n');

// Test 1: Plan tier entitlements
console.log('1. Testing plan tier entitlements:');
Object.entries(PLAN_TIER_ENTITLEMENTS).forEach(([tier, entitlements]) => {
  console.log(`   ${tier}: ${entitlements.length} entitlements`);
  entitlements.forEach(ent => console.log(`     ✅ ${ent}`));
});

// Test 2: hasEntitlement function
console.log('\n2. Testing hasEntitlement function:');
const testCases = [
  ['FREE', 'feature.analytics.dashboard', true],
  ['FREE', 'feature.products.create', false],
  ['PRO', 'feature.analytics.insights', true],
  ['ENTERPRISE', 'feature.analytics.enhanced', true],
];

testCases.forEach(([tier, entitlement, expected]) => {
  const result = hasEntitlement(tier, entitlement);
  const status = result === expected ? '✅' : '❌';
  console.log(`   ${status} ${tier} has ${entitlement}: ${result} (expected: ${expected})`);
});

// Test 3: getEntitlementsForPlan function
console.log('\n3. Testing getEntitlementsForPlan function:');
['FREE', 'PRO', 'ENTERPRISE'].forEach(tier => {
  const entitlements = getEntitlementsForPlan(tier);
  console.log(`   ${tier}: ${entitlements.join(', ')}`);
});

// Test 4: getAllEntitlementKeys function
console.log('\n4. Testing getAllEntitlementKeys function:');
const allKeys = getAllEntitlementKeys();
console.log(`   All entitlement keys (${allKeys.length}): ${allKeys.join(', ')}`);

// Test 5: isEntitlementAvailable function
console.log('\n5. Testing isEntitlementAvailable function:');
const testEntitlements = [
  'feature.analytics.dashboard',
  'feature.products.create',
  'feature.nonexistent.feature'
];

testEntitlements.forEach(entitlement => {
  const available = isEntitlementAvailable(entitlement);
  console.log(`   ${available ? '✅' : '❌'} ${entitlement} is ${available ? '' : 'not '}available`);
});

// Test 6: getMinimumTierForEntitlement function
console.log('\n6. Testing getMinimumTierForEntitlement function:');
const tierTests = [
  'feature.analytics.dashboard',
  'feature.analytics.insights',
  'feature.analytics.enhanced',
  'feature.nonexistent.feature'
];

tierTests.forEach(entitlement => {
  const minTier = getMinimumTierForEntitlement(entitlement);
  console.log(`   ${entitlement}: ${minTier || 'Not available'}`);
});

// Test 7: getUpgradeEntitlements function
console.log('\n7. Testing getUpgradeEntitlements function:');
['FREE', 'PRO'].forEach(tier => {
  const upgrades = getUpgradeEntitlements(tier);
  console.log(`   ${tier} upgrade entitlements: ${upgrades.join(', ')}`);
});

console.log('\n🎉 Entitlement system test completed!');

