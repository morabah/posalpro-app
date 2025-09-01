const { execSync } = require('child_process');

console.log('🧪 TESTING REAL PRODUCT DATA FROM API');
console.log('=====================================\n');

try {
  const baseUrl = 'http://localhost:3000';
  const testUrl = `${baseUrl}/api/proposals/cmf0r4nhu003fjr10acbdosf7/versions?version=1&detail=1`;

  console.log('🔍 Testing API endpoint:', testUrl);
  console.log('Waiting for response...\n');

  try {
    // Use curl to get the full response
    const curlCommand = `curl -s -w "\\n=== HTTP STATUS ===\\n%{http_code}\\n=== RESPONSE TIME ===\\n%{time_total}s\\n" "${testUrl}" -H "Content-Type: application/json"`;
    const result = execSync(curlCommand, { encoding: 'utf8', timeout: 10000 });

    console.log('📄 RAW RESPONSE:');
    console.log('================');
    console.log(result);
    console.log('================\\n');

    // Try to parse as JSON if possible
    const parts = result.split('\\n=== HTTP STATUS ===\\n');
    if (parts.length > 0) {
      const responseBody = parts[0];
      try {
        const parsed = JSON.parse(responseBody);
        console.log('✅ Valid JSON Response:');
        console.log('========================');
        console.log(JSON.stringify(parsed, null, 2));
        console.log('========================\\n');

        if (parsed.ok && parsed.data) {
          console.log('🎉 SUCCESS! Real product data returned:');
          console.log('- Version:', parsed.data.version);
          console.log('- Total Value:', parsed.data.totalValue);
          console.log('- Customer:', parsed.data.customerName);
          console.log('- Modified by:', parsed.data.createdByName);
          console.log('- Added products count:', parsed.data.diff?.added?.length || 0);
          console.log('- Removed products count:', parsed.data.diff?.removed?.length || 0);
          console.log('- Updated products count:', parsed.data.diff?.updated?.length || 0);

          if (parsed.data.diff?.added?.length > 0) {
            console.log('\\n📦 ADDED PRODUCTS:');
            console.log('==================');
            parsed.data.diff.added.forEach(productId => {
              const productInfo = parsed.data.productsMap[productId];
              if (productInfo) {
                console.log(`- ${productInfo.name} (SKU: ${productInfo.sku || 'N/A'})`);
              } else {
                console.log(`- ${productId} (Product info not found)`);
              }
            });
          }

          // Check if it's showing real data vs test data
          const isTestData = parsed.data.totalValue === 50000 &&
                            parsed.data.customerName === 'Real Customer' &&
                            parsed.data.createdByName === 'System';

          if (isTestData) {
            console.log('\\n❌ STILL SHOWING TEST DATA - Need to fix API');
          } else {
            console.log('\\n✅ SHOWING REAL DATABASE DATA! 🎊');
          }
        } else {
          console.log('❌ API returned error or invalid data');
        }
      } catch (parseError) {
        console.log('❌ Response is not valid JSON');
        console.log('Parse error:', parseError.message);
      }
    }

  } catch (curlError) {
    console.log('❌ Curl command failed');
    console.log('Error:', curlError.message);
  }
} catch (error) {
  console.log('❌ Test script error');
  console.log('Error:', error.message);
}


