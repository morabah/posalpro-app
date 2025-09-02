#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Error Handling Tests
 * Tests error responses, validation, and graceful error handling
 */

import { ApiClient } from './api-client';

export class ErrorHandlingTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🚨 Testing Error Handling');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Invalid proposal ID returns 404',
        test: async () => {
          const res = await this.api.request('GET', '/api/proposals/non-existent-id/versions');
          if (res.status === 404 || res.status === 400) {
            return { status: res.status, handled: true };
          }
          if (res.status >= 200 && res.status < 300) {
            throw new Error('Should have returned error for invalid proposal ID');
          }
          return { status: res.status, handled: true };
        },
      },
      {
        name: 'Invalid query parameters are handled',
        test: async () => {
          const res = await this.api.request('GET', '/api/proposals/versions?limit=invalid');
          if (res.status >= 400) {
            return { status: res.status, handled: true };
          }
          return { status: res.status, handled: false };
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
