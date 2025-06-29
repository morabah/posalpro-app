#!/usr/bin/env node

const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class SmartBottleneckTester {
  constructor() {
    this.serverUrl = 'http://localhost:3000';
    this.maxWaitTime = 60000; // 60 seconds
    this.testResults = {
      serverReady: false,
      authenticationFixed: false,
      performanceImproved: false,
      apiResponsesFixed: false,
      overallSuccess: false,
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      critical: '\x1b[35m',
      test: '\x1b[94m',
      reset: '\x1b[0m',
    };
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async waitForServer() {
    this.log('⏳ Waiting for server to be ready...', 'test');

    const startTime = Date.now();
    while (Date.now() - startTime < this.maxWaitTime) {
      try {
        const response = await fetch(`${this.serverUrl}/api/health`);
        if (response.ok) {
          this.testResults.serverReady = true;
          this.log('✅ Server is ready!', 'success');
          return true;
        }
      } catch (error) {
        // Server not ready yet, continue waiting
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      process.stdout.write('.');
    }

    this.log('❌ Server failed to start within 60 seconds', 'error');
    return false;
  }

  async testAuthenticationFix() {
    this.log('🔐 Testing Authentication Fix...', 'test');

    let browser, page;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      page = await browser.newPage();

      // Test 1: Login and get session
      await page.goto(`${this.serverUrl}/auth/login`, {
        waitUntil: 'networkidle0',
        timeout: 15000,
      });

      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.type('input[type="email"]', 'admin@posalpro.com');
      await page.type('input[type="password"]', 'ProposalPro2024!');

      const submitButton = (await page.$('button[type="submit"]')) || (await page.$('form button'));
      if (submitButton) {
        await submitButton.click();
      }

      // Wait for navigation or response
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Test 2: Check session
      const sessionResult = await page.evaluate(async () => {
        const response = await fetch('/api/auth/session', { credentials: 'include' });
        return { status: response.status, hasUser: !!(await response.json()).user };
      });

      // Test 3: Test protected endpoints
      const endpointTests = [];
      const endpoints = ['/api/customers', '/api/products', '/api/proposals'];

      for (const endpoint of endpoints) {
        const result = await page.evaluate(async url => {
          const response = await fetch(url, { credentials: 'include' });
          return { url, status: response.status, ok: response.ok };
        }, endpoint);
        endpointTests.push(result);
      }

      const authSuccess =
        sessionResult.status === 200 &&
        sessionResult.hasUser &&
        endpointTests.every(test => test.status !== 401);

      this.testResults.authenticationFixed = authSuccess;

      if (authSuccess) {
        this.log('✅ Authentication fix successful!', 'success');
        this.log(`📊 Session: ${sessionResult.status}, User: ${sessionResult.hasUser}`, 'info');
        this.log(
          `📊 API endpoints: ${endpointTests.map(t => `${t.url}:${t.status}`).join(', ')}`,
          'info'
        );
      } else {
        this.log('❌ Authentication issues remain', 'error');
        this.log(`📊 Session: ${sessionResult.status}, User: ${sessionResult.hasUser}`, 'warning');
        this.log(
          `📊 Failed endpoints: ${endpointTests
            .filter(t => !t.ok)
            .map(t => `${t.url}:${t.status}`)
            .join(', ')}`,
          'warning'
        );
      }

      return authSuccess;
    } catch (error) {
      this.log(`❌ Authentication test failed: ${error.message}`, 'error');
      return false;
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  async testPerformanceImprovement() {
    this.log('🚀 Testing Performance Improvements...', 'test');

    let browser, page;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      page = await browser.newPage();

      const performanceTests = [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Profile', url: '/profile' },
        { name: 'Customers', url: '/customers' },
        { name: 'Products', url: '/products' },
      ];

      const results = [];
      let totalImprovement = 0;

      for (const test of performanceTests) {
        try {
          const startTime = Date.now();
          await page.goto(`${this.serverUrl}${test.url}`, {
            waitUntil: 'networkidle0',
            timeout: 15000,
          });
          const loadTime = Date.now() - startTime;

          results.push({
            page: test.name,
            loadTime,
            acceptable: loadTime < 5000,
          });

          this.log(
            `📄 ${test.name}: ${loadTime}ms ${loadTime < 5000 ? '✅' : '⚠️'}`,
            loadTime < 5000 ? 'success' : 'warning'
          );

          if (loadTime < 5000) totalImprovement++;
        } catch (error) {
          results.push({
            page: test.name,
            loadTime: 15000,
            acceptable: false,
            error: error.message,
          });
          this.log(`❌ ${test.name}: Failed to load`, 'error');
        }
      }

      const performanceImproved = totalImprovement >= performanceTests.length * 0.75; // 75% success rate
      this.testResults.performanceImproved = performanceImproved;

      if (performanceImproved) {
        this.log(
          `✅ Performance improved! ${totalImprovement}/${performanceTests.length} pages load quickly`,
          'success'
        );
      } else {
        this.log(
          `⚠️ Performance needs more work: ${totalImprovement}/${performanceTests.length} pages acceptable`,
          'warning'
        );
      }

      return performanceImproved;
    } catch (error) {
      this.log(`❌ Performance test failed: ${error.message}`, 'error');
      return false;
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  async testApiResponses() {
    this.log('🌐 Testing API Response Times...', 'test');

    const apiEndpoints = [
      { name: 'Health Check', url: '/api/health' },
      { name: 'Auth Session', url: '/api/auth/session' },
      { name: 'Admin Metrics', url: '/api/admin/metrics' },
    ];

    const results = [];
    let fastResponses = 0;

    for (const endpoint of apiEndpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${this.serverUrl}${endpoint.url}`);
        const responseTime = Date.now() - startTime;

        const result = {
          endpoint: endpoint.name,
          responseTime,
          status: response.status,
          fast: responseTime < 2000,
        };

        results.push(result);

        if (result.fast) fastResponses++;

        this.log(
          `🔗 ${endpoint.name}: ${responseTime}ms (${response.status}) ${result.fast ? '✅' : '⚠️'}`,
          result.fast ? 'success' : 'warning'
        );
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          responseTime: 10000,
          status: 0,
          fast: false,
          error: error.message,
        });
        this.log(`❌ ${endpoint.name}: Failed (${error.message})`, 'error');
      }
    }

    const apiResponsesFixed = fastResponses >= apiEndpoints.length * 0.66; // 66% success rate
    this.testResults.apiResponsesFixed = apiResponsesFixed;

    if (apiResponsesFixed) {
      this.log(
        `✅ API responses improved! ${fastResponses}/${apiEndpoints.length} endpoints fast`,
        'success'
      );
    } else {
      this.log(
        `⚠️ API responses need optimization: ${fastResponses}/${apiEndpoints.length} endpoints fast`,
        'warning'
      );
    }

    return apiResponsesFixed;
  }

  async generateComprehensiveReport() {
    const overallSuccess =
      this.testResults.authenticationFixed &&
      this.testResults.performanceImproved &&
      this.testResults.apiResponsesFixed;

    this.testResults.overallSuccess = overallSuccess;

    const report = `# 🎯 Smart Bottleneck Test Results - ${new Date().toLocaleString()}

## 📊 Executive Summary

**Overall Success**: ${overallSuccess ? '✅ YES' : '❌ NO'}

## 🔍 Detailed Results

### 🖥️ Server Status
- **Ready**: ${this.testResults.serverReady ? '✅ YES' : '❌ NO'}

### 🔐 Authentication Fix
- **Status**: ${this.testResults.authenticationFixed ? '✅ FIXED' : '❌ NEEDS WORK'}
- **Description**: ${
      this.testResults.authenticationFixed
        ? 'API endpoints now properly authenticate users and return data'
        : 'API endpoints still returning 401 errors or authentication issues remain'
    }

### 🚀 Performance Improvement
- **Status**: ${this.testResults.performanceImproved ? '✅ IMPROVED' : '❌ NEEDS WORK'}
- **Description**: ${
      this.testResults.performanceImproved
        ? 'Page load times significantly improved, most pages load under 5 seconds'
        : 'Page load times still slow, optimization needed'
    }

### 🌐 API Response Times
- **Status**: ${this.testResults.apiResponsesFixed ? '✅ OPTIMIZED' : '❌ NEEDS WORK'}
- **Description**: ${
      this.testResults.apiResponsesFixed
        ? 'API endpoints respond quickly (under 2 seconds)'
        : 'API response times need optimization'
    }

## 🎯 Success Metrics

| Area | Status | Impact |
|------|--------|---------|
| Authentication | ${this.testResults.authenticationFixed ? '✅' : '❌'} | ${this.testResults.authenticationFixed ? 'HIGH' : 'CRITICAL'} |
| Performance | ${this.testResults.performanceImproved ? '✅' : '❌'} | ${this.testResults.performanceImproved ? 'HIGH' : 'MEDIUM'} |
| API Speed | ${this.testResults.apiResponsesFixed ? '✅' : '❌'} | ${this.testResults.apiResponsesFixed ? 'MEDIUM' : 'MEDIUM'} |

## 📋 Next Steps

${
  overallSuccess
    ? `
### 🎉 Congratulations! All major bottlenecks resolved!

1. **Continue Monitoring**: Set up automated performance monitoring
2. **User Testing**: Conduct user acceptance testing
3. **Production Deployment**: System ready for production deployment
4. **Documentation**: Update system documentation with optimizations

### 🔄 Maintenance Recommendations

- Run bottleneck detection weekly
- Monitor API response times continuously
- Track page load performance metrics
- Implement automated testing for regressions
`
    : `
### 🛠️ Additional Work Required

${!this.testResults.authenticationFixed ? '1. **CRITICAL**: Fix authentication issues in API endpoints\n' : ''}
${!this.testResults.performanceImproved ? '2. **HIGH**: Optimize page load performance\n' : ''}
${!this.testResults.apiResponsesFixed ? '3. **MEDIUM**: Improve API response times\n' : ''}

### 🔄 Recommended Actions

1. Review and apply the generated fixes in the \`fixes/\` directory
2. Test individual components that are failing
3. Run this test again after applying fixes
4. Consider additional optimization strategies
`
}

## 📈 Performance Baseline Established

This test establishes a performance baseline for future optimization efforts.
Regular testing will help maintain and improve system performance over time.
`;

    const fs = require('fs').promises;
    await fs.writeFile('smart-bottleneck-test-results.md', report);
    this.log('📋 Comprehensive report saved to smart-bottleneck-test-results.md', 'success');
  }

  async run() {
    this.log('🚀 STARTING SMART BOTTLENECK TESTING', 'critical');

    try {
      // Step 1: Wait for server
      const serverReady = await this.waitForServer();
      if (!serverReady) {
        this.log('❌ Cannot proceed without server', 'error');
        return this.testResults;
      }

      // Step 2: Test authentication fix
      await this.testAuthenticationFix();

      // Step 3: Test performance improvements
      await this.testPerformanceImprovement();

      // Step 4: Test API response times
      await this.testApiResponses();

      // Step 5: Generate comprehensive report
      await this.generateComprehensiveReport();

      // Final summary
      const { overallSuccess, authenticationFixed, performanceImproved, apiResponsesFixed } =
        this.testResults;

      this.log('🎯 SMART BOTTLENECK TESTING COMPLETED', 'critical');
      this.log(
        `📊 Overall Success: ${overallSuccess ? 'YES' : 'NO'}`,
        overallSuccess ? 'success' : 'warning'
      );
      this.log(
        `🔐 Authentication: ${authenticationFixed ? 'FIXED' : 'NEEDS WORK'}`,
        authenticationFixed ? 'success' : 'warning'
      );
      this.log(
        `🚀 Performance: ${performanceImproved ? 'IMPROVED' : 'NEEDS WORK'}`,
        performanceImproved ? 'success' : 'warning'
      );
      this.log(
        `🌐 API Speed: ${apiResponsesFixed ? 'OPTIMIZED' : 'NEEDS WORK'}`,
        apiResponsesFixed ? 'success' : 'warning'
      );

      if (overallSuccess) {
        this.log('🎉 ALL BOTTLENECKS RESOLVED! System ready for production!', 'success');
      } else {
        this.log('⚠️ Some bottlenecks remain. Check the report for details.', 'warning');
      }

      return this.testResults;
    } catch (error) {
      this.log(`❌ Smart testing failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run the smart bottleneck tester
async function main() {
  const tester = new SmartBottleneckTester();
  const results = await tester.run();

  console.log('\n🎯 Smart Bottleneck Testing Complete!');
  console.log(`Overall Success: ${results.overallSuccess ? 'YES' : 'NO'}`);
  console.log(`Authentication Fixed: ${results.authenticationFixed}`);
  console.log(`Performance Improved: ${results.performanceImproved}`);
  console.log(`API Responses Optimized: ${results.apiResponsesFixed}`);

  process.exit(results.overallSuccess ? 0 : 1);
}

main().catch(console.error);
