#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function quickStatusCheck() {
  console.log('🔍 Quick Status Check - Testing System Health...\n');

  let browser;
  try {
    // Launch browser with optimized settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    const results = {
      serverHealth: '❌ Not Tested',
      pageLoads: '❌ Not Tested',
      apiResponses: '❌ Not Tested',
      authentication: '❌ Not Tested',
    };

    // Test 1: Server Health
    console.log('1️⃣ Testing Server Health...');
    try {
      const healthResponse = await page.goto('http://localhost:3000/api/health', {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });

      if (healthResponse && healthResponse.status() === 200) {
        results.serverHealth = '✅ Healthy';
        console.log('   ✅ Server is responding');
      } else {
        results.serverHealth = '⚠️ Issues detected';
        console.log('   ⚠️ Server response issues');
      }
    } catch (error) {
      results.serverHealth = '❌ Failed';
      console.log('   ❌ Server not responding');
    }

    // Test 2: Page Load Performance
    console.log('\n2️⃣ Testing Page Load Performance...');
    const pages = [
      { name: 'Dashboard', url: 'http://localhost:3000/dashboard' },
      { name: 'Products', url: 'http://localhost:3000/products' },
      { name: 'Customers', url: 'http://localhost:3000/customers' },
    ];

    let totalLoadTime = 0;
    let successfulLoads = 0;

    for (const pageTest of pages) {
      try {
        const startTime = Date.now();
        const response = await page.goto(pageTest.url, {
          waitUntil: 'networkidle0',
          timeout: 15000,
        });
        const loadTime = Date.now() - startTime;
        totalLoadTime += loadTime;

        if (response && response.status() === 200) {
          successfulLoads++;
          console.log(`   ✅ ${pageTest.name}: ${loadTime}ms`);
        } else {
          console.log(`   ⚠️ ${pageTest.name}: ${loadTime}ms (status: ${response?.status()})`);
        }
      } catch (error) {
        console.log(`   ❌ ${pageTest.name}: Failed to load`);
      }
    }

    const avgLoadTime = successfulLoads > 0 ? Math.round(totalLoadTime / successfulLoads) : 0;
    if (avgLoadTime < 3000 && successfulLoads >= 2) {
      results.pageLoads = `✅ Good (${avgLoadTime}ms avg)`;
    } else if (avgLoadTime < 10000 && successfulLoads >= 1) {
      results.pageLoads = `⚠️ Slow (${avgLoadTime}ms avg)`;
    } else {
      results.pageLoads = '❌ Poor performance';
    }

    // Test 3: API Response Test
    console.log('\n3️⃣ Testing API Responses...');
    const apiTests = [
      { name: 'Health', url: 'http://localhost:3000/api/health' },
      { name: 'Session', url: 'http://localhost:3000/api/auth/session' },
    ];

    let apiSuccesses = 0;
    for (const apiTest of apiTests) {
      try {
        const response = await page.goto(apiTest.url, {
          waitUntil: 'networkidle0',
          timeout: 10000,
        });

        if (response && response.status() < 500) {
          apiSuccesses++;
          console.log(`   ✅ ${apiTest.name}: ${response.status()}`);
        } else {
          console.log(`   ⚠️ ${apiTest.name}: ${response?.status()}`);
        }
      } catch (error) {
        console.log(`   ❌ ${apiTest.name}: Failed`);
      }
    }

    results.apiResponses =
      apiSuccesses >= 2 ? '✅ Good' : apiSuccesses >= 1 ? '⚠️ Partial' : '❌ Failed';

    // Test 4: Authentication Pages
    console.log('\n4️⃣ Testing Authentication...');
    try {
      const loginResponse = await page.goto('http://localhost:3000/auth/login', {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });

      if (loginResponse && loginResponse.status() === 200) {
        results.authentication = '✅ Accessible';
        console.log('   ✅ Login page accessible');
      } else {
        results.authentication = '⚠️ Issues';
        console.log('   ⚠️ Login page issues');
      }
    } catch (error) {
      results.authentication = '❌ Failed';
      console.log('   ❌ Authentication pages not accessible');
    }

    // Summary Report
    console.log('\n📊 QUICK STATUS SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`🏥 Server Health:     ${results.serverHealth}`);
    console.log(`📄 Page Loads:        ${results.pageLoads}`);
    console.log(`🔌 API Responses:     ${results.apiResponses}`);
    console.log(`🔐 Authentication:    ${results.authentication}`);
    console.log('═══════════════════════════════════════');

    // Overall Status
    const healthyCount = Object.values(results).filter(r => r.startsWith('✅')).length;
    const totalTests = Object.keys(results).length;

    if (healthyCount === totalTests) {
      console.log('🎉 OVERALL STATUS: EXCELLENT - All systems operational!');
    } else if (healthyCount >= totalTests * 0.75) {
      console.log('✅ OVERALL STATUS: GOOD - Most systems operational');
    } else if (healthyCount >= totalTests * 0.5) {
      console.log('⚠️ OVERALL STATUS: FAIR - Some issues detected');
    } else {
      console.log('❌ OVERALL STATUS: POOR - Multiple issues detected');
    }

    console.log(`\n📈 System Health Score: ${Math.round((healthyCount / totalTests) * 100)}%`);
  } catch (error) {
    console.error('❌ Status check failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the status check
quickStatusCheck().catch(console.error);
