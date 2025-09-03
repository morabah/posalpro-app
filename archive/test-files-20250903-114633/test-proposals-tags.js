#!/usr/bin/env node

async function testProposalsTags() {
  try {
    console.log('🧪 Testing proposals API tags fix...');

    const response = await fetch('http://localhost:3000/api/proposals?limit=5');
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API call failed:', response.status, data);
      return;
    }

    console.log('✅ API call successful');
    console.log('📊 Response data keys:', Object.keys(data.data || {}));

    if (data.data?.items?.length > 0) {
      const firstProposal = data.data.items[0];
      console.log('🏷️  First proposal tags:', firstProposal.tags);
      console.log('📝 Tags type:', typeof firstProposal.tags);
      console.log(
        '📏 Tags length:',
        Array.isArray(firstProposal.tags) ? firstProposal.tags.length : 'N/A'
      );

      if (Array.isArray(firstProposal.tags)) {
        console.log('✅ Tags are properly parsed as array!');
      } else {
        console.log('❌ Tags are not an array - fix needed');
      }
    } else {
      console.log('ℹ️  No proposals found in database');
    }
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testProposalsTags();
