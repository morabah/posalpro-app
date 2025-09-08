/**
 * Test script to verify proposal API error handling
 */

const API_BASE = 'http://localhost:3000/api';

async function testProposalAPI() {
  console.log('🧪 Testing Proposal API Error Handling...\n');

  // Test 1: Invalid proposal ID (should return 404)
  console.log('Test 1: Invalid proposal ID "c"');
  try {
    const response = await fetch(`${API_BASE}/proposals/c`);
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    if (response.status === 404 && data.code === 'DATA_4000') {
      console.log('✅ PASS: Correct 404 response with proper error code');
    } else {
      console.log('❌ FAIL: Expected 404 with DATA_4000 error code');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Another invalid proposal ID
  console.log('Test 2: Invalid proposal ID "nonexistent"');
  try {
    const response = await fetch(`${API_BASE}/proposals/nonexistent`);
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    if (response.status === 404 && data.code === 'DATA_4000') {
      console.log('✅ PASS: Correct 404 response with proper error code');
    } else {
      console.log('❌ FAIL: Expected 404 with DATA_4000 error code');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n🧪 Test completed!');
}

// Run the test
testProposalAPI().catch(console.error);










