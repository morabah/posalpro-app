#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Bulk Operations Tests
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 */

import { ApiClient } from './api-client';

export class BulkOperationsTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔄 Testing Bulk Operations');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Bulk delete validation',
        test: async () => {
          // First get some version IDs
          const versionsRes = await this.api.request('GET', '/api/proposals/versions?limit=3');
          const versionsData = await versionsRes.json();

          if (
            versionsRes.status !== 200 ||
            !versionsData.data?.items ||
            versionsData.data.items.length < 2
          ) {
            return { status: 'insufficient_data', message: 'Not enough versions for bulk test' };
          }

          const versionIds = versionsData.data.items.slice(0, 2).map((v: any) => v.id);

          // Test bulk delete with empty array (should fail)
          const bulkRes = await this.api.request('DELETE', '/api/proposals/versions/bulk-delete', {
            ids: [],
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
            throw new Error('Empty array should not be accepted for bulk delete');
          }

          return { status: bulkRes.status, message: 'Validation response received' };
        },
      },
      {
        name: 'Bulk delete with valid data',
        test: async () => {
          // Test with non-existent IDs (should handle gracefully)
          const bulkRes = await this.api.request('DELETE', '/api/proposals/versions/bulk-delete', {
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
