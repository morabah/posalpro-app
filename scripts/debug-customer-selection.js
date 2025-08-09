const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testCustomerAPI() {
  try {
    console.log('🧪 Testing customer API endpoint...');

    // First, let's try to get customers without authentication
    const response = await axios.get(`${BASE_URL}/api/customers`, {
      validateStatus: () => true, // Don't throw on error status
    });

    console.log('📊 Response status:', response.status);
    console.log('📝 Response data:', JSON.stringify(response.data, null, 2));

    if (response.status === 200 && response.data?.data?.customers) {
      const customers = response.data.data.customers;
      console.log('✅ Found customers:', customers.length);

      if (customers.length > 0) {
        const firstCustomer = customers[0];
        console.log('📋 First customer details:', {
          id: firstCustomer.id,
          idType: typeof firstCustomer.id,
          idLength: firstCustomer.id?.length,
          name: firstCustomer.name,
          email: firstCustomer.email,
          industry: firstCustomer.industry,
          tier: firstCustomer.tier,
        });

        // Test if this customer ID would pass the API validation
        const isValidId =
          firstCustomer.id &&
          typeof firstCustomer.id === 'string' &&
          firstCustomer.id.length > 0 &&
          firstCustomer.id !== 'undefined' &&
          firstCustomer.id !== 'null';

        console.log('🔍 Customer ID validation:', {
          isValid: isValidId,
          id: firstCustomer.id,
          checks: {
            exists: !!firstCustomer.id,
            isString: typeof firstCustomer.id === 'string',
            hasLength: firstCustomer.id?.length > 0,
            notUndefined: firstCustomer.id !== 'undefined',
            notNull: firstCustomer.id !== 'null',
          },
        });
      }
    } else {
      console.log('❌ Could not get customers:', response.status);
      console.log('📄 Error response:', response.data);
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
testCustomerAPI();



