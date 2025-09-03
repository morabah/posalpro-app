#!/usr/bin/env node

async function testProductsFix() {
  try {
    console.log('🧪 Testing products API fix...');

    const response = await fetch('http://localhost:3000/api/products?limit=3');
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API call failed:', response.status, data);
      return;
    }

    console.log('✅ Products API call successful');
    console.log('📊 Response data keys:', Object.keys(data.data || {}));

    if (data.data?.items?.length > 0) {
      const firstProduct = data.data.items[0];
      console.log('🏷️  First product tags:', firstProduct.tags);
      console.log('📂 First product category:', firstProduct.category);
      console.log('📝 Tags type:', typeof firstProduct.tags);
      console.log('📂 Category type:', typeof firstProduct.category);

      if (Array.isArray(firstProduct.tags)) {
        console.log('✅ Tags are properly parsed as array!');
      } else {
        console.log('❌ Tags are not an array - fix needed');
      }

      if (Array.isArray(firstProduct.category)) {
        console.log('✅ Category is properly parsed as array!');
      } else {
        console.log('❌ Category is not an array - fix needed');
      }
    } else {
      console.log('ℹ️  No products found in database');
    }
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testProductsFix();
