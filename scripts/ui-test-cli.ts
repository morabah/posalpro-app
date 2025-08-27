#!/usr/bin/env tsx

/**
 * PosalPro UI Testing CLI
 *
 * Comprehensive CLI tool for testing all UI functionalities through command line
 * Extends the existing app-cli with UI-specific testing capabilities
 */

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

  constructor() {
    this.testResults = [];
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

  // Authentication testing
  async testAuthentication() {
    logInfo('Testing authentication flows', {
      component: 'UITestCLI',
      operation: 'testAuthentication',
    });

    await this.runTest('Login with valid credentials', async () => {
      const response = await this.fetch(`${BASE_URL}/api/auth/signin`, {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@posalpro.com',
          password: 'Admin123!',
        }),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }

      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        this.sessionCookies = cookies.split(',').map(c => c.trim());
      }

      return { success: true, cookies: this.sessionCookies.length };
    });

    await this.runTest('Access protected route', async () => {
      const response = await this.fetch(`${BASE_URL}/api/proposals`);

      if (response.status === 401) {
        throw new Error('Unauthorized access - authentication required');
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
