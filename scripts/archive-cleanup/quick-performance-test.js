#!/usr/bin/env node

const puppeteer = require('puppeteer');

class QuickPerformanceTest {
  constructor() {
    this.results = [];
    this.serverUrl = 'http://localhost:3000';
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m',
    };
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async runQuickTest() {
    let browser, page;

    try {
      this.log('🚀 Starting Quick Performance Test...', 'info');

      // Initialize browser with memory optimization
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--max_old_space_size=8192',
          '--memory-pressure-off',
        ],
      });

      page = await browser.newPage();
      await page.setViewport({ width: 1366, height: 768 });

      // Add memory monitoring
      await page.evaluateOnNewDocument(() => {
        window.memoryMonitor = {
          checkMemory: () => {
            if (performance.memory) {
              const used = performance.memory.usedJSHeapSize;
              const total = performance.memory.totalJSHeapSize;
              const percentage = (used / total) * 100;
              return { used, total, percentage };
            }
            return null;
          },
        };
      });

      // Test 1: Page Load Performance
      this.log('📊 Testing page load performance...', 'info');
      const startTime = performance.now();

      await page.goto(`${this.serverUrl}/auth/login`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      this.log(`📄 Login page loaded in ${loadTime.toFixed(0)}ms`, 'success');

      // Test 2: Memory Usage
      const memoryInfo = await page.evaluate(() => {
        return window.memoryMonitor ? window.memoryMonitor.checkMemory() : null;
      });

      if (memoryInfo) {
        this.log(`💾 Memory usage: ${memoryInfo.percentage.toFixed(1)}%`, 'info');
      }

      // Test 3: API Performance
      this.log('🌐 Testing API performance...', 'info');

      const apiTests = [
        { name: 'Health Check', endpoint: '/api/health' },
        { name: 'Auth Session', endpoint: '/api/auth/session' },
      ];

      for (const api of apiTests) {
        const apiStartTime = performance.now();

        const response = await page.evaluate(async endpoint => {
          const response = await fetch(endpoint);
          return { status: response.status };
        }, api.endpoint);

        const apiEndTime = performance.now();
        const apiDuration = apiEndTime - apiStartTime;

        this.log(`🔗 ${api.name}: ${apiDuration.toFixed(0)}ms (${response.status})`, 'success');
      }

      // Test 4: User Interaction Performance
      this.log('⚡ Testing user interaction performance...', 'info');

      const buttons = await page.$$('button');
      if (buttons.length > 0) {
        const interactionStartTime = performance.now();
        await buttons[0].click();
        const interactionEndTime = performance.now();
        const interactionTime = interactionEndTime - interactionStartTime;

        this.log(`👆 Button click response: ${interactionTime.toFixed(0)}ms`, 'success');
      }

      // Test 5: Memory Cleanup Test
      this.log('🧹 Testing memory cleanup...', 'info');

      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });

      const memoryAfterCleanup = await page.evaluate(() => {
        return window.memoryMonitor ? window.memoryMonitor.checkMemory() : null;
      });

      if (memoryAfterCleanup) {
        this.log(`💾 Memory after cleanup: ${memoryAfterCleanup.percentage.toFixed(1)}%`, 'info');
      }

      this.log('✅ Quick performance test completed successfully!', 'success');

      return {
        pageLoadTime: loadTime,
        memoryUsage: memoryInfo?.percentage,
        memoryAfterCleanup: memoryAfterCleanup?.percentage,
        status: 'success',
      };
    } catch (error) {
      this.log(`❌ Test failed: ${error.message}`, 'error');
      return { status: 'failed', error: error.message };
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }
}

// Run the test
async function main() {
  const test = new QuickPerformanceTest();
  const results = await test.runQuickTest();

  console.log('\n📊 Quick Test Results:', JSON.stringify(results, null, 2));

  process.exit(results.status === 'success' ? 0 : 1);
}

main().catch(console.error);
