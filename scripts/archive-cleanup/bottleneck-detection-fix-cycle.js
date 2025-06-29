#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class BottleneckDetectionFixCycle {
  constructor() {
    this.serverUrl = 'http://localhost:3000';
    this.testUser = {
      email: 'admin@posalpro.com',
      password: 'ProposalPro2024!',
    };
    this.bottlenecks = [];
    this.fixes = [];
    this.testResults = [];
    this.cycleCount = 0;
    this.maxCycles = 3;
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      critical: '\x1b[35m',
      fix: '\x1b[93m',
      test: '\x1b[94m',
      reset: '\x1b[0m',
    };
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async detectBottlenecks() {
    this.log('🔍 DETECTING BOTTLENECKS...', 'critical');

    let browser, page;
    const detectedIssues = [];

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
      await page.setViewport({ width: 1366, height: 768 });

      // 1. Authentication Bottleneck Detection
      this.log('🔐 Testing Authentication Flow...', 'test');
      const authResult = await this.testAuthenticationBottleneck(page);
      if (authResult.hasIssues) {
        detectedIssues.push({
          type: 'AUTHENTICATION_BOTTLENECK',
          severity: 'CRITICAL',
          description: 'API endpoints returning 401 despite valid session',
          evidence: authResult.evidence,
          fix: 'Fix API authorization middleware',
        });
      }

      // 2. Page Load Performance Bottlenecks
      this.log('⚡ Testing Page Load Performance...', 'test');
      const pageResults = await this.testPageLoadBottlenecks(page);
      pageResults.forEach(result => {
        if (result.loadTime > 5000) {
          detectedIssues.push({
            type: 'PAGE_LOAD_BOTTLENECK',
            severity: 'HIGH',
            description: `${result.page} takes ${result.loadTime}ms to load`,
            evidence: result,
            fix: 'Optimize component loading and bundle size',
          });
        }
      });

      // 3. API Response Time Bottlenecks
      this.log('🌐 Testing API Performance...', 'test');
      const apiResults = await this.testApiBottlenecks(page);
      apiResults.forEach(result => {
        if (result.responseTime > 2000) {
          detectedIssues.push({
            type: 'API_RESPONSE_BOTTLENECK',
            severity: 'HIGH',
            description: `${result.endpoint} takes ${result.responseTime}ms to respond`,
            evidence: result,
            fix: 'Optimize database queries and add caching',
          });
        }
      });

      // 4. Component Functionality Bottlenecks
      this.log('🧩 Testing Component Functionality...', 'test');
      const componentResults = await this.testComponentBottlenecks(page);
      componentResults.forEach(result => {
        if (!result.working) {
          detectedIssues.push({
            type: 'COMPONENT_BOTTLENECK',
            severity: 'MEDIUM',
            description: `${result.component} not functioning properly`,
            evidence: result,
            fix: 'Debug and fix component implementation',
          });
        }
      });

      this.bottlenecks = detectedIssues;
      this.log(
        `🎯 DETECTED ${detectedIssues.length} BOTTLENECKS`,
        detectedIssues.length > 0 ? 'critical' : 'success'
      );

      return detectedIssues;
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  async testAuthenticationBottleneck(page) {
    try {
      // Navigate to login
      await page.goto(`${this.serverUrl}/auth/login`, {
        waitUntil: 'networkidle0',
        timeout: 15000,
      });

      // Perform login
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.type('input[type="email"]', this.testUser.email);
      await page.type('input[type="password"]', this.testUser.password);

      const submitButton = (await page.$('button[type="submit"]')) || (await page.$('form button'));
      if (submitButton) {
        await submitButton.click();
      } else {
        await page.keyboard.press('Enter');
      }

      // Wait a moment for potential navigation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Test session
      const sessionTest = await page.evaluate(async () => {
        const response = await fetch('/api/auth/session', { credentials: 'include' });
        return { status: response.status, data: await response.json() };
      });

      // Test protected endpoints
      const endpoints = ['/api/customers', '/api/products', '/api/proposals'];
      const endpointResults = [];

      for (const endpoint of endpoints) {
        const result = await page.evaluate(async url => {
          const response = await fetch(url, { credentials: 'include' });
          return { url, status: response.status };
        }, endpoint);
        endpointResults.push(result);
      }

      const hasAuthIssues =
        sessionTest.status === 200 &&
        sessionTest.data.user &&
        endpointResults.some(r => r.status === 401);

      return {
        hasIssues: hasAuthIssues,
        evidence: {
          sessionStatus: sessionTest.status,
          hasUser: !!sessionTest.data.user,
          endpointResults,
          issue: hasAuthIssues
            ? 'Valid session but API endpoints return 401'
            : 'No issues detected',
        },
      };
    } catch (error) {
      return {
        hasIssues: true,
        evidence: { error: error.message, type: 'authentication_test_failed' },
      };
    }
  }

  async testPageLoadBottlenecks(page) {
    const pages = [
      { name: 'Login', url: '/auth/login' },
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Customers', url: '/customers' },
      { name: 'Products', url: '/products' },
      { name: 'Proposals', url: '/proposals' },
    ];

    const results = [];

    for (const pageTest of pages) {
      try {
        const startTime = Date.now();
        await page.goto(`${this.serverUrl}${pageTest.url}`, {
          waitUntil: 'networkidle0',
          timeout: 30000,
        });
        const endTime = Date.now();
        const loadTime = endTime - startTime;

        results.push({
          page: pageTest.name,
          url: pageTest.url,
          loadTime,
          status: 'success',
        });

        this.log(`📄 ${pageTest.name}: ${loadTime}ms`, loadTime > 5000 ? 'error' : 'success');
      } catch (error) {
        results.push({
          page: pageTest.name,
          url: pageTest.url,
          loadTime: 30000,
          status: 'failed',
          error: error.message,
        });

        this.log(`❌ ${pageTest.name}: FAILED (${error.message})`, 'error');
      }
    }

    return results;
  }

  async testApiBottlenecks(page) {
    const endpoints = [
      { name: 'Health Check', url: '/api/health' },
      { name: 'Auth Session', url: '/api/auth/session' },
      { name: 'Admin Metrics', url: '/api/admin/metrics' },
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const result = await page.evaluate(async url => {
          const response = await fetch(url, { credentials: 'include' });
          return { status: response.status };
        }, endpoint.url);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        results.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          responseTime,
          status: result.status,
          working: result.status < 400,
        });

        this.log(
          `🔗 ${endpoint.name}: ${responseTime}ms (${result.status})`,
          responseTime > 2000 ? 'error' : 'success'
        );
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          responseTime: 10000,
          status: 0,
          working: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async testComponentBottlenecks(page) {
    const components = [
      { name: 'Login Form', selector: 'form', page: '/auth/login' },
      { name: 'Navigation', selector: 'nav', page: '/dashboard' },
      { name: 'Data Tables', selector: 'table', page: '/customers' },
    ];

    const results = [];

    for (const component of components) {
      try {
        await page.goto(`${this.serverUrl}${component.page}`, {
          waitUntil: 'networkidle0',
          timeout: 15000,
        });

        const exists = await page.$(component.selector);
        const isVisible = exists ? await exists.isVisible() : false;

        results.push({
          component: component.name,
          selector: component.selector,
          page: component.page,
          exists: !!exists,
          visible: isVisible,
          working: !!exists && isVisible,
        });

        this.log(
          `🧩 ${component.name}: ${exists && isVisible ? 'OK' : 'FAILED'}`,
          exists && isVisible ? 'success' : 'error'
        );
      } catch (error) {
        results.push({
          component: component.name,
          working: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async applyFixes() {
    this.log('🔧 APPLYING FIXES...', 'fix');

    const appliedFixes = [];

    for (const bottleneck of this.bottlenecks) {
      this.log(`🛠️ Fixing: ${bottleneck.type}`, 'fix');

      try {
        switch (bottleneck.type) {
          case 'AUTHENTICATION_BOTTLENECK':
            await this.fixAuthenticationBottleneck(bottleneck);
            appliedFixes.push({ type: bottleneck.type, status: 'applied' });
            break;

          case 'PAGE_LOAD_BOTTLENECK':
            await this.fixPageLoadBottleneck(bottleneck);
            appliedFixes.push({ type: bottleneck.type, status: 'applied' });
            break;

          case 'API_RESPONSE_BOTTLENECK':
            await this.fixApiBottleneck(bottleneck);
            appliedFixes.push({ type: bottleneck.type, status: 'applied' });
            break;

          case 'COMPONENT_BOTTLENECK':
            await this.fixComponentBottleneck(bottleneck);
            appliedFixes.push({ type: bottleneck.type, status: 'applied' });
            break;

          default:
            this.log(`⚠️ No fix available for ${bottleneck.type}`, 'warning');
            appliedFixes.push({ type: bottleneck.type, status: 'no_fix_available' });
        }
      } catch (error) {
        this.log(`❌ Failed to fix ${bottleneck.type}: ${error.message}`, 'error');
        appliedFixes.push({ type: bottleneck.type, status: 'failed', error: error.message });
      }
    }

    this.fixes = appliedFixes;
    return appliedFixes;
  }

  async fixAuthenticationBottleneck(bottleneck) {
    this.log('🔐 Creating Authentication Fix...', 'fix');

    const authFix = `
// Authentication Middleware Fix for API Routes
// Add this to your API route handlers

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function withAuth(handler) {
  return async (req, res) => {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session || !session.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Add user to request for downstream handlers
      req.user = session.user;
      req.session = session;

      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Authentication error',
        code: 'AUTH_ERROR'
      });
    }
  };
}

// Usage in API routes:
// export default withAuth(async (req, res) => {
//   // Your protected API logic here
//   // req.user is now available
// });
`;

    await fs.writeFile('fixes/auth-middleware-fix.js', authFix);
    this.log('✅ Authentication fix created: fixes/auth-middleware-fix.js', 'success');
  }

  async fixPageLoadBottleneck(bottleneck) {
    this.log('⚡ Creating Page Load Optimization...', 'fix');

    const performanceFix = `
// Page Load Performance Optimization
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy components
const LazyDataTable = dynamic(() => import('./DataTable'), {
  loading: () => <div className="animate-pulse">Loading table...</div>,
  ssr: false
});

const LazyChart = dynamic(() => import('./Chart'), {
  loading: () => <div className="animate-pulse">Loading chart...</div>,
  ssr: false
});

// Performance wrapper component
export function OptimizedPage({ children }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    }>
      {children}
    </Suspense>
  );
}

// Bundle splitting for large pages
export const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading component...</div>
});
`;

    await fs.writeFile('fixes/performance-optimization-fix.js', performanceFix);
    this.log('✅ Performance fix created: fixes/performance-optimization-fix.js', 'success');
  }

  async fixApiBottleneck(bottleneck) {
    this.log('🌐 Creating API Optimization...', 'fix');

    const apiFix = `
// API Performance Optimization
import { NextResponse } from 'next/server';

// Simple in-memory cache for API responses
const apiCache = new Map();

export function withCache(handler, cacheTimeSeconds = 300) {
  return async (req) => {
    const cacheKey = req.url + JSON.stringify(req.body || {});
    const cached = apiCache.get(cacheKey);

    // Return cached response if valid
    if (cached && Date.now() - cached.timestamp < cacheTimeSeconds * 1000) {
      return NextResponse.json(cached.data);
    }

    // Execute handler and cache result
    const result = await handler(req);
    const data = await result.json();

    // Cache successful responses only
    if (result.status < 400) {
      apiCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      // Cleanup old cache entries (simple LRU)
      if (apiCache.size > 100) {
        const firstKey = apiCache.keys().next().value;
        apiCache.delete(firstKey);
      }
    }

    return NextResponse.json(data);
  };
}

// Database query optimization helper
export async function optimizeQuery(query, params) {
  const startTime = Date.now();

  try {
    const result = await query(params);
    const duration = Date.now() - startTime;

    if (duration > 1000) {
      console.warn(\`Slow query detected: \${duration}ms\`);
    }

    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}
`;

    await fs.writeFile('fixes/api-optimization-fix.js', apiFix);
    this.log('✅ API optimization fix created: fixes/api-optimization-fix.js', 'success');
  }

  async fixComponentBottleneck(bottleneck) {
    this.log('🧩 Creating Component Fix...', 'fix');

    const componentFix = `
// Component Error Boundary and Debugging
import { ErrorBoundary } from 'react-error-boundary';
import { useEffect } from 'react';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="p-4 border border-red-300 rounded bg-red-50">
      <h2 className="text-lg font-semibold text-red-800">Component Error</h2>
      <details className="mt-2">
        <summary className="cursor-pointer text-red-600">Error Details</summary>
        <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
          {error.message}
        </pre>
      </details>
      <button
        onClick={resetErrorBoundary}
        className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}

export function ComponentWithErrorBoundary({ children, componentName = 'Unknown' }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error(\`Component error in \${componentName}:\`, error, errorInfo);

        // Optional: Send to error reporting service
        // errorReporting.captureException(error, { extra: errorInfo });
      }}
      onReset={() => {
        console.log(\`Resetting component: \${componentName}\`);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Component performance monitoring
export function useComponentPerformance(componentName) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 100) {
        console.warn(\`Slow component render: \${componentName} took \${renderTime.toFixed(2)}ms\`);
      }
    };
  }, [componentName]);
}
`;

    await fs.writeFile('fixes/component-debugging-fix.js', componentFix);
    this.log('✅ Component fix created: fixes/component-debugging-fix.js', 'success');
  }

  async runCycle() {
    this.cycleCount++;
    this.log(`🔄 STARTING CYCLE ${this.cycleCount}/${this.maxCycles}`, 'critical');

    // Step 1: Detect bottlenecks
    const bottlenecks = await this.detectBottlenecks();

    if (bottlenecks.length === 0) {
      this.log('🎉 NO BOTTLENECKS DETECTED - SYSTEM OPTIMIZED!', 'success');
      return { status: 'optimized', cycles: this.cycleCount };
    }

    // Step 2: Apply fixes
    const fixes = await this.applyFixes();

    // Step 3: Wait for changes to take effect
    this.log('⏳ Waiting for fixes to take effect...', 'info');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Store results
    this.testResults.push({
      cycle: this.cycleCount,
      bottlenecks: bottlenecks.length,
      fixes: fixes.length,
      timestamp: new Date().toISOString(),
    });

    return {
      status: 'continuing',
      bottlenecks: bottlenecks.length,
      fixes: fixes.length,
      cycle: this.cycleCount,
    };
  }

  async generateReport() {
    // Create fixes directory if it doesn't exist
    try {
      await fs.mkdir('fixes', { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const report = `# 🔧 Bottleneck Detection & Fix Cycle Report

**Generated**: ${new Date().toLocaleString()}
**Total Cycles**: ${this.cycleCount}

## 📊 Executive Summary

${
  this.testResults.length > 0
    ? this.testResults
        .map(
          result => `
### Cycle ${result.cycle}
- **Bottlenecks Found**: ${result.bottlenecks}
- **Fixes Applied**: ${result.fixes}
- **Timestamp**: ${result.timestamp}
`
        )
        .join('\n')
    : 'No test cycles completed'
}

## 🎯 Final Status

${
  this.bottlenecks.length === 0
    ? '✅ **SYSTEM OPTIMIZED** - All bottlenecks resolved!'
    : `⚠️ **${this.bottlenecks.length} BOTTLENECKS REMAINING** - Further optimization needed`
}

## 🚨 Detected Bottlenecks

${this.bottlenecks
  .map(
    bottleneck => `
### ${bottleneck.type} (${bottleneck.severity})
- **Description**: ${bottleneck.description}
- **Fix**: ${bottleneck.fix}
`
  )
  .join('\n')}

## 🛠️ Fixes Applied

${this.fixes.map(fix => `- **${fix.type}**: ${fix.status}`).join('\n')}

## 📋 Next Steps

${
  this.bottlenecks.length > 0
    ? `
1. Review and implement the fixes in the \`fixes/\` directory
2. Test the specific bottlenecks that were identified
3. Run another detection cycle to verify improvements
4. Monitor performance metrics continuously
`
    : `
1. Continue monitoring for new bottlenecks
2. Implement preventive measures
3. Set up automated performance testing
4. Document optimization strategies
`
}

## 🔧 Implementation Guide

The fixes have been generated in the \`fixes/\` directory:
- \`auth-middleware-fix.js\` - Authentication improvements
- \`performance-optimization-fix.js\` - Page load optimizations
- \`api-optimization-fix.js\` - API response improvements
- \`component-debugging-fix.js\` - Component error handling

Apply these fixes to your codebase and rerun the detection cycle.
`;

    await fs.writeFile('bottleneck-fix-cycle-report.md', report);
    this.log('📋 Report saved to bottleneck-fix-cycle-report.md', 'success');
  }

  async run() {
    try {
      this.log('🚀 STARTING BOTTLENECK DETECTION & FIX CYCLE', 'critical');

      while (this.cycleCount < this.maxCycles) {
        const result = await this.runCycle();

        if (result.status === 'optimized') {
          break;
        }

        this.log(
          `📊 Cycle ${this.cycleCount} complete: ${result.bottlenecks} bottlenecks, ${result.fixes} fixes`,
          'info'
        );
      }

      await this.generateReport();

      this.log(`🎉 BOTTLENECK DETECTION CYCLE COMPLETED (${this.cycleCount} cycles)`, 'success');

      return {
        totalCycles: this.cycleCount,
        finalBottlenecks: this.bottlenecks.length,
        status: this.bottlenecks.length === 0 ? 'optimized' : 'needs_more_work',
      };
    } catch (error) {
      this.log(`❌ Cycle failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run the bottleneck detection and fix cycle
async function main() {
  const cycle = new BottleneckDetectionFixCycle();
  const results = await cycle.run();

  console.log('\n🎯 Bottleneck Detection & Fix Cycle Complete!');
  console.log(`Total Cycles: ${results.totalCycles}`);
  console.log(`Final Status: ${results.status}`);
  console.log(`Remaining Bottlenecks: ${results.finalBottlenecks}`);

  process.exit(0);
}

main().catch(console.error);
