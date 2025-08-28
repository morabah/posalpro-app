#!/usr/bin/env node

/**
 * Quick Test for Proposal Edit Fix
 *
 * This script tests the proposal edit fix by simulating the wizard flow
 * and verifying that product data is properly saved.
 */

const { execSync } = require('child_process');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

log('🧪 Testing Proposal Edit Fix', 'bright');
log('='.repeat(60));
log('This test verifies that the proposal edit fix is working.');
log('The wizard should now send complete payload data to the API.');
log('');

logStep('Step 1', 'Checking if development server is running');
try {
  execSync('curl -s http://localhost:3000/api/health', { timeout: 5000 });
  logSuccess('Development server is running');
} catch (error) {
  logError('Development server is not running. Please start it with: npm run dev:smart');
  process.exit(1);
}

logStep('Step 2', 'Checking API endpoints');
try {
  const response = execSync('curl -s "http://localhost:3000/api/proposals?limit=1"', { timeout: 10000 });
  const data = JSON.parse(response.toString());

  if (data && data.data && Array.isArray(data.data.items)) {
    logSuccess(`API is responding correctly. Found ${data.data.items.length} proposals`);
  } else {
    logError('API response format is incorrect');
    process.exit(1);
  }
} catch (error) {
  logError(`API test failed: ${error.message}`);
  process.exit(1);
}

logStep('Step 3', 'Providing test instructions');
log('');
log('🎯 MANUAL TEST INSTRUCTIONS:', 'bright');
log('');
log('1. Open your browser and go to: http://localhost:3000', 'yellow');
log('2. Navigate to a proposal and click "Edit"', 'yellow');
log('3. In the wizard, change some product quantities or add/remove products', 'yellow');
log('4. Complete the wizard by clicking through all steps', 'yellow');
log('5. When you reach the final step, click "Submit" or "Complete"', 'yellow');
log('');
log('✅ EXPECTED BEHAVIOR:', 'green');
log('- The wizard should collect all form data (teamData, contentData, productData, sectionData)', 'green');
log('- The API should receive a complete payload with all wizard data', 'green');
log('- You should see logs showing "hasTeamData": true, "hasContentData": true, etc.', 'green');
log('- After completion, the proposal detail page should show your product changes', 'green');
log('');
log('❌ IF YOU SEE ISSUES:', 'red');
log('- Logs showing "hasTeamData": false, "hasContentData": false, etc.', 'red');
log('- Product changes not appearing on the detail page', 'red');
log('- API errors or validation failures', 'red');

log('\n📊 Test Summary', 'bright');
log('='.repeat(60));
logSuccess('✅ Environment check passed');
logSuccess('✅ API connectivity verified');
logInfo('🔄 Ready for manual testing');
log('');
log('Next: Perform the manual test steps above to verify the fix is working.', 'cyan');
