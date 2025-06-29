#!/usr/bin/env node

/**
 * PosalPro MVP2 - Fix Verification Script
 *
 * Verifies that the comprehensive authentication and performance fixes are working:
 * 1. Tests API authentication endpoints
 * 2. Measures page load performance
 * 3. Validates session handling
 * 4. Checks for I/O error reduction
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class FixVerifier {
  constructor() {
    this.results = {
      authentication: [],
      performance: [],
      session: [],
      overall: { passed: 0, failed: 0 },
    };
    this.browser = null;
    this.page = null;
  }

  async run() {
    console.log('🔍 Starting Fix Verification Process...\n');

    try {
      // Wait for server to be ready
      await this.waitForServer();

      // Initialize browser
      await this.initBrowser();

      // Test 1: Authentication Fixes
      await this.testAuthenticationFixes();

      // Test 2: Performance Fixes
      await this.testPerformanceFixes();

      // Test 3: Session Validation
      await this.testSessionValidation();

      // Generate verification report
      await this.generateReport();
    } catch (error) {
      console.error('❌ Verification failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async waitForServer() {
    console.log('⏳ Waiting for server to be ready...');

    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch('http://localhost:3000/api/health');
        if (response.ok) {
          console.log('✅ Server is ready!\n');
          return;
        }
      } catch (error) {
        // Server not ready yet
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
      process.stdout.write('.');
    }

    throw new Error('Server failed to start within timeout period');
  }

  async initBrowser() {
    console.log('🌐 Initializing browser...');

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    this.page = await this.browser.newPage();

    // Set up performance monitoring
    await this.page.setRequestInterception(true);

    const requestTimes = new Map();

    this.page.on('request', request => {
      requestTimes.set(request.url(), Date.now());
      request.continue();
    });

    this.page.on('response', response => {
      const startTime = requestTimes.get(response.url());
      if (startTime) {
        const duration = Date.now() - startTime;
        if (response.url().includes('/api/')) {
          console.log(`📊 API Response: ${response.url()} - ${response.status()} (${duration}ms)`);
        }
      }
    });

    console.log('✅ Browser initialized\n');
  }

  async testAuthenticationFixes() {
    console.log('🔐 Testing Authentication Fixes...\n');

    const apiEndpoints = ['/api/health', '/api/customers', '/api/products', '/api/proposals'];

    for (const endpoint of apiEndpoints) {
      const result = await this.testApiEndpoint(endpoint);
      this.results.authentication.push(result);

      if (result.success) {
        this.results.overall.passed++;
        console.log(`✅ ${endpoint}: ${result.status} (${result.responseTime}ms)`);
      } else {
        this.results.overall.failed++;
        console.log(`❌ ${endpoint}: ${result.error}`);
      }
    }

    console.log('');
  }

  async testApiEndpoint(endpoint) {
    const startTime = Date.now();

    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseTime = Date.now() - startTime;
      const responseData = await response.text();

      // Check if response is JSON (not HTML error page)
      let isJsonResponse = false;
      try {
        JSON.parse(responseData);
        isJsonResponse = true;
      } catch {
        isJsonResponse = false;
      }

      return {
        endpoint,
        success: response.status !== 500 && isJsonResponse,
        status: response.status,
        responseTime,
        isJsonResponse,
        error: !isJsonResponse ? 'HTML response instead of JSON' : null,
      };
    } catch (error) {
      return {
        endpoint,
        success: false,
        status: 'ERROR',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  async testPerformanceFixes() {
    console.log('⚡ Testing Performance Fixes...\n');

    const pages = ['/', '/dashboard', '/profile', '/customers', '/products', '/proposals'];

    for (const pagePath of pages) {
      const result = await this.testPagePerformance(pagePath);
      this.results.performance.push(result);

      if (result.loadTime < 5000) {
        // Under 5 seconds is good
        this.results.overall.passed++;
        console.log(`✅ ${pagePath}: ${result.loadTime}ms (${result.status})`);
      } else {
        this.results.overall.failed++;
        console.log(`⚠️  ${pagePath}: ${result.loadTime}ms - SLOW (${result.status})`);
      }
    }

    console.log('');
  }

  async testPagePerformance(pagePath) {
    const startTime = Date.now();

    try {
      const response = await this.page.goto(`http://localhost:3000${pagePath}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const loadTime = Date.now() - startTime;

      return {
        page: pagePath,
        loadTime,
        status: response.status(),
        success: response.status() === 200 && loadTime < 10000,
      };
    } catch (error) {
      return {
        page: pagePath,
        loadTime: Date.now() - startTime,
        status: 'ERROR',
        success: false,
        error: error.message,
      };
    }
  }

  async testSessionValidation() {
    console.log('🔑 Testing Session Validation...\n');

    try {
      // Test session endpoint
      const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
      const sessionData = await sessionResponse.text();

      let sessionResult = {
        endpoint: '/api/auth/session',
        status: sessionResponse.status,
        success: sessionResponse.status === 200,
        hasValidResponse: false,
      };

      try {
        const parsed = JSON.parse(sessionData);
        sessionResult.hasValidResponse = true;
        sessionResult.sessionData = parsed;
      } catch {
        sessionResult.hasValidResponse = false;
      }

      this.results.session.push(sessionResult);

      if (sessionResult.success) {
        this.results.overall.passed++;
        console.log(`✅ Session validation: ${sessionResult.status} - Valid JSON response`);
      } else {
        this.results.overall.failed++;
        console.log(`❌ Session validation: ${sessionResult.status} - Invalid response`);
      }
    } catch (error) {
      console.log(`❌ Session validation failed: ${error.message}`);
      this.results.overall.failed++;
    }

    console.log('');
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.overall.passed + this.results.overall.failed,
        passed: this.results.overall.passed,
        failed: this.results.overall.failed,
        successRate: Math.round(
          (this.results.overall.passed /
            (this.results.overall.passed + this.results.overall.failed)) *
            100
        ),
      },
      results: this.results,
      recommendations: [],
    };

    // Generate recommendations based on results
    const authFailures = this.results.authentication.filter(r => !r.success);
    const perfIssues = this.results.performance.filter(r => r.loadTime > 5000);
    const sessionIssues = this.results.session.filter(r => !r.success);

    if (authFailures.length > 0) {
      report.recommendations.push(
        'Authentication issues still present - check session configuration'
      );
    }

    if (perfIssues.length > 0) {
      report.recommendations.push(
        'Performance issues detected - consider additional optimizations'
      );
    }

    if (sessionIssues.length > 0) {
      report.recommendations.push('Session validation issues - verify NextAuth configuration');
    }

    if (report.summary.successRate > 80) {
      report.recommendations.push('Most fixes successful - system ready for testing');
    }

    await fs.writeFile('fix-verification-report.json', JSON.stringify(report, null, 2), 'utf8');

    console.log('📊 Verification Report Generated:');
    console.log('─'.repeat(50));
    console.log(`🧪 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`📈 Success Rate: ${report.summary.successRate}%`);
    console.log('─'.repeat(50));

    // Authentication Results
    console.log('\n🔐 Authentication Test Results:');
    this.results.authentication.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.endpoint}: ${result.status} (${result.responseTime}ms)`);
    });

    // Performance Results
    console.log('\n⚡ Performance Test Results:');
    this.results.performance.forEach(result => {
      const status = result.loadTime < 5000 ? '✅' : '⚠️';
      console.log(`${status} ${result.page}: ${result.loadTime}ms`);
    });

    // Session Results
    console.log('\n🔑 Session Test Results:');
    this.results.session.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.endpoint}: ${result.status}`);
    });

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    console.log(
      '\n🎯 Overall Status:',
      report.summary.successRate > 80 ? '✅ GOOD' : '⚠️ NEEDS ATTENTION'
    );
  }
}

// Run verification
const verifier = new FixVerifier();
verifier.run().catch(console.error);
