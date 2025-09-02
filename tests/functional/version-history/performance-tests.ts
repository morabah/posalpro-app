#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Performance Tests
 * Tests response times, pagination performance, and caching behavior
 */

import { ApiClient } from './api-client';

export class PerformanceTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n⚡ Testing Performance');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Version history API response time',
        test: async () => {
          const start = Date.now();
          const res = await this.api.request('GET', '/api/proposals/versions?limit=50');
          const duration = Date.now() - start;

          if (res.status !== 200) {
            throw new Error(`API returned status ${res.status}`);
          }

          if (duration > 2000) {
            // 2 second threshold
            throw new Error(`Response too slow: ${duration}ms`);
          }

          return { duration, status: res.status };
        },
      },
      {
        name: 'Pagination performance with large dataset',
        test: async () => {
          const start = Date.now();
          const res = await this.api.request('GET', '/api/proposals/versions?limit=100');
          const duration = Date.now() - start;

          if (res.status !== 200) {
            throw new Error(`API returned status ${res.status}`);
          }

          const data = await res.json();
          const itemCount = data.data?.items?.length || 0;

          if (duration > 3000) {
            // 3 second threshold for larger queries
            throw new Error(`Large query too slow: ${duration}ms`);
          }

          return { duration, itemCount, status: res.status };
        },
      },
    ];

    const results = [];

    for (const { name, test } of tests) {
      const start = Date.now();
      try {
        const result = await test();
        results.push({
          test: name,
          status: 'PASS',
          duration: Date.now() - start,
          result,
        });
      } catch (error: any) {
        results.push({
          test: name,
          status: 'FAIL',
          duration: Date.now() - start,
          error: error.message,
        });
      }
    }

    return results;
  }
}
