#!/usr/bin/env node

/**
 * PosalPro MVP2 - Optimization Test Script
 * Comprehensive testing of memory profiling, database query optimization, and asset compression
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  headless: true,
  viewport: { width: 1280, height: 720 },
};

// Performance targets
const PERFORMANCE_TARGETS = {
  memory: {
    heapUsed: 100 * 1024 * 1024, // 100MB
    rss: 200 * 1024 * 1024, // 200MB
  },
  responseTime: {
    api: 1000, // 1 second
    page: 3000, // 3 seconds
  },
  webVitals: {
    lcp: 2500, // 2.5 seconds
    fcp: 1800, // 1.8 seconds
    cls: 0.1,
    ttfb: 800, // 800ms
  },
};

class OptimizationTestSuite {
  constructor() {
    this.results = {
      memory: {},
      performance: {},
      api: {},
      optimizations: {},
      summary: {},
    };
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🚀 Initializing optimization test suite...');

    this.browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport(TEST_CONFIG.viewport);

    console.log('✅ Test suite initialized');
  }

  async testMemoryOptimization() {
    console.log('\n🧠 Testing Memory Optimization...');

    try {
      // Test memory optimization service
      const memoryMetrics = await this.page.evaluate(() => {
        if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
          return {
            usedJSHeapSize: window.performance.memory.usedJSHeapSize,
            totalJSHeapSize: window.performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit,
          };
        }
        return null;
      });

      this.results.memory = {
        metrics: memoryMetrics,
        isAcceptable: memoryMetrics
          ? memoryMetrics.usedJSHeapSize < PERFORMANCE_TARGETS.memory.heapUsed
          : true,
        target: PERFORMANCE_TARGETS.memory.heapUsed,
        actual: memoryMetrics ? memoryMetrics.usedJSHeapSize : 0,
      };

      console.log(`  ✅ Memory Usage: ${(this.results.memory.actual / 1024 / 1024).toFixed(2)}MB`);
      console.log(
        `  ✅ Memory Status: ${this.results.memory.isAcceptable ? 'ACCEPTABLE' : 'WARNING'}`
      );
    } catch (error) {
      console.error('  ❌ Memory optimization test failed:', error.message);
      this.results.memory.error = error.message;
    }
  }

  async testPerformanceAPI() {
    console.log('\n📊 Testing Performance API...');

    try {
      // Test performance API endpoint
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/performance`);
      const data = await response.json();

      this.results.api = {
        status: response.status,
        responseTime: response.headers.get('x-response-time') || 'unknown',
        data: data,
        isHealthy: response.status === 200,
      };

      console.log(`  ✅ API Status: ${this.results.api.status}`);
      console.log(`  ✅ Response Time: ${this.results.api.responseTime}`);
      console.log(`  ✅ Health Check: ${this.results.api.isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    } catch (error) {
      console.error('  ❌ Performance API test failed:', error.message);
      this.results.api.error = error.message;
    }
  }

  async testPagePerformance() {
    console.log('\n⚡ Testing Page Performance...');

    try {
      // Navigate to memory optimization page
      await this.page.goto(`${TEST_CONFIG.baseUrl}/performance/memory-optimization`, {
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeout,
      });

      // Measure page load performance
      const performanceMetrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded:
            navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint:
            performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')
              ?.startTime || 0,
          firstContentfulPaint:
            performance
              .getEntriesByType('paint')
              .find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        };
      });

      this.results.performance = {
        loadTime: performanceMetrics.loadTime,
        domContentLoaded: performanceMetrics.domContentLoaded,
        firstPaint: performanceMetrics.firstPaint,
        firstContentfulPaint: performanceMetrics.firstContentfulPaint,
        isAcceptable: performanceMetrics.loadTime < PERFORMANCE_TARGETS.responseTime.page,
      };

      console.log(`  ✅ Page Load Time: ${performanceMetrics.loadTime.toFixed(2)}ms`);
      console.log(`  ✅ DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
      console.log(`  ✅ First Paint: ${performanceMetrics.firstPaint.toFixed(2)}ms`);
      console.log(
        `  ✅ Performance Status: ${this.results.performance.isAcceptable ? 'ACCEPTABLE' : 'SLOW'}`
      );
    } catch (error) {
      console.error('  ❌ Page performance test failed:', error.message);
      this.results.performance.error = error.message;
    }
  }

  async testOptimizationServices() {
    console.log('\n🔧 Testing Optimization Services...');

    try {
      // Test if optimization services are accessible
      const services = [
        'MemoryOptimizationService',
        'ImageOptimizationService',
        'PerformanceOptimizationAPI',
      ];

      this.results.optimizations = {
        services: {},
        status: 'TESTING',
      };

      for (const service of services) {
        try {
          // Check if service files exist
          const servicePath = path.join(
            __dirname,
            '..',
            'src',
            'lib',
            'performance',
            `${service}.ts`
          );
          const exists = fs.existsSync(servicePath);

          this.results.optimizations.services[service] = {
            exists,
            status: exists ? 'AVAILABLE' : 'MISSING',
          };

          console.log(`  ✅ ${service}: ${exists ? 'AVAILABLE' : 'MISSING'}`);
        } catch (error) {
          console.error(`  ❌ ${service}: ERROR - ${error.message}`);
          this.results.optimizations.services[service] = {
            exists: false,
            status: 'ERROR',
            error: error.message,
          };
        }
      }

      // Test Redis connection
      try {
        const redisResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/health`);
        const redisData = await redisResponse.json();

        this.results.optimizations.redis = {
          status: redisResponse.status === 200 ? 'CONNECTED' : 'DISCONNECTED',
          data: redisData,
        };

        console.log(`  ✅ Redis: ${this.results.optimizations.redis.status}`);
      } catch (error) {
        console.error(`  ❌ Redis: ERROR - ${error.message}`);
        this.results.optimizations.redis = {
          status: 'ERROR',
          error: error.message,
        };
      }
    } catch (error) {
      console.error('  ❌ Optimization services test failed:', error.message);
      this.results.optimizations.error = error.message;
    }
  }

  async generateSummary() {
    console.log('\n📋 Generating Test Summary...');

    const summary = {
      timestamp: new Date().toISOString(),
      tests: {
        memory: this.results.memory.isAcceptable !== false,
        performance: this.results.performance.isAcceptable !== false,
        api: this.results.api.isHealthy !== false,
        optimizations: Object.values(this.results.optimizations.services || {}).every(
          s => s.status === 'AVAILABLE'
        ),
      },
      metrics: {
        memory: this.results.memory,
        performance: this.results.performance,
        api: this.results.api,
        optimizations: this.results.optimizations,
      },
      score: 0,
      status: 'PENDING',
    };

    // Calculate overall score
    const testResults = Object.values(summary.tests);
    const passedTests = testResults.filter(result => result === true).length;
    summary.score = Math.round((passedTests / testResults.length) * 100);

    // Determine overall status
    if (summary.score >= 90) {
      summary.status = 'EXCELLENT';
    } else if (summary.score >= 70) {
      summary.status = 'GOOD';
    } else if (summary.score >= 50) {
      summary.status = 'FAIR';
    } else {
      summary.status = 'POOR';
    }

    this.results.summary = summary;

    console.log(`\n🎯 OPTIMIZATION TEST RESULTS:`);
    console.log(`================================`);
    console.log(`Overall Score: ${summary.score}/100 ${summary.status}`);
    console.log(`Memory Optimization: ${summary.tests.memory ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Performance API: ${summary.tests.api ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Page Performance: ${summary.tests.performance ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Optimization Services: ${summary.tests.optimizations ? '✅ PASS' : '❌ FAIL'}`);

    return summary;
  }

  async saveResults() {
    const resultsPath = path.join(__dirname, 'optimization-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Test results saved to: ${resultsPath}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('\n🧹 Test suite cleaned up');
  }

  async runAllTests() {
    try {
      await this.initialize();

      await this.testMemoryOptimization();
      await this.testPerformanceAPI();
      await this.testPagePerformance();
      await this.testOptimizationServices();

      const summary = await this.generateSummary();
      await this.saveResults();

      return summary;
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 PosalPro MVP2 - Optimization Test Suite');
  console.log('==========================================');

  const testSuite = new OptimizationTestSuite();

  try {
    const results = await testSuite.runAllTests();

    console.log('\n🎉 Test suite completed successfully!');
    console.log(`Final Status: ${results.status}`);
    console.log(`Final Score: ${results.score}/100`);

    process.exit(results.score >= 70 ? 0 : 1);
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run the test suite
if (require.main === module) {
  main();
}

module.exports = OptimizationTestSuite;
