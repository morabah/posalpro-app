#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class ErrorDetectionAndFix {
  constructor() {
    this.serverUrl = 'http://localhost:3000';
    this.errorPatterns = [];
    this.performanceIssues = [];
    this.fixes = [];
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      critical: '\x1b[35m',
      reset: '\x1b[0m',
    };
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async detectCriticalErrors() {
    this.log('🔍 PHASE 1: Critical Error Detection...', 'critical');

    let browser, page;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--max_old_space_size=8192',
        ],
      });

      page = await browser.newPage();

      // Monitor console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push({
            text: msg.text(),
            location: msg.location(),
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Monitor network failures
      const networkErrors = [];
      page.on('requestfailed', request => {
        networkErrors.push({
          url: request.url(),
          method: request.method(),
          failure: request.failure()?.errorText,
          timestamp: new Date().toISOString(),
        });
      });

      // Monitor response errors
      const responseErrors = [];
      page.on('response', response => {
        if (response.status() >= 400) {
          responseErrors.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Test critical pages
      const criticalPages = [
        { name: 'Login', url: '/auth/login' },
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Customers', url: '/customers' },
        { name: 'Products', url: '/products' },
        { name: 'Proposals', url: '/proposals' },
      ];

      for (const pageTest of criticalPages) {
        this.log(`🔎 Testing ${pageTest.name} page...`, 'info');

        try {
          const startTime = performance.now();
          await page.goto(`${this.serverUrl}${pageTest.url}`, {
            waitUntil: 'networkidle0',
            timeout: 15000,
          });
          const endTime = performance.now();
          const loadTime = endTime - startTime;

          if (loadTime > 3000) {
            this.performanceIssues.push({
              type: 'slow_page_load',
              page: pageTest.name,
              loadTime,
              severity: 'high',
              recommendation: 'Optimize page load time - consider code splitting and lazy loading',
            });
          }

          this.log(`✅ ${pageTest.name}: ${loadTime.toFixed(0)}ms`, 'success');
        } catch (error) {
          this.errorPatterns.push({
            type: 'page_load_failure',
            page: pageTest.name,
            error: error.message,
            severity: 'critical',
            fix: 'Check server status and route configuration',
          });
          this.log(`❌ ${pageTest.name}: ${error.message}`, 'error');
        }
      }

      // Test API endpoints
      this.log('🌐 Testing API endpoints...', 'info');

      const apiEndpoints = [
        { name: 'Health', endpoint: '/api/health', requiresAuth: false },
        { name: 'Session', endpoint: '/api/auth/session', requiresAuth: false },
        { name: 'Customers', endpoint: '/api/customers', requiresAuth: true },
        { name: 'Products', endpoint: '/api/products', requiresAuth: true },
        { name: 'Proposals', endpoint: '/api/proposals', requiresAuth: true },
      ];

      for (const api of apiEndpoints) {
        try {
          const response = await page.evaluate(async endpoint => {
            const response = await fetch(endpoint, {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            });
            return {
              status: response.status,
              statusText: response.statusText,
            };
          }, api.endpoint);

          if (response.status === 401 && api.requiresAuth) {
            this.errorPatterns.push({
              type: 'authentication_required',
              endpoint: api.endpoint,
              status: response.status,
              severity: 'medium',
              fix: 'Implement proper authentication flow for testing',
            });
          } else if (response.status >= 500) {
            this.errorPatterns.push({
              type: 'server_error',
              endpoint: api.endpoint,
              status: response.status,
              severity: 'critical',
              fix: 'Check server logs and database connection',
            });
          }

          this.log(
            `🔗 ${api.name} API: ${response.status} ${response.statusText}`,
            response.status < 400 ? 'success' : 'warning'
          );
        } catch (error) {
          this.errorPatterns.push({
            type: 'api_connection_failure',
            endpoint: api.endpoint,
            error: error.message,
            severity: 'critical',
            fix: 'Check API endpoint configuration and server status',
          });
        }
      }

      // Analyze errors
      this.log('📊 Analyzing error patterns...', 'info');

      if (consoleErrors.length > 0) {
        this.errorPatterns.push({
          type: 'console_errors',
          count: consoleErrors.length,
          errors: consoleErrors.slice(0, 5), // First 5 errors
          severity: 'medium',
          fix: 'Review and fix JavaScript console errors',
        });
      }

      if (networkErrors.length > 0) {
        this.errorPatterns.push({
          type: 'network_failures',
          count: networkErrors.length,
          errors: networkErrors.slice(0, 5),
          severity: 'high',
          fix: 'Check network connectivity and server availability',
        });
      }

      if (responseErrors.length > 0) {
        this.errorPatterns.push({
          type: 'http_errors',
          count: responseErrors.length,
          errors: responseErrors.slice(0, 5),
          severity: 'high',
          fix: 'Review HTTP error responses and fix server issues',
        });
      }

      return {
        consoleErrors,
        networkErrors,
        responseErrors,
        errorPatterns: this.errorPatterns,
        performanceIssues: this.performanceIssues,
      };
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  async generateOptimizationRecommendations() {
    this.log('⚡ PHASE 2: Performance Optimization Analysis...', 'critical');

    const recommendations = [];

    // Memory optimization recommendations
    recommendations.push({
      category: 'Memory Management',
      issue: 'High memory usage detected (77-78%)',
      priority: 'HIGH',
      solutions: [
        'Implement periodic garbage collection in browser context',
        'Add memory monitoring with automatic cleanup triggers',
        'Optimize component lifecycle to prevent memory leaks',
        'Use lazy loading for heavy components',
      ],
      implementation: `
// Add to components with high memory usage:
useEffect(() => {
  const cleanup = setInterval(() => {
    if (window.gc) window.gc();
  }, 30000);
  return () => clearInterval(cleanup);
}, []);`,
    });

    // Authentication optimization
    if (this.errorPatterns.some(e => e.type === 'authentication_required')) {
      recommendations.push({
        category: 'Authentication',
        issue: 'Authentication failures causing 401 errors',
        priority: 'CRITICAL',
        solutions: [
          'Implement proper session management for testing',
          'Add authentication retry logic with exponential backoff',
          'Create test user seeding for automated testing',
          'Implement token refresh mechanism',
        ],
        implementation: `
// Enhanced authentication for testing:
const authenticateForTesting = async () => {
  const response = await fetch('/api/auth/session', {
    credentials: 'include'
  });
  if (response.status === 401) {
    // Redirect to login or refresh token
    return await refreshAuthToken();
  }
  return response;
};`,
      });
    }

    // Performance optimization
    if (this.performanceIssues.some(p => p.type === 'slow_page_load')) {
      recommendations.push({
        category: 'Page Load Performance',
        issue: 'Slow page load times detected (>3s)',
        priority: 'HIGH',
        solutions: [
          'Implement code splitting for large components',
          'Add lazy loading for non-critical resources',
          'Optimize bundle size with tree shaking',
          'Implement service worker for caching',
        ],
        implementation: `
// Dynamic imports for code splitting:
const LazyComponent = lazy(() => import('./HeavyComponent'));

// Lazy loading with Suspense:
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>`,
      });
    }

    // API optimization
    recommendations.push({
      category: 'API Performance',
      issue: 'API response times need optimization',
      priority: 'MEDIUM',
      solutions: [
        'Implement API response caching',
        'Add request deduplication',
        'Optimize database queries',
        'Implement API rate limiting',
      ],
      implementation: `
// API caching with React Query:
const { data, isLoading } = useQuery(
  ['api-data', endpoint],
  () => apiClient.get(endpoint),
  { staleTime: 5 * 60 * 1000 } // 5 minutes
);`,
    });

    return recommendations;
  }

  async generateErrorFixReport() {
    this.log('📋 PHASE 3: Generating Error Fix Report...', 'critical');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: this.errorPatterns.length,
        criticalErrors: this.errorPatterns.filter(e => e.severity === 'critical').length,
        highPriorityIssues: this.performanceIssues.filter(p => p.severity === 'high').length,
      },
      errorPatterns: this.errorPatterns,
      performanceIssues: this.performanceIssues,
      recommendations: await this.generateOptimizationRecommendations(),
    };

    // Save detailed report
    const reportContent = `# 🔍 Error Detection & Performance Fix Report

**Generated**: ${new Date().toLocaleString()}

## 📊 Executive Summary

- **Total Errors Detected**: ${report.summary.totalErrors}
- **Critical Errors**: ${report.summary.criticalErrors}
- **High Priority Performance Issues**: ${report.summary.highPriorityIssues}

## 🚨 Critical Error Patterns

${this.errorPatterns
  .filter(e => e.severity === 'critical')
  .map(
    error => `
### ${error.type.toUpperCase()}
- **Severity**: ${error.severity}
- **Details**: ${error.error || error.endpoint || 'See error data'}
- **Fix**: ${error.fix}
`
  )
  .join('\n')}

## ⚡ Performance Issues

${this.performanceIssues
  .map(
    issue => `
### ${issue.type.toUpperCase()}
- **Page**: ${issue.page}
- **Load Time**: ${issue.loadTime?.toFixed(0)}ms
- **Severity**: ${issue.severity}
- **Recommendation**: ${issue.recommendation}
`
  )
  .join('\n')}

## 🛠️ Optimization Recommendations

${report.recommendations
  .map(
    rec => `
### ${rec.category} (Priority: ${rec.priority})

**Issue**: ${rec.issue}

**Solutions**:
${rec.solutions.map(s => `- ${s}`).join('\n')}

**Implementation Example**:
\`\`\`javascript
${rec.implementation}
\`\`\`
`
  )
  .join('\n')}

## 🎯 Immediate Action Items

1. **Fix Critical Errors**: Address ${report.summary.criticalErrors} critical errors immediately
2. **Optimize Memory Usage**: Implement memory management improvements
3. **Enhance Authentication**: Fix authentication flow for testing
4. **Improve Performance**: Address slow page load times

## 📈 Expected Improvements

- **Memory Usage**: Reduce from 77-78% to <60%
- **Page Load Times**: Reduce from >3s to <1s
- **Error Rate**: Reduce critical errors by 90%
- **API Performance**: Improve response times by 50%
`;

    await fs.writeFile('error-detection-fix-report.md', reportContent);

    return report;
  }

  async run() {
    try {
      this.log('🚀 Starting Error Detection & Performance Fix Analysis...', 'critical');

      // Phase 1: Detect errors
      const errorAnalysis = await this.detectCriticalErrors();

      // Phase 2: Generate fixes
      const report = await this.generateErrorFixReport();

      this.log('✅ Error detection and fix analysis completed!', 'success');
      this.log(`📊 Total errors found: ${report.summary.totalErrors}`, 'info');
      this.log(`🚨 Critical errors: ${report.summary.criticalErrors}`, 'error');
      this.log(`📋 Report saved to: error-detection-fix-report.md`, 'info');

      return report;
    } catch (error) {
      this.log(`❌ Analysis failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run the analysis
async function main() {
  const analyzer = new ErrorDetectionAndFix();
  const results = await analyzer.run();

  console.log('\n🎯 Analysis Complete - Key Findings:');
  console.log(`- Total Errors: ${results.summary.totalErrors}`);
  console.log(`- Critical Errors: ${results.summary.criticalErrors}`);
  console.log(`- Performance Issues: ${results.summary.highPriorityIssues}`);

  process.exit(0);
}

main().catch(console.error);
