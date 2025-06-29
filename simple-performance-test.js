#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { URL } = require('url');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  endpoints: [
    { name: 'Home Page', path: '/', target: 1000 },
    { name: 'Login Page', path: '/auth/login', target: 1500 },
    { name: 'Dashboard API', path: '/api/dashboard/stats', target: 500 },
    { name: 'Products API', path: '/api/products', target: 1000 },
    { name: 'Products Stats API', path: '/api/products/stats', target: 2000 },
    { name: 'Customers API', path: '/api/customers', target: 1000 },
  ]
};

class SimplePerformanceTest {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async testEndpoint(name, path, target) {
    console.log(`🔍 Testing ${name} (${path})...`);
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const url = new URL(path, CONFIG.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          const success = res.statusCode >= 200 && res.statusCode < 400;
          
          let rating = '❌ Poor';
          if (responseTime <= target * 0.5) {
            rating = '🟢 Excellent';
          } else if (responseTime <= target * 0.8) {
            rating = '🟡 Good';
          } else if (responseTime <= target) {
            rating = '🟠 Acceptable';
          }

          const result = {
            name,
            path,
            responseTime,
            target,
            statusCode: res.statusCode,
            success: success && responseTime <= target,
            rating,
            improvement: success && responseTime <= target ? '✅ Meets Target' : '⚠️ Needs Improvement'
          };

          this.results.push(result);
          
          console.log(`   Response: ${responseTime}ms (Target: ${target}ms) [${res.statusCode}] ${rating}`);
          console.log(`   Status: ${result.improvement}\n`);
          
          resolve(result);
        });
      });
      
      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        const result = {
          name,
          path,
          responseTime,
          target,
          statusCode: 0,
          success: false,
          rating: '❌ Failed',
          error: error.message,
          improvement: '❌ Connection Failed'
        };
        
        this.results.push(result);
        console.log(`   ❌ Error: ${error.message}\n`);
        resolve(result);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        const result = {
          name,
          path,
          responseTime: 10000,
          target,
          statusCode: 0,
          success: false,
          rating: '❌ Timeout',
          improvement: '❌ Timeout'
        };
        
        this.results.push(result);
        console.log(`   ❌ Timeout after 10 seconds\n`);
        resolve(result);
      });
    });
  }

  generateReport() {
    console.log('📈 SIMPLE PERFORMANCE TEST REPORT');
    console.log('=' .repeat(50));
    
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Successful: ${successfulTests} (${Math.round(successfulTests/totalTests*100)}%)`);
    console.log(`   Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
    
    const validResults = this.results.filter(r => r.responseTime && r.responseTime < 10000);
    if (validResults.length > 0) {
      const avgResponseTime = validResults.reduce((sum, r) => sum + r.responseTime, 0) / validResults.length;
      console.log(`   Average Response Time: ${Math.round(avgResponseTime)}ms`);
    }
    
    console.log(`\n📋 DETAILED RESULTS:`);
    this.results.forEach(result => {
      console.log(`\n   ${result.name}:`);
      console.log(`     Response Time: ${result.responseTime}ms (Target: ${result.target}ms)`);
      console.log(`     Status Code: ${result.statusCode}`);
      console.log(`     Rating: ${result.rating}`);
      console.log(`     Status: ${result.improvement}`);
    });

    // Performance insights
    console.log(`\n💡 PERFORMANCE INSIGHTS:`);
    
    const slowEndpoints = this.results.filter(r => r.responseTime > r.target);
    if (slowEndpoints.length > 0) {
      console.log(`   🐌 Slow endpoints:`);
      slowEndpoints.forEach(endpoint => {
        console.log(`     - ${endpoint.name}: ${endpoint.responseTime}ms (${endpoint.responseTime - endpoint.target}ms over target)`);
      });
    } else {
      console.log(`   ✅ All endpoints meet performance targets!`);
    }

    const errorEndpoints = this.results.filter(r => !r.success);
    if (errorEndpoints.length > 0) {
      console.log(`   ❌ Failed endpoints:`);
      errorEndpoints.forEach(endpoint => {
        console.log(`     - ${endpoint.name}: ${endpoint.error || 'Status ' + endpoint.statusCode}`);
      });
    }

    console.log(`\n⏱️ Total test time: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
  }

  async run() {
    console.log('🚀 Starting Simple Performance Test...\n');
    
    try {
      for (const endpoint of CONFIG.endpoints) {
        await this.testEndpoint(endpoint.name, endpoint.path, endpoint.target);
      }
      
      this.generateReport();
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }
}

const tester = new SimplePerformanceTest();
tester.run().catch(console.error);
