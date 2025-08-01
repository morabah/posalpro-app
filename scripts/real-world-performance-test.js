#!/usr/bin/env node

/**
 * PosalPro MVP2 - Real-World Performance Testing
 * Tests performance fixes against the actual running application
 * Validates fixes work under real React Strict Mode conditions
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class RealWorldPerformanceTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      duplicateApiCalls: { passed: false, details: [] },
      validationDashboardCrash: { passed: false, details: [] },
      navigationAnalyticsThrottling: { passed: false, details: [] },
      authErrorRecovery: { passed: false, details: [] },
      overallPerformance: { passed: false, metrics: {} },
      pageSpecificIssues: { passed: false, details: {} }
    };
    this.baseUrl = 'http://localhost:3000';
    
    // All pages from AppSidebar navigation structure
    this.navigationPages = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/proposals/manage', name: 'Proposals Management' },
      { path: '/proposals/create', name: 'Create Proposal' },
      { path: '/content/search', name: 'Content Search' },
      { path: '/content', name: 'Content Library' },
      { path: '/products', name: 'Product Catalog' },
      { path: '/products/create', name: 'Create Product' },
      { path: '/products/selection', name: 'Product Selection' },
      { path: '/products/relationships', name: 'Product Relationships' },
      { path: '/products/management', name: 'Product Management' },
      { path: '/sme/contributions', name: 'SME Contributions' },
      { path: '/sme/assignments', name: 'SME Assignments' },
      { path: '/validation', name: 'Validation Dashboard' },
      { path: '/validation/rules', name: 'Validation Rules' },
      { path: '/workflows/approval', name: 'Approval Workflows' },
      { path: '/workflows/templates', name: 'Workflow Templates' },
      { path: '/coordination', name: 'Coordination Hub' },
      { path: '/rfp/parser', name: 'RFP Parser' },
      { path: '/rfp/analysis', name: 'RFP Analysis' },
      { path: '/analytics', name: 'Analytics Dashboard' },
      { path: '/analytics/real-time', name: 'Real-Time Analytics' },
      { path: '/customers', name: 'Customers List' },
      { path: '/customers/create', name: 'Create Customer' },
      { path: '/admin', name: 'Admin Panel' },
      { path: '/about', name: 'About Page' }
    ];
  }

  // Helper method for delays since waitForTimeout was deprecated
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async setup() {
    console.log('🚀 Setting up real-world performance test environment...');
    
    try {
      this.browser = await puppeteer.launch({
        headless: false, // Keep visible for debugging
        devtools: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
        ]
      });

      this.page = await this.browser.newPage();
      
      // Set up error tracking
      this.page.on('pageerror', error => {
        console.error(`💥 Page Error: ${error.message}`);
        if (error.message.includes('toFixed') || error.message.includes('toLocaleDateString')) {
          this.testResults.validationDashboardCrash.details.push({
            error: error.message,
            timestamp: Date.now(),
            type: 'crash'
          });
        }
      });

      // Set up console error tracking
      this.page.on('console', msg => {
        const text = msg.text();
        
        // Track performance violations
        if (text.includes('[Violation]')) {
          this.testResults.overallPerformance.metrics.violations = 
            (this.testResults.overallPerformance.metrics.violations || 0) + 1;
          console.log(`⚠️ Performance Violation: ${text}`);
        }
        
        // Track API calls for duplicate detection
        if (text.includes('[PROPOSALS]') && text.includes('Fetching proposals from API')) {
          this.testResults.duplicateApiCalls.details.push({
            message: text,
            timestamp: Date.now()
          });
        }
        
        // Track other important logs
        if (text.includes('[PROPOSALS]') || 
            text.includes('Navigation Analytics') || 
            text.includes('[AuthCircuitBreaker]') ||
            text.includes('ValidationDashboard')) {
          console.log(`📱 Console: ${text}`);
        }
      });

      await this.page.goto(this.baseUrl);
      console.log('✅ Test environment ready');
      
    } catch (error) {
      console.error('❌ Failed to setup test environment:', error);
      throw error;
    }
  }

  async testDuplicateApiPrevention() {
    console.log('\n🧪 Testing Duplicate API Call Prevention...');
    
    try {
      // Reset tracking
      this.testResults.duplicateApiCalls.details = [];
      
      // Navigate to proposals page
      await this.page.goto(`${this.baseUrl}/proposals/manage`);
      await this.delay(2000);

      // Force React Strict Mode behavior by refreshing rapidly  
      for (let i = 0; i < 3; i++) {
        await this.page.reload();
        await this.delay(1000);
      }

      // Wait for any delayed API calls
      await this.delay(3000);

      // Analyze console logs for duplicate API calls
      const apiCallLogs = this.testResults.duplicateApiCalls.details.filter(entry => 
        entry.message && entry.message.includes('Fetching proposals from API')
      );

      // Check for duplicates within short time windows (indicating real duplicates)
      let duplicateCount = 0;
      for (let i = 1; i < apiCallLogs.length; i++) {
        const timeDiff = apiCallLogs[i].timestamp - apiCallLogs[i-1].timestamp;
        if (timeDiff < 5000) { // Less than 5 seconds apart = likely duplicate
          duplicateCount++;
        }
      }

      this.testResults.duplicateApiCalls.passed = duplicateCount === 0;
      this.testResults.duplicateApiCalls.details = {
        totalApiCalls: apiCallLogs.length,
        duplicatesDetected: duplicateCount,
        timeline: apiCallLogs,
        analysis: `Found ${apiCallLogs.length} API calls, ${duplicateCount} potential duplicates`
      };

      if (this.testResults.duplicateApiCalls.passed) {
        console.log(`✅ Duplicate API prevention test PASSED (${apiCallLogs.length} calls, ${duplicateCount} duplicates)`);
      } else {
        console.log(`❌ Duplicate API prevention test FAILED: ${duplicateCount} duplicates in ${apiCallLogs.length} calls`);
      }

    } catch (error) {
      console.error('❌ Duplicate API test failed:', error);
      this.testResults.duplicateApiCalls.details = { error: error.message };
    }
  }

  async testAllNavigationPages() {
    console.log('\n🌐 Testing All Navigation Pages Systematically...');
    
    const pageResults = {};
    
    for (const pageInfo of this.navigationPages) {
      console.log(`\n📄 Testing ${pageInfo.name} (${pageInfo.path})`);
      
      const pageResult = {
        name: pageInfo.name,
        path: pageInfo.path,
        crashes: [],
        apiCalls: [],
        performanceViolations: [],
        loadTime: 0,
        status: 'unknown'
      };
      
      try {
        // Reset tracking for this page
        const pageCrashes = [];
        const pageApiCalls = [];
        const pageViolations = [];
        
        // Set up page-specific error tracking
        const crashHandler = (error) => {
          if (error.message.includes('toFixed') || 
              error.message.includes('toLocaleDateString') ||
              error.message.includes('Cannot read properties of undefined')) {
            pageCrashes.push({
              error: error.message,
              timestamp: Date.now(),
              page: pageInfo.path
            });
            console.log(`💥 CRASH on ${pageInfo.name}: ${error.message}`);
          }
          
          // 🚨 CRITICAL: Enhanced React error detection
          if (error.message.includes('Maximum update depth exceeded')) {
            pageCrashes.push({
              error: error.message,
              timestamp: Date.now(),
              page: pageInfo.path,
              source: 'react-infinite-loop',
              severity: 'CRITICAL'
            });
            console.log(`🚨 CRITICAL React Infinite Loop Error on ${pageInfo.name}: ${error.message}`);
          }
          
          if (error.message.includes('React') || error.message.includes('useEffect') || 
              error.message.includes('setState') || error.message.includes('component')) {
            pageCrashes.push({
              error: error.message,
              timestamp: Date.now(),
              page: pageInfo.path,
              source: 'react-error',
              severity: 'HIGH'
            });
            console.log(`⚠️ React Error on ${pageInfo.name}: ${error.message}`);
          }
        };
        
        const consoleHandler = (msg) => {
          const text = msg.text();
          
          // Track API calls
          if ((text.includes('Fetching') && text.includes('API')) || 
              text.includes('[ApiClient] Final URL:')) {
            pageApiCalls.push({
              message: text,
              timestamp: Date.now(),
              page: pageInfo.path
            });
          }
          
          // Track performance violations
          if (text.includes('[Violation]')) {
            pageViolations.push({
              message: text,
              timestamp: Date.now(),
              page: pageInfo.path
            });
            console.log(`⚠️ Performance Violation on ${pageInfo.name}: ${text}`);
          }
          
          // 🚨 CRITICAL: Track React infinite loop errors
          if (text.includes('Maximum update depth exceeded')) {
            pageCrashes.push({
              error: text,
              timestamp: Date.now(),
              page: pageInfo.path,
              source: 'react-infinite-loop',
              severity: 'CRITICAL'
            });
            console.log(`🚨 CRITICAL React Infinite Loop on ${pageInfo.name}: ${text}`);
          }
          
          // 🚨 CRITICAL: Track Fast Refresh issues
          if (text.includes('[Fast Refresh] performing full reload')) {
            pageCrashes.push({
              error: text,
              timestamp: Date.now(),
              page: pageInfo.path,
              source: 'fast-refresh-issue',
              severity: 'HIGH'
            });
            console.log(`⚠️ Fast Refresh Issue on ${pageInfo.name}: Component causing full reload`);
          }
          
          // 🚨 CRITICAL: Track performance monitoring spam
          if (text.includes('Enhanced performance monitoring') && 
              (text.includes('started') || text.includes('stopped'))) {
            // Count rapid start/stop cycles
            const recentMonitoringLogs = pageViolations.filter(v => 
              v.message.includes('Enhanced performance monitoring') &&
              Date.now() - v.timestamp < 1000 // within last second
            );
            
            if (recentMonitoringLogs.length > 10) {
              pageCrashes.push({
                error: 'Performance monitoring spam detected - excessive start/stop cycles',
                timestamp: Date.now(),
                page: pageInfo.path,
                source: 'performance-monitoring-spam',
                severity: 'HIGH'
              });
              console.log(`🚨 Performance Monitoring Spam on ${pageInfo.name}: ${recentMonitoringLogs.length} events in 1 second`);
            }
            
            pageViolations.push({
              message: text,
              timestamp: Date.now(),
              page: pageInfo.path
            });
          }
          
          // 🚨 CRITICAL: Track Error Boundary crashes
          if (text.includes('Error Boundary Caught Error') || 
              text.includes('The above error occurred in the')) {
            pageCrashes.push({
              error: text,
              timestamp: Date.now(),
              page: pageInfo.path,
              source: 'error-boundary',
              severity: 'CRITICAL'
            });
            console.log(`🚨 CRITICAL Error Boundary Activation on ${pageInfo.name}: ${text}`);
          }
          
          // 🚨 CRITICAL: Track useEffect dependency issues
          if (text.includes('useEffect either doesn\'t have a dependency array')) {
            pageCrashes.push({
              error: text,
              timestamp: Date.now(),
              page: pageInfo.path,
              source: 'useeffect-dependency',
              severity: 'CRITICAL'
            });
            console.log(`🚨 CRITICAL useEffect Dependency Issue on ${pageInfo.name}: ${text}`);
          }
          
          // Track crashes from console errors
          if (text.includes('TypeError') || text.includes('Error:')) {
            pageCrashes.push({
              error: text,
              timestamp: Date.now(),
              page: pageInfo.path,
              source: 'console'
            });
          }
          
          // Track React component stack traces for debugging
          if (text.includes('at RealTimeAnalyticsOptimizer') || 
              text.includes('at useAdvancedPerformanceOptimization')) {
            pageCrashes.push({
              error: text,
              timestamp: Date.now(),
              page: pageInfo.path,
              source: 'react-component-error',
              severity: 'HIGH'
            });
            console.log(`⚠️ React Component Error on ${pageInfo.name}: ${text}`);
          }
        };
        
        // Add listeners
        this.page.on('pageerror', crashHandler);
        this.page.on('console', consoleHandler);
        
        // Navigate to page and measure load time
        const startTime = Date.now();
        
        try {
          await this.page.goto(`${this.baseUrl}${pageInfo.path}`, { 
            waitUntil: 'networkidle0',
            timeout: 10000 
          });
          
          // Wait for page to settle
          await this.delay(2000);
          
          const loadTime = Date.now() - startTime;
          pageResult.loadTime = loadTime;
          pageResult.status = 'loaded';
          
          console.log(`✅ ${pageInfo.name} loaded in ${loadTime}ms`);
          
        } catch (navError) {
          console.log(`❌ Failed to load ${pageInfo.name}: ${navError.message}`);
          pageResult.status = 'failed';
          pageResult.crashes.push({
            error: `Navigation failed: ${navError.message}`,
            timestamp: Date.now(),
            page: pageInfo.path
          });
        }
        
        // Remove listeners
        this.page.off('pageerror', crashHandler);
        this.page.off('console', consoleHandler);
        
        // Store results
        pageResult.crashes = pageCrashes;
        pageResult.apiCalls = pageApiCalls;
        pageResult.performanceViolations = pageViolations;
        
        // Analyze for duplicates
        const duplicates = this.findDuplicateApiCalls(pageApiCalls);
        if (duplicates.length > 0) {
          console.log(`🔄 Found ${duplicates.length} duplicate API calls on ${pageInfo.name}`);
          pageResult.duplicateApiCalls = duplicates;
        }
        
        pageResults[pageInfo.path] = pageResult;
        
      } catch (error) {
        console.error(`❌ Error testing ${pageInfo.name}:`, error);
        pageResult.status = 'error';
        pageResult.crashes.push({
          error: error.message,
          timestamp: Date.now(),
          page: pageInfo.path
        });
        pageResults[pageInfo.path] = pageResult;
      }
      
      // Small delay between pages
      await this.delay(1000);
    }
    
    // Analyze overall results
    const totalPages = this.navigationPages.length;
    const successfulPages = Object.values(pageResults).filter(r => r.status === 'loaded').length;
    const pagesWithCrashes = Object.values(pageResults).filter(r => r.crashes.length > 0).length;
    const pagesWithDuplicates = Object.values(pageResults).filter(r => r.duplicateApiCalls && r.duplicateApiCalls.length > 0).length;
    const pagesWithViolations = Object.values(pageResults).filter(r => r.performanceViolations.length > 0).length;
    
    this.testResults.pageSpecificIssues.details = pageResults;
    this.testResults.pageSpecificIssues.passed = (pagesWithCrashes === 0 && pagesWithDuplicates === 0);
    
    console.log(`\n📊 PAGE-BY-PAGE ANALYSIS COMPLETE:`);
    console.log(`✅ Successfully loaded: ${successfulPages}/${totalPages} pages`);
    console.log(`💥 Pages with crashes: ${pagesWithCrashes}`);
    console.log(`🔄 Pages with duplicate API calls: ${pagesWithDuplicates}`);
    console.log(`⚠️ Pages with performance violations: ${pagesWithViolations}`);
    
    if (pagesWithCrashes > 0) {
      console.log(`\n💥 PAGES WITH CRASHES:`);
      Object.values(pageResults).forEach(page => {
        if (page.crashes.length > 0) {
          console.log(`- ${page.name}: ${page.crashes.length} crashes`);
          page.crashes.forEach(crash => console.log(`  • ${crash.error}`));
        }
      });
    }
    
    if (pagesWithDuplicates > 0) {
      console.log(`\n🔄 PAGES WITH DUPLICATE API CALLS:`);
      Object.values(pageResults).forEach(page => {
        if (page.duplicateApiCalls && page.duplicateApiCalls.length > 0) {
          console.log(`- ${page.name}: ${page.duplicateApiCalls.length} duplicates`);
        }
      });
    }
  }
  
  findDuplicateApiCalls(apiCalls) {
    const duplicates = [];
    const grouped = {};

    apiCalls.forEach(call => {
      const key = call.message;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(call);
    });

    Object.entries(grouped).forEach(([message, calls]) => {
      if (calls.length > 1) {
        // Check if calls are within 5 seconds of each other (indicating duplicates)
        for (let i = 1; i < calls.length; i++) {
          if (calls[i].timestamp - calls[i-1].timestamp < 5000) {
            duplicates.push({
              message,
              calls: calls.slice(i-1, i+1),
              timeDiff: calls[i].timestamp - calls[i-1].timestamp,
              page: calls[i].page
            });
          }
        }
      }
    });

    return duplicates;
  }

  async testValidationDashboardCrash() {
    console.log('\n🧪 Testing ValidationDashboard Crash Prevention...');
    
    try {
      const initialErrors = this.testResults.validationDashboardCrash.details.length;
      
      // Navigate to validation dashboard
      await this.page.goto(`${this.baseUrl}/validation`);
      await this.delay(2000);

      // Try to trigger the crash by refreshing multiple times
      for (let i = 0; i < 5; i++) {
        await this.page.reload();
        await this.delay(1000);
      }

      // Check if any crashes occurred
      const finalErrors = this.testResults.validationDashboardCrash.details.length;
      this.testResults.validationDashboardCrash.passed = finalErrors === initialErrors;

      if (this.testResults.validationDashboardCrash.passed) {
        console.log('✅ ValidationDashboard crash prevention test PASSED');
      } else {
        console.log(`❌ ValidationDashboard crash prevention test FAILED: ${finalErrors - initialErrors} crashes occurred`);
      }

    } catch (error) {
      console.error('❌ ValidationDashboard test failed:', error);
      this.testResults.validationDashboardCrash.details.push({ error: error.message });
    }
  }

  async testNavigationAnalyticsThrottling() {
    console.log('\n🧪 Testing Navigation Analytics Throttling...');
    
    try {
      const analyticsEvents = [];
      
      // Capture console logs for analytics
      this.page.on('console', msg => {
        if (msg.text().includes('Navigation Analytics:')) {
          analyticsEvents.push({
            timestamp: Date.now(),
            message: msg.text()
          });
        }
      });

      await this.page.goto(`${this.baseUrl}/dashboard`);
      await this.delay(1000);

      // Perform rapid navigation clicks
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        try {
          // Click different navigation elements rapidly
          await this.page.click('nav a', { timeout: 1000 });
          await this.delay(200);
        } catch (e) {
          // Ignore click failures, focus on analytics
        }
      }

      const endTime = Date.now();
      await this.delay(2000); // Wait for any delayed events

      // Analyze throttling effectiveness
      const eventsInTimeWindow = analyticsEvents.filter(event => 
        event.timestamp >= startTime && event.timestamp <= endTime + 2000
      );

      const expectedMaxEvents = Math.ceil((endTime - startTime + 2000) / 5000) * 2; // 2 events per 5-second window
      
      this.testResults.navigationAnalyticsThrottling.passed = eventsInTimeWindow.length <= expectedMaxEvents;
      this.testResults.navigationAnalyticsThrottling.details = {
        eventsDetected: eventsInTimeWindow.length,
        expectedMax: expectedMaxEvents,
        testDuration: endTime - startTime,
        events: eventsInTimeWindow
      };

      if (this.testResults.navigationAnalyticsThrottling.passed) {
        console.log(`✅ Navigation analytics throttling test PASSED (${eventsInTimeWindow.length}/${expectedMaxEvents} events)`);
      } else {
        console.log(`❌ Navigation analytics throttling test FAILED: ${eventsInTimeWindow.length}/${expectedMaxEvents} events`);
      }

    } catch (error) {
      console.error('❌ Navigation analytics test failed:', error);
      this.testResults.navigationAnalyticsThrottling.details = { error: error.message };
    }
  }

  async testAuthErrorRecovery() {
    console.log('\n🧪 Testing Authentication Error Recovery...');
    
    try {
      const authErrors = [];
      const circuitBreakerLogs = [];
      
      // Capture auth-related console logs
      this.page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[AuthCircuitBreaker]')) {
          circuitBreakerLogs.push({
            timestamp: Date.now(),
            message: text
          });
        }
        if (text.includes('CLIENT_FETCH_ERROR')) {
          authErrors.push({
            timestamp: Date.now(),
            message: text
          });
        }
      });

      await this.page.goto(`${this.baseUrl}/auth/login`);
      await this.delay(3000);

      // Navigate around to trigger auth checks
      await this.page.goto(`${this.baseUrl}/dashboard`);
      await this.delay(2000);

      // Check for circuit breaker activation
      const hasCircuitBreakerActivity = circuitBreakerLogs.length > 0;
      const hasUncontrolledErrors = authErrors.filter(error => 
        !circuitBreakerLogs.some(log => 
          Math.abs(log.timestamp - error.timestamp) < 1000
        )
      ).length > 0;

      this.testResults.authErrorRecovery.passed = !hasUncontrolledErrors;
      this.testResults.authErrorRecovery.details = {
        authErrors: authErrors.length,
        circuitBreakerActivations: circuitBreakerLogs.length,
        uncontrolledErrors: hasUncontrolledErrors,
        logs: { authErrors, circuitBreakerLogs }
      };

      if (this.testResults.authErrorRecovery.passed) {
        console.log('✅ Auth error recovery test PASSED');
      } else {
        console.log('❌ Auth error recovery test FAILED: Uncontrolled auth errors detected');
      }

    } catch (error) {
      console.error('❌ Auth error recovery test failed:', error);
      this.testResults.authErrorRecovery.details = { error: error.message };
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'Real-World Performance Tests',
      results: this.testResults,
      summary: {
        totalTests: Object.keys(this.testResults).length,
        passed: Object.values(this.testResults).filter(test => test.passed).length,
        failed: Object.values(this.testResults).filter(test => !test.passed).length
      }
    };

    // Collect all crashes and categorize by severity
    const allCrashes = [];
    Object.entries(this.testResults).forEach(([testName, result]) => {
      if (testName === 'pageSpecificIssues' && result.details && typeof result.details === 'object') {
        // Handle pageSpecificIssues which has pageResults structure
        Object.values(result.details).forEach(pageResult => {
          if (pageResult.crashes && Array.isArray(pageResult.crashes)) {
            pageResult.crashes.forEach(crash => {
              allCrashes.push({
                test: testName,
                page: pageResult.name || crash.page,
                ...crash
              });
            });
          }
        });
      } else if (result.details && Array.isArray(result.details)) {
        // Handle other test results with array details
        result.details.forEach(detail => {
          if (detail.error || detail.source) {
            allCrashes.push({
              test: testName,
              ...detail
            });
          }
        });
      }
    });

    // Group crashes by severity
    const criticalErrors = allCrashes.filter(crash => crash.severity === 'CRITICAL');
    const highErrors = allCrashes.filter(crash => crash.severity === 'HIGH');
    const otherErrors = allCrashes.filter(crash => !crash.severity || (crash.severity !== 'CRITICAL' && crash.severity !== 'HIGH'));

    // Enhanced error reporting
    report.errorAnalysis = {
      criticalErrors: criticalErrors.length,
      highErrors: highErrors.length,
      otherErrors: otherErrors.length,
      totalErrors: allCrashes.length,
      criticalIssues: this.categorizeErrors(criticalErrors),
      highIssues: this.categorizeErrors(highErrors),
      recommendations: this.generateRecommendations(criticalErrors, highErrors)
    };

    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'real-world-performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n📊 REAL-WORLD PERFORMANCE TEST RESULTS');
    console.log('=====================================');
    console.log(`✅ Tests Passed: ${report.summary.passed}/${report.summary.totalTests}`);
    console.log(`❌ Tests Failed: ${report.summary.failed}/${report.summary.totalTests}`);
    
    // Print critical error summary
    if (criticalErrors.length > 0) {
      console.log(`\n🚨 CRITICAL ERRORS DETECTED: ${criticalErrors.length}`);
      console.log('==========================================');
      criticalErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.source || 'unknown'} on ${error.page || 'unknown page'}`);
        console.log(`   Error: ${error.error?.substring(0, 100)}...`);
      });
    }
    
    if (highErrors.length > 0) {
      console.log(`\n⚠️ HIGH PRIORITY ERRORS: ${highErrors.length}`);
      console.log('======================================');
      highErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.source || 'unknown'} on ${error.page || 'unknown page'}`);
      });
    }

    // Print recommendations
    if (report.errorAnalysis.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDED FIXES:');
      console.log('=====================');
      report.errorAnalysis.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    console.log(`\n📄 Detailed report: ${reportPath}`);

    Object.entries(this.testResults).forEach(([testName, result]) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${testName}: ${result.passed ? 'PASSED' : 'FAILED'}`);
    });

    return report.summary.failed === 0 && criticalErrors.length === 0;
  }

  categorizeErrors(errors) {
    const categories = {};
    errors.forEach(error => {
      const category = error.source || 'unknown';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(error);
    });
    return categories;
  }

  generateRecommendations(criticalErrors, highErrors) {
    const recommendations = [];
    
    // Check for React infinite loop issues
    const infiniteLoops = criticalErrors.filter(e => e.source === 'react-infinite-loop');
    if (infiniteLoops.length > 0) {
      recommendations.push('🚨 CRITICAL: Fix React infinite loops in useAdvancedPerformanceOptimization.ts:501 and RealTimeAnalyticsOptimizer.tsx:434 - likely caused by setState in useEffect without proper dependencies');
    }
    
    // Check for performance monitoring spam
    const monitoringSpam = [...criticalErrors, ...highErrors].filter(e => e.source === 'performance-monitoring-spam');
    if (monitoringSpam.length > 0) {
      recommendations.push('⚠️ HIGH: Reduce performance monitoring frequency - current implementation causes excessive logging and performance overhead');
    }
    
    // Check for Fast Refresh issues
    const fastRefreshIssues = highErrors.filter(e => e.source === 'fast-refresh-issue');
    if (fastRefreshIssues.length > 0) {
      recommendations.push('⚠️ HIGH: Fix Fast Refresh issues - components are being imported outside React rendering tree, causing full page reloads');
    }
    
    // Check for Error Boundary activations
    const errorBoundaries = criticalErrors.filter(e => e.source === 'error-boundary');
    if (errorBoundaries.length > 0) {
      recommendations.push('🚨 CRITICAL: React components are crashing and being caught by Error Boundaries - investigate RealTimeAnalyticsOptimizer component');
    }
    
    // Check for useEffect dependency issues
    const useEffectIssues = criticalErrors.filter(e => e.source === 'useeffect-dependency');
    if (useEffectIssues.length > 0) {
      recommendations.push('🚨 CRITICAL: Fix useEffect dependency arrays to prevent infinite re-renders');
    }

    return recommendations;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.setup();
      
      await this.testDuplicateApiPrevention();
      await this.testValidationDashboardCrash();
      await this.testNavigationAnalyticsThrottling();
      await this.testAuthErrorRecovery();
      await this.testAllNavigationPages(); // Add this line to run the new test
      
      const allTestsPassed = await this.generateReport();
      
      await this.cleanup();
      
      process.exit(allTestsPassed ? 0 : 1);
      
    } catch (error) {
      console.error('💥 Real-world performance test suite failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  // Check if Puppeteer is available
  try {
    require('puppeteer');
  } catch (error) {
    console.error('❌ Puppeteer not found. Install with: npm install --save-dev puppeteer');
    process.exit(1);
  }

  const tester = new RealWorldPerformanceTest();
  tester.run().catch(console.error);
}

module.exports = RealWorldPerformanceTest; 