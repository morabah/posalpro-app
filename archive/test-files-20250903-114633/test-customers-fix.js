#!/usr/bin/env node

async function testCustomersFix() {
  try {
    console.log('🧪 Testing customers API fix...');

    const response = await fetch('http://localhost:3000/api/customers?limit=3');
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API call failed:', response.status, data);
      return;
    }

    console.log('✅ Customers API call successful');
    console.log('📊 Response data keys:', Object.keys(data.data || {}));

    if (data.data?.items?.length > 0) {
      const firstCustomer = data.data.items[0];
      console.log('🏷️  First customer tags:', firstCustomer.tags);
      console.log('🏢 First customer name:', firstCustomer.name);
      console.log('📧 First customer email:', firstCustomer.email);
      console.log('📝 Tags type:', typeof firstCustomer.tags);

      if (Array.isArray(firstCustomer.tags)) {
        console.log('✅ Customer tags are properly parsed as array!');
      } else {
        console.log('❌ Customer tags are not an array - fix needed');
      }
    } else {
      console.log('ℹ️  No customers found in database');
    }
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testCustomersFix();
