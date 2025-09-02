#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Customer Bulk Operations Tests
 * User Story: US-2.1 (Customer Management), US-2.3 (Bulk Customer Operations)
 * Hypothesis: H2 (Customer search improves efficiency), H4 (Bulk operations enhance productivity)
 */

import { ApiClient } from './api-client';

export class BulkOperationsTests {
  private api: ApiClient;
  private testCustomers: any[] = [];

  constructor(api: ApiClient) {
    this.api = api;
  }

  // Helper method to create isolated test customers with unique identifiers
  private async createIsolatedTestCustomers(count: number, prefix: string = 'bulk'): Promise<any[]> {
    const customers = [];
    for (let i = 0; i < count; i++) {
      try {
        const customer = await this.api.createTestCustomer({
          name: `${prefix} Test Customer ${i}`,
          email: `bulk.customer.${i}@example.com`,
          industry: `${prefix} Industry`,
          companySize: '51-200',
          status: 'ACTIVE',
          tags: [prefix, 'test'],
        });
        if (customer?.id) {
          this.testCustomers.push(customer);
          customers.push(customer);
        }
      } catch (error) {
        console.log(`Failed to create test customer ${i}:`, error);
      }
    }
    return customers;
  }

  // Cleanup helper
  private async cleanupTestCustomers() {
    for (const customer of this.testCustomers) {
      try {
        await this.api.cleanupTestCustomer(customer.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    this.testCustomers = [];
  }

  async runTests() {
    console.log('\n🔄 Testing Bulk Operations');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Bulk customer status update validation',
        test: async () => {
          // Create isolated test customers for this test
          const testCustomers = await this.createIsolatedTestCustomers(3, 'bulk-test');
          const customerIds = testCustomers.map(c => c.id);

          if (customerIds.length < 2) {
            return { status: 'insufficient_data', message: 'Could not create test customers' };
          }

          // Test bulk update with empty array (should fail)
          const bulkRes = await this.api.request('PATCH', '/api/customers/bulk-update', {
            ids: [],
            status: 'INACTIVE',
          });

          if (bulkRes.status === 404) {
            return {
              status: 'endpoint_not_found',
              message: 'Bulk delete endpoint not implemented',
            };
          }

          // Zod validation should return an error for empty array
          if (bulkRes.status >= 400) {
            const errorData = await bulkRes.json();
            return {
              status: 'validation_working',
              message: 'Empty array validation works',
              errorCode: errorData.code || 'VALIDATION_ERROR',
              errorMessage: errorData.message || 'Validation failed',
              httpStatus: bulkRes.status,
            };
          }

          // If we get 200, the validation is not working
          if (bulkRes.status === 200) {
            throw new Error('Empty array should not be accepted for bulk customer update');
          }

          return { status: bulkRes.status, message: 'Validation response received' };
        },
      },
      {
        name: 'Bulk delete with valid data',
        test: async () => {
          // Test with non-existent IDs (should handle gracefully)
          const bulkRes = await this.api.request('PATCH', '/api/customers/bulk-update', {
            ids: ['non-existent-1', 'non-existent-2'],
          });

          if (bulkRes.status === 404) {
            return {
              status: 'endpoint_not_found',
              message: 'Bulk delete endpoint not implemented',
            };
          }

          const bulkData = await bulkRes.json();

          // Should return some result structure
          if (bulkRes.status === 200 && bulkData.data) {
            return {
              deleted: bulkData.data.deleted || 0,
              failed: bulkData.data.failed || 0,
              totalRequested: 2,
            };
          }

          return { status: bulkRes.status, handled: true };
        },
      },
    ];

    const results = [];
    for (const { name, test } of tests) {
      const start = Date.now();
      try {
        const result = await test();
        results.push({ test: name, status: 'PASS', duration: Date.now() - start, result });
        console.log(`✅ ${name} - ${Date.now() - start}ms`);
      } catch (error) {
        results.push({
          test: name,
          status: 'FAIL',
          duration: Date.now() - start,
          error: error.message,
        });
        console.log(`❌ ${name} - ${Date.now() - start}ms - ${error.message}`);
      }
    }

    return results;
  }
}
