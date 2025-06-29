/**
 * PosalPro MVP2 - Proposals API Test Script
 * Test to verify that the proposals API endpoint is functioning correctly after fixes
 * 
 * This script uses fetch API to make authenticated requests to the proposals endpoint
 * Run with: node test-proposals-api.js
 */

const fetch = require('node-fetch');

async function testProposalsApi() {
  console.log('Testing Proposals API...');
  
  try {
    // Step 1: Get a session token (you'll need to replace this with a valid session token)
    // For testing, you can copy a session token from your browser after logging in
    // or use a test user account
    
    // This is a placeholder - you'll need to replace with a valid token
    const sessionToken = 'YOUR_SESSION_TOKEN';
    
    // Step 2: Make an authenticated request to the proposals API
    const response = await fetch('http://localhost:3000/api/proposals?limit=5', {
      headers: {
        'Cookie': `next-auth.session-token=${sessionToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Log the response status
    console.log('Response status:', response.status);
    
    // Get the response body
    const data = await response.json();
    
    // Log the response data
    if (response.ok) {
      console.log('Success! Proposals API returned data:');
      console.log('Number of proposals:', data.data.length);
      console.log('Pagination info:', data.pagination);
    } else {
      console.log('API returned an error:', data);
    }
  } catch (error) {
    console.error('Error testing proposals API:', error);
  }
}

testProposalsApi();
