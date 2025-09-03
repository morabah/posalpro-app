#!/usr/bin/env tsx

/**
 * PosalPro UI Testing CLI
 *
 * Comprehensive CLI tool for testing all UI functionalities through command line
 * Extends the existing app-cli with UI-specific testing capabilities
 */

import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/db/prisma';
import { logError, logInfo } from '../src/lib/logger';

type TestType = 'wizard' | 'products' | 'customers' | 'dashboard' | 'auth' | 'performance' | 'all';

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
  metadata?: Record<string, any>;
}

class UITestCLI {
  private testResults: TestResult[] = [];
  private sessionCookies: string[] = [];
  private isAuthenticated: boolean = false;

  constructor() {
    this.testResults = [];
    this.loadSession();
  }

  private loadSession() {
    // Try to load existing session from file
    const sessionFile = path.resolve(process.cwd(), '.posalpro-ui-session.json');
    if (fs.existsSync(sessionFile)) {
      try {
        const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
        if (sessionData.cookies && Array.isArray(sessionData.cookies)) {
          this.sessionCookies = sessionData.cookies;
          this.isAuthenticated = true;
          logInfo('Loaded existing session', {
            component: 'UITestCLI',
            cookiesCount: this.sessionCookies.length,
          });
        }
      } catch (error) {
        logError('Failed to load session', {
          component: 'UITestCLI',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private saveSession() {
    const sessionFile = path.resolve(process.cwd(), '.posalpro-ui-session.json');
    try {
      fs.writeFileSync(
        sessionFile,
        JSON.stringify(
          {
            cookies: this.sessionCookies,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
    } catch (error) {
      logError('Failed to save session', {
        component: 'UITestCLI',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Enhanced fetch wrapper
  private async fetch(url: string, options: any = {}) {
    const enhancedOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PosalPro-UI-Test-CLI/1.0',
        ...options.headers,
        ...(this.sessionCookies.length > 0 && {
          Cookie: this.sessionCookies.join('; '),
        }),
      },
    };

    try {
      const response = await fetch(url, enhancedOptions);
      return response;
    } catch (error) {
      logError('Fetch failed', {
        component: 'UITestCLI',
        operation: 'fetch',
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Server health check
  private async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      logError('Server health check failed', {
        component: 'UITestCLI',
        error: error instanceof Error ? error.message : 'Unknown error',
        baseUrl: BASE_URL,
      });
      return false;
    }
  }

  // Authentication testing
  async testAuthentication() {
    logInfo('Testing authentication flows', {
      component: 'UITestCLI',
      operation: 'testAuthentication',
    });

    await this.runTest('Login with valid credentials', async () => {
      // Skip if already authenticated
      if (this.isAuthenticated && this.sessionCookies.length > 0) {
        return {
          success: true,
          message: 'Already authenticated',
          cookies: this.sessionCookies.length,
        };
      }

      // Step 1: Get CSRF token from NextAuth
      const csrfResponse = await this.fetch(`${BASE_URL}/api/auth/csrf`, {
        method: 'GET',
      });

      if (!csrfResponse.ok) {
        const errorText = await csrfResponse.text();
        throw new Error(
          `CSRF token fetch failed: ${csrfResponse.status} ${csrfResponse.statusText} - ${errorText}`
        );
      }

      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;

      const csrfCookies = csrfResponse.headers.get('set-cookie');
      if (csrfCookies) {
        // Add CSRF cookies to our collection
        this.sessionCookies = csrfCookies.split(',').map(c => c.trim());
      }

      // Step 2: Validate credentials with PosalPro login endpoint
      const validateResponse = await this.fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@posalpro.com',
          password: 'ProposalPro2024!',
          role: 'System Administrator',
          rememberMe: true,
        }),
      });

      if (!validateResponse.ok) {
        const errorText = await validateResponse.text();
        throw new Error(
          `Login validation failed: ${validateResponse.status} ${validateResponse.statusText} - ${errorText}`
        );
      }

      // Step 3: Use NextAuth callback with real CSRF token
      const authResponse = await this.fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          csrfToken: csrfToken,
          email: 'admin@posalpro.com',
          password: 'ProposalPro2024!',
          callbackUrl: `${BASE_URL}/dashboard`,
        }).toString(),
        redirect: 'manual',
      });

      if (!authResponse.ok && authResponse.status !== 302) {
        const errorText = await authResponse.text();
        throw new Error(
          `NextAuth authentication failed: ${authResponse.status} ${authResponse.statusText} - ${errorText}`
        );
      }

      // Step 4: Verify session by calling NextAuth session endpoint
      const sessionResponse = await this.fetch(`${BASE_URL}/api/auth/session`, {
        method: 'GET',
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        throw new Error(
          `Session verification failed: ${sessionResponse.status} ${sessionResponse.statusText} - ${errorText}`
        );
      }

      // Combine cookies from both responses
      let allCookies: string[] = [];
      const authCookieHeader = authResponse.headers.get('set-cookie');
      const sessionCookieHeader = sessionResponse.headers.get('set-cookie');

      if (authCookieHeader) {
        allCookies = allCookies.concat(authCookieHeader.split(',').map(c => c.trim()));
      }
      if (sessionCookieHeader) {
        allCookies = allCookies.concat(sessionCookieHeader.split(',').map(c => c.trim()));
      }

      if (allCookies.length > 0) {
        // Filter out duplicates and keep only relevant cookies
        this.sessionCookies = allCookies.filter(
          (cookie, index, arr) =>
            arr.findIndex(c => c.split('=')[0] === cookie.split('=')[0]) === index
        );
        this.isAuthenticated = true;
        this.saveSession(); // Save session for future use
        console.log(
          `🔐 Login successful: ${this.sessionCookies.length} cookies, authenticated: ${this.isAuthenticated}`
        );
      } else {
        throw new Error('No session cookies received from authentication flow');
      }

      return { success: true, cookies: this.sessionCookies.length };
    });

    await this.runTest('Access protected route', async () => {
      if (!this.isAuthenticated || this.sessionCookies.length === 0) {
        throw new Error('Not authenticated - authentication test must pass first');
      }

      const response = await this.fetch(`${BASE_URL}/api/proposals`);

      if (response.status === 401) {
        throw new Error('Unauthorized access - authentication failed');
      }

      if (!response.ok) {
        throw new Error(
          `Failed to access protected route: ${response.status} ${response.statusText}`
        );
      }

      return { success: true, status: response.status };
    });
  }

  // Proposal wizard testing
  async testProposalWizard() {
    logInfo('Testing proposal wizard (all 6 steps)', {
      component: 'UITestCLI',
      operation: 'testProposalWizard',
    });

    await this.runTest('Step 1: Basic Information', async () => {
      const step1Data = {
        title: 'UI Test Proposal',
        description: 'Testing proposal wizard step 1',
        customerId: await this.getTestCustomerId(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'MEDIUM',
        value: 50000,
        currency: 'USD',
        projectType: 'RFQ',
        tags: ['ui-test', 'wizard'],
      };

      const response = await this.fetch(`${BASE_URL}/api/proposals`, {
        method: 'POST',
        body: JSON.stringify({
          basicInfo: step1Data,
          teamData: {},
          contentData: {},
          productData: {},
          sectionData: {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Step 1 failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, proposalId: result.data?.id };
    });

    await this.runTest('Step 4: Product Selection', async () => {
      const proposalId = await this.getTestProposalId();
      const products = await this.getTestProducts();

      const productData = {
        products: products.slice(0, 2).map((product, index) => ({
          id: `temp-${index}`,
          productId: product.id,
          name: product.name,
          quantity: index + 1,
          unitPrice: 10000 + index * 5000,
          total: (10000 + index * 5000) * (index + 1),
          discount: 0,
          category: product.category[0] || 'General',
          configuration: {},
          included: true,
        })),
        totalValue: products
          .slice(0, 2)
          .reduce((sum, _, index) => sum + (10000 + index * 5000) * (index + 1), 0),
        searchQuery: '',
        selectedCategory: '',
      };

      const response = await this.fetch(`${BASE_URL}/api/proposals/${proposalId}`, {
        method: 'PUT',
        body: JSON.stringify({
          productData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Step 4 failed: ${response.status} ${response.statusText}`);
      }

      return { success: true, productsCount: productData.products.length };
    });
  }

  // Product management testing
  async testProductManagement() {
    logInfo('Testing product management functionality', {
      component: 'UITestCLI',
      operation: 'testProductManagement',
    });

    await this.runTest('List products', async () => {
      const response = await this.fetch(`${BASE_URL}/api/products`);

      if (!response.ok) {
        throw new Error(`List products failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, count: result.data?.length || 0 };
    });

    await this.runTest('Create product', async () => {
      const productData = {
        name: 'UI Test Product',
        description: 'Product created during UI testing',
        sku: 'UI-TEST-001',
        category: ['Testing'],
        price: 999.99,
        currency: 'USD',
        isActive: true,
      };

      const response = await this.fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error(`Create product failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, productId: result.data?.id };
    });
  }

  // Customer management testing
  async testCustomerManagement() {
    logInfo('Testing customer management functionality', {
      component: 'UITestCLI',
      operation: 'testCustomerManagement',
    });

    await this.runTest('List customers', async () => {
      const response = await this.fetch(`${BASE_URL}/api/customers`);

      if (!response.ok) {
        throw new Error(`List customers failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, count: result.data?.length || 0 };
    });

    await this.runTest('Create customer', async () => {
      const customerData = {
        name: 'UI Test Customer',
        email: 'ui-test@example.com',
        phone: '+1234567890',
        industry: 'Technology',
        companySize: 'MEDIUM',
        isActive: true,
      };

      const response = await this.fetch(`${BASE_URL}/api/customers`, {
        method: 'POST',
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        throw new Error(`Create customer failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, customerId: result.data?.id };
    });
  }

  // Dashboard testing
  async testDashboard() {
    logInfo('Testing dashboard functionality', {
      component: 'UITestCLI',
      operation: 'testDashboard',
    });

    await this.runTest('Dashboard overview', async () => {
      const response = await this.fetch(`${BASE_URL}/api/dashboard/overview`);

      if (!response.ok) {
        throw new Error(`Dashboard overview failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, hasData: !!result.data };
    });

    await this.runTest('Dashboard stats', async () => {
      const response = await this.fetch(`${BASE_URL}/api/dashboard/stats`);

      if (!response.ok) {
        throw new Error(`Dashboard stats failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, hasStats: !!result.data };
    });
  }

  // Performance testing
  async testPerformance() {
    logInfo('Testing performance metrics', {
      component: 'UITestCLI',
      operation: 'testPerformance',
    });

    await this.runTest('API response time', async () => {
      const startTime = performance.now();

      const response = await this.fetch(`${BASE_URL}/api/products`);

      const endTime = performance.now();
      const duration = endTime - startTime;

      if (!response.ok) {
        throw new Error(`API response failed: ${response.status} ${response.statusText}`);
      }

      if (duration > 2000) {
        throw new Error(`API response too slow: ${duration.toFixed(2)}ms`);
      }

      return { success: true, duration: Math.round(duration) };
    });

    await this.runTest('Database query performance', async () => {
      const startTime = performance.now();

      const products = await prisma.product.findMany({ take: 100 });

      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration > 1000) {
        throw new Error(`Database query too slow: ${duration.toFixed(2)}ms`);
      }

      return { success: true, duration: Math.round(duration), count: products.length };
    });
  }

  // Helper methods
  private async runTest(testName: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = performance.now();

    try {
      logInfo(`Running test: ${testName}`, {
        component: 'UITestCLI',
        operation: 'runTest',
        testName,
      });

      const result = await testFn();
      const duration = performance.now() - startTime;

      this.testResults.push({
        testName,
        status: 'PASS',
        duration: Math.round(duration),
        metadata: result,
      });

      console.log(`✅ ${testName} - PASS (${Math.round(duration)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;

      this.testResults.push({
        testName,
        status: 'FAIL',
        duration: Math.round(duration),
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      console.log(
        `❌ ${testName} - FAIL (${Math.round(duration)}ms): ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async getTestCustomerId(): Promise<string> {
    const customer = await prisma.customer.findFirst();
    if (!customer) {
      throw new Error('No test customer found');
    }
    return customer.id;
  }

  private async getTestProposalId(): Promise<string> {
    const proposal = await prisma.proposal.findFirst();
    if (!proposal) {
      throw new Error('No test proposal found');
    }
    return proposal.id;
  }

  private async getTestProducts(): Promise<any[]> {
    return await prisma.product.findMany({ take: 5 });
  }

  // Generate test report
  private generateReport(): void {
    console.log('\n📊 UI Test Report');
    console.log('='.repeat(50));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    console.log(`Average Duration: ${Math.round(avgDuration)}ms`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.error}`);
        });
    }
  }

  // Main test runner
  async runTests(testType: TestType): Promise<void> {
    logInfo('Starting UI tests', { component: 'UITestCLI', operation: 'runTests', testType });

    console.log(`🧪 Starting UI Tests: ${testType.toUpperCase()}`);
    console.log('='.repeat(50));

    // Check server health first
    console.log('🔍 Checking server health...');
    const serverHealthy = await this.checkServerHealth();
    if (!serverHealthy) {
      throw new Error(
        `Server is not responding at ${BASE_URL}. Make sure the development server is running with 'npm run dev:smart'`
      );
    }
    console.log('✅ Server is healthy');

    try {
      switch (testType) {
        case 'auth':
          await this.testAuthentication();
          break;
        case 'wizard':
          await this.testProposalWizard();
          break;
        case 'products':
          await this.testProductManagement();
          break;
        case 'customers':
          await this.testCustomerManagement();
          break;
        case 'dashboard':
          await this.testDashboard();
          break;
        case 'performance':
          await this.testPerformance();
          break;
        case 'all':
          await this.testAuthentication();
          await this.testProposalWizard();
          await this.testProductManagement();
          await this.testCustomerManagement();
          await this.testDashboard();
          await this.testPerformance();
          break;
        default:
          throw new Error(`Unknown test type: ${testType}`);
      }
    } catch (error) {
      logError('UI tests failed', {
        component: 'UITestCLI',
        operation: 'runTests',
        testType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      this.generateReport();
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const testType = (args.find(arg => arg.startsWith('--test='))?.split('=')[1] ||
    'all') as TestType;

  const cli = new UITestCLI();

  try {
    await cli.runTests(testType);
  } catch (error) {
    console.error('❌ UI tests failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ CLI failed:', error);
    process.exit(1);
  });
}

export { UITestCLI };
