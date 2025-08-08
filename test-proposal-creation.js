#!/usr/bin/env node

/**
 * Test script to verify proposal creation with correct product IDs
 * This script tests the fix for the 400 Bad Request error
 */

const fetch = require('node-fetch');

async function testProposalCreation() {
  console.log('🧪 Testing proposal creation with correct product IDs...');

  try {
    // First, let's get the available products to see their actual IDs
    console.log('📦 Fetching available products...');

    const productsResponse = await fetch('http://localhost:3000/api/products?page=1&limit=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!productsResponse.ok) {
      console.log(
        '❌ Failed to fetch products:',
        productsResponse.status,
        productsResponse.statusText
      );
      console.log('Response:', await productsResponse.text());
      return;
    }

    const productsData = await productsResponse.json();
    console.log('✅ Products fetched successfully');
    console.log('📋 Available products:');

    if (productsData.success && productsData.data?.products) {
      productsData.data.products.forEach(product => {
        console.log(
          `  - ID: ${product.id}, Name: ${product.name}, SKU: ${product.sku}, Price: $${product.price}`
        );
      });

      // Use the first product for testing
      const testProduct = productsData.data.products[0];
      console.log(`\n🎯 Using product for test: ${testProduct.name} (ID: ${testProduct.id})`);

      // Test proposal creation with correct product ID
      const proposalData = {
        title: 'Test Proposal - Fixed Product IDs',
        description: 'Testing proposal creation with correct database product IDs',
        customerId: 'cmbgvm5ww00006gox6gg0a3t4', // Use a valid customer ID
        priority: 'MEDIUM',
        dueDate: '2025-08-30T00:00:00.000Z',
        value: testProduct.price,
        currency: 'USD',
        products: [
          {
            productId: testProduct.id, // Use the actual database product ID
            quantity: 1,
            unitPrice: testProduct.price,
            discount: 0,
          },
        ],
      };

      console.log('\n📝 Creating proposal with data:', JSON.stringify(proposalData, null, 2));

      const proposalResponse = await fetch('http://localhost:3000/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proposalData),
      });

      console.log(`\n📊 Proposal creation response status: ${proposalResponse.status}`);

      const proposalResult = await proposalResponse.json();
      console.log('📄 Response:', JSON.stringify(proposalResult, null, 2));

      if (proposalResponse.ok && proposalResult.success) {
        console.log('✅ SUCCESS: Proposal created successfully with correct product IDs!');
        console.log('🎉 The fix for the 400 Bad Request error is working!');
      } else {
        console.log('❌ FAILED: Proposal creation still has issues');
        console.log('Error details:', proposalResult.error);
      }
    } else {
      console.log('❌ No products found in response');
      console.log('Response:', JSON.stringify(productsData, null, 2));
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testProposalCreation()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
