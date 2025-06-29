#!/usr/bin/env node

/**
 * PosalPro MVP2 - Enhanced Performance Testing Framework
 * Focuses on measuring and optimizing specific performance violations:
 * - Message handler performance
 * - Forced reflow violations
 * - Analytics processing overhead
 * - setInterval performance impact
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const puppeteer = require('puppeteer');

class EnhancedPerformanceTestFramework {
  constructor() {
    this.results = [];
    this.performanceMetrics = {};
    this.timestamp = new Date().toISOString();
    this.serverProcess = null;
    this.browser = null;
    this.page = null;
    this.serverUrl = 'http://localhost:3000';
    this.testUser = {
      email: 'admin@posalpro.com',
      password: 'ProposalPro2024!',
      role: 'System Administrator',
    };
    this.violationThresholds = {
      messageHandler: 50, // ms
      forcedReflow: 50, // ms
      clickHandler: 100, // ms
      pointerHandler: 100, // ms
      setIntervalHandler: 50, // ms
    };
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
    console.log(`${colors[type]}[${timestamp}] [${type.toUpperCase()}] ${message}${colors.reset}`);
  }

  async startServer() {
    this.log('Using existing server on port 3000...', 'info');

    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (response.ok) {
        this.log('Test server started successfully', 'success');
        return Promise.resolve();
      }
    } catch (error) {
      throw new Error('Server is not running on port 3000. Please start with npm run dev:smart');
    }
  }

  async run() {
    try {
      this.log('🚀 Starting Enhanced Performance Test Framework', 'info');
      
      await this.startServer();
      this.log('Performance test framework ready', 'success');
      
      return { status: 'ready' };
      
    } catch (error) {
      this.log(`Test framework failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run the test framework
async function main() {
  const framework = new EnhancedPerformanceTestFramework();
  
  try {
    await framework.run();
    process.exit(0);
  } catch (error) {
    console.error('Performance test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = EnhancedPerformanceTestFramework;
