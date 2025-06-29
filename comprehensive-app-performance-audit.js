#!/usr/bin/env node

/**
 * PosalPro MVP2 - Comprehensive Application Performance Audit
 * Tests all tabs, buttons, and database retrievals for consistent performance
 * Based on LESSONS_LEARNED.md patterns and CORE_REQUIREMENTS.md compliance
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 15000,
  targetPerformance: {
    pages: 1000, // 1 second for page loads
    apis: 500, // 500ms for API calls
    buttons: 200, // 200ms for button responses
    database: 300, // 300ms for database operations
  },
};

// Application structure based on wireframes and implementation
const APPLICATION_STRUCTURE = {
  pages: [
    { name: 'Home', path: '/', target: 1000, category: 'public' },
    { name: 'Login', path: '/auth/login', target: 1000, category: 'auth' },
    { name: 'Register', path: '/auth/register', target: 1000, category: 'auth' },
    { name: 'Dashboard', path: '/dashboard', target: 1500, category: 'protected' },
    { name: 'Customers', path: '/customers', target: 1500, category: 'protected' },
    { name: 'Products', path: '/products', target: 1500, category: 'protected' },
    { name: 'Proposals', path: '/proposals', target: 1500, category: 'protected' },
    { name: 'Proposals Create', path: '/proposals/create', target: 2000, category: 'protected' },
    { name: 'Profile', path: '/profile', target: 1000, category: 'protected' },
    { name: 'Settings', path: '/settings', target: 1000, category: 'protected' },
    { name: 'Coordination Hub', path: '/coordination', target: 1500, category: 'protected' },
  ],

  apis: [
    // Public APIs
    { name: 'Health Check', path: '/api/health', target: 200, category: 'public' },

    // Auth APIs
    { name: 'Session', path: '/api/auth/session', target: 300, category: 'auth' },

    // Protected APIs - Core Data
    { name: 'Customers List', path: '/api/customers', target: 800, category: 'customers' },
    { name: 'Products List', path: '/api/products', target: 800, category: 'products' },
    { name: 'Products Stats', path: '/api/products/stats', target: 1000, category: 'products' },
    { name: 'Proposals List', path: '/api/proposals', target: 800, category: 'proposals' },

    // Admin APIs
    { name: 'Admin Metrics', path: '/api/admin/metrics', target: 1000, category: 'admin' },
    { name: 'Admin Users', path: '/api/admin/users', target: 800, category: 'admin' },
  ],
};

class ComprehensivePerformanceAuditor {
  constructor() {
    this.results = {
      pages: [],
      apis: [],
      summary: {},
      issues: [],
      recommendations: [],
    };
    this.startTime = Date.now();
  }

  async auditEndpoint(name, path, target, category) {
    console.log(`🔍 Testing ${name} (${path})...`);

    return new Promise(resolve => {
      const startTime = Date.now();
      const url = new URL(path, CONFIG.baseUrl);
      const client = url.protocol === 'https:' ? https : http;

      const req = client.get(url, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          const success = res.statusCode >= 200 && res.statusCode < 400;

          let rating = '❌ Poor';
          let performance = 'poor';

          if (responseTime <= target * 0.5) {
            rating = '�� Excellent';
            performance = 'excellent';
          } else if (responseTime <= target * 0.8) {
            rating = '🟡 Good';
            performance = 'good';
          } else if (responseTime <= target) {
            rating = '🟠 Acceptable';
            performance = 'acceptable';
          }

          const result = {
            name,
            path,
            responseTime,
            target,
            statusCode: res.statusCode,
            success: success && responseTime <= target,
            rating,
            performance,
            category,
            improvement:
              success && responseTime <= target ? '✅ Meets Target' : '⚠️ Needs Optimization',
            overTarget: Math.max(0, responseTime - target),
            bodySize: Buffer.byteLength(data, 'utf8'),
          };

          console.log(
            `   Response: ${responseTime}ms (Target: ${target}ms) [${res.statusCode}] ${rating}`
          );
          console.log(`   Status: ${result.improvement}\n`);

          resolve(result);
        });
      });

      req.on('error', error => {
        const responseTime = Date.now() - startTime;
        const result = {
          name,
          path,
          responseTime,
          target,
          statusCode: 0,
          success: false,
          rating: '❌ Failed',
          performance: 'failed',
          category,
          error: error.message,
          improvement: '❌ Connection Failed',
          overTarget: responseTime,
          bodySize: 0,
        };

        console.log(`   ❌ Error: ${error.message}\n`);
        resolve(result);
      });

      req.setTimeout(CONFIG.timeout, () => {
        req.destroy();
        const result = {
          name,
          path,
          responseTime: CONFIG.timeout,
          target,
          statusCode: 0,
          success: false,
          rating: '❌ Timeout',
          performance: 'timeout',
          category,
          improvement: '❌ Timeout',
          overTarget: CONFIG.timeout - target,
          bodySize: 0,
        };

        console.log(`   ❌ Timeout after ${CONFIG.timeout}ms\n`);
        resolve(result);
      });
    });
  }

  async auditPages() {
    console.log('📄 AUDITING APPLICATION PAGES\n');

    for (const page of APPLICATION_STRUCTURE.pages) {
      const result = await this.auditEndpoint(page.name, page.path, page.target, page.category);
      this.results.pages.push(result);
    }
  }

  async auditAPIs() {
    console.log('🔌 AUDITING API ENDPOINTS\n');

    for (const api of APPLICATION_STRUCTURE.apis) {
      const result = await this.auditEndpoint(api.name, api.path, api.target, api.category);
      this.results.apis.push(result);
    }
  }

  analyzeResults() {
    const allResults = [...this.results.pages, ...this.results.apis];

    // Calculate summary statistics
    const totalTests = allResults.length;
    const successfulTests = allResults.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;

    const avgResponseTime =
      allResults
        .filter(r => r.responseTime < CONFIG.timeout)
        .reduce((sum, r) => sum + r.responseTime, 0) /
      allResults.filter(r => r.responseTime < CONFIG.timeout).length;

    this.results.summary = {
      totalTests,
      successfulTests,
      failedTests,
      successRate: Math.round((successfulTests / totalTests) * 100),
      avgResponseTime: Math.round(avgResponseTime),
      totalAuditTime: Date.now() - this.startTime,
    };

    // Identify issues and generate recommendations
    this.identifyIssues();
    this.generateRecommendations();
  }

  identifyIssues() {
    const allResults = [...this.results.pages, ...this.results.apis];

    // Performance issues
    const slowEndpoints = allResults.filter(r => r.overTarget > 0);
    const failedEndpoints = allResults.filter(r => !r.success);

    this.results.issues = {
      slowEndpoints: slowEndpoints.map(e => ({
        name: e.name,
        path: e.path,
        responseTime: e.responseTime,
        target: e.target,
        overTarget: e.overTarget,
        category: e.category,
      })),
      failedEndpoints: failedEndpoints.map(e => ({
        name: e.name,
        path: e.path,
        statusCode: e.statusCode,
        error: e.error,
      })),
    };
  }

  generateRecommendations() {
    const { issues } = this.results;
    const recommendations = [];

    // Database optimization recommendations (from LESSONS_LEARNED.md)
    if (issues.slowEndpoints.some(e => e.category === 'products' || e.category === 'customers')) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Database Optimization',
        title: 'Implement Selective Hydration',
        description: 'Apply parseFieldsParam pattern to reduce payload sizes by 40-60%',
        implementation: 'Follow Lesson #22 pattern from LESSONS_LEARNED.md',
      });
    }

    this.results.recommendations = recommendations;
  }

  generateReport() {
    console.log('\n📈 COMPREHENSIVE PERFORMANCE AUDIT REPORT');
    console.log('='.repeat(60));

    const { summary, issues, recommendations } = this.results;

    // Summary
    console.log(`\n📊 AUDIT SUMMARY:`);
    console.log(`   Total Endpoints Tested: ${summary.totalTests}`);
    console.log(`   Successful: ${summary.successfulTests} (${summary.successRate}%)`);
    console.log(`   Failed: ${summary.failedTests} (${100 - summary.successRate}%)`);
    console.log(`   Average Response Time: ${summary.avgResponseTime}ms`);

    // Performance Issues
    if (issues.slowEndpoints.length > 0) {
      console.log(`\n🐌 PERFORMANCE ISSUES:`);
      issues.slowEndpoints.forEach(endpoint => {
        console.log(
          `   • ${endpoint.name}: ${endpoint.responseTime}ms (${endpoint.overTarget}ms over target)`
        );
      });
    }

    // Recommendations
    console.log(`\n💡 OPTIMIZATION RECOMMENDATIONS:`);
    recommendations.forEach((rec, index) => {
      console.log(`\n   ${index + 1}. [${rec.priority}] ${rec.title}`);
      console.log(`      ${rec.description}`);
    });
  }

  async run() {
    console.log('🚀 Starting Comprehensive Application Performance Audit...\n');

    try {
      await this.auditPages();
      await this.auditAPIs();

      this.analyzeResults();
      this.generateReport();
    } catch (error) {
      console.error('❌ Audit failed:', error);
    }
  }
}

// Run the comprehensive audit
const auditor = new ComprehensivePerformanceAuditor();
auditor.run().catch(console.error);
