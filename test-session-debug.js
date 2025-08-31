/**
 * Test script to debug session and roles
 */

const http = require('http');

// Test endpoint to check session
async function testSession() {
  console.log('🔍 Testing session and roles...\n');

  // This would need to be run from a browser context or with proper session cookies
  console.log('💡 To test the session:');
  console.log('   1. Open browser developer tools');
  console.log('   2. Go to Application/Storage > Cookies');
  console.log('   3. Check for next-auth.session-token cookie');
  console.log('   4. Or use the /api/auth/session endpoint');
  console.log('');

  console.log('🔑 Default admin credentials from seed:');
  console.log('   Email: admin@posalpro.com');
  console.log('   Password: ProposalPro2024!');
  console.log('   Role: System Administrator');
  console.log('');

  console.log('📡 API endpoints to test:');
  console.log('   GET /api/auth/session - Check current session');
  console.log('   GET /api/admin/users - Test admin access');
  console.log('');
}

// Run the test
testSession();
