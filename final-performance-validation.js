#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');

// Performance validation configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  pages: [
    { name: 'Dashboard', path: '/dashboard', target: 3000 },
    { name: 'Products', path: '/dashboard/products', target: 3000 },
    { name: 'Customers', path: '/dashboard/customers', target: 2000 },
    { name: 'Proposals Create', path: '/dashboard/proposals/create', target: 2000 },
    { name: 'Login', path: '/auth/login', target: 1500 },
  ],
  performance: {
    acceptableLoadTime: 3000,
    goodLoadTime: 2000,
    excellentLoadTime: 1000,
  },
};

class PerformanceValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🚀 Starting PosalPro Performance Validation...\n');

    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    console.log('✅ Browser initialized successfully');
  }

  async measurePagePerformance(pageName, path, targetTime) {
    console.log(`📊 Testing ${pageName} (${path})...`);

    try {
      const startTime = Date.now();

      await this.page.goto(`${CONFIG.baseUrl}${path}`, {
        waitUntil: 'networkidle0',
        timeout: CONFIG.timeout,
      });

      await this.page.waitForTimeout(1000);
      const loadTime = Date.now() - startTime;

      let rating = '❌ Poor';
      if (loadTime <= CONFIG.performance.excellentLoadTime) {
        rating = '🟢 Excellent';
      } else if (loadTime <= CONFIG.performance.goodLoadTime) {
        rating = '🟡 Good';
      } else if (loadTime <= CONFIG.performance.acceptableLoadTime) {
        rating = '🟠 Acceptable';
      }

      const result = {
        page: pageName,
        path,
        loadTime,
        targetTime,
        rating,
        success: loadTime <= targetTime,
        improvement: loadTime <= targetTime ? '✅ Meets Target' : '⚠️ Exceeds Target',
      };

      this.results.push(result);
      console.log(`   Load Time: ${loadTime}ms (Target: ${targetTime}ms) ${rating}`);
      console.log(`   Status: ${result.improvement}\n`);

      return result;
    } catch (error) {
      console.log(`   ❌ Error testing ${pageName}: ${error.message}\n`);

      const errorResult = {
        page: pageName,
        path,
        loadTime: CONFIG.timeout,
        targetTime,
        rating: '❌ Failed',
        error: error.message,
        success: false,
        improvement: '❌ Test Failed',
      };

      this.results.push(errorResult);
      return errorResult;
    }
  }

  generateReport() {
    console.log('📈 PERFORMANCE VALIDATION REPORT');
    console.log('='.repeat(50));

    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(
      `   Successful: ${successfulTests} (${Math.round((successfulTests / totalTests) * 100)}%)`
    );
    console.log(`   Failed: ${failedTests} (${Math.round((failedTests / totalTests) * 100)}%)`);

    const avgLoadTime =
      this.results
        .filter(r => r.loadTime && r.loadTime < CONFIG.timeout)
        .reduce((sum, r) => sum + r.loadTime, 0) /
      this.results.filter(r => r.loadTime && r.loadTime < CONFIG.timeout).length;

    console.log(`   Average Load Time: ${Math.round(avgLoadTime)}ms`);

    console.log(`\n📋 DETAILED RESULTS:`);
    this.results.forEach(result => {
      console.log(`\n   ${result.page}:`);
      console.log(`     Load Time: ${result.loadTime}ms (Target: ${result.targetTime}ms)`);
      console.log(`     Rating: ${result.rating}`);
      console.log(`     Status: ${result.improvement}`);
    });

    console.log(`\n⏱️ Total validation time: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('\n🧹 Cleanup completed');
  }

  async run() {
    try {
      await this.initialize();

      for (const pageConfig of CONFIG.pages) {
        await this.measurePagePerformance(pageConfig.name, pageConfig.path, pageConfig.target);
      }

      this.generateReport();
    } catch (error) {
      console.error('❌ Validation failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

const validator = new PerformanceValidator();
validator.run().catch(console.error);
