const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data that should match the API schema
const testProposalData = {
  title: 'Test Proposal',
  description: 'Test proposal description',
  customerId: 'test-customer-id', // This will likely be the issue
  priority: 'MEDIUM',
  currency: 'USD',
  products: [],
  sections: [],
  teamAssignments: {},
  contentSelections: [],
  validationData: {
    isValid: true,
    completeness: 100,
    issues: [],
    complianceChecks: [],
  },
  analyticsData: {
    stepCompletionTimes: [],
    wizardCompletionRate: 1.0,
    complexityScore: 2,
    teamSize: 0,
    contentSuggestionsUsed: 0,
    validationIssuesFound: 0,
  },
  crossStepValidation: {
    teamCompatibility: true,
    contentAlignment: true,
    budgetCompliance: true,
    timelineRealistic: true,
  },
};

async function testProposalAPI() {
  try {
    console.log('🧪 Testing proposal API endpoint...');
    console.log('📤 Sending data:', JSON.stringify(testProposalData, null, 2));

    const response = await axios.post(`${BASE_URL}/api/proposals`, testProposalData, {
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: () => true, // Don't throw on error status
    });

    console.log('📊 Response status:', response.status);
    console.log('📄 Response headers:', response.headers);
    console.log('📝 Response data:', JSON.stringify(response.data, null, 2));

    if (response.status !== 201) {
      console.log('❌ API request failed with status:', response.status);
      if (response.data && response.data.error) {
        console.log('🔍 Error details:', response.data.error);
      }
      if (response.data && response.data.validationErrors) {
        console.log('🔍 Validation errors:', response.data.validationErrors);
      }
    } else {
      console.log('✅ API request successful');
    }
  } catch (error) {
    console.error('💥 Request failed:', error.message);
    if (error.response) {
      console.error('📊 Error response status:', error.response.status);
      console.error('📄 Error response data:', error.response.data);
    }
  }
}

// Run the test
testProposalAPI();









