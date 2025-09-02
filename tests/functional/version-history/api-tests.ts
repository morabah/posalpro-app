#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Version History API Tests
 * Tests core API functionality and data structure validation
 */

import { ApiClient } from './api-client';

export class ApiTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n📚 Testing Version History API Functionality');
    this.api.resetTracking();

    const tests = [
      {
        name: 'List all versions with pagination',
        test: async () => {
          const res = await this.api.request('GET', '/api/proposals/versions?limit=10');
          const data = await res.json();
          if (!data.data || !Array.isArray(data.data.items)) {
            throw new Error('Invalid response structure');
          }
          return { itemCount: data.data.items.length };
        },
      },
      {
        name: 'Get versions for specific proposal',
        test: async () => {
          // First get a proposal ID
          const proposalsRes = await this.api.request('GET', '/api/proposals?limit=1');
          const proposalsData = await proposalsRes.json();

          if (!proposalsData.data || proposalsData.data.items.length === 0) {
            return { status: 'SKIP', reason: 'No proposals available' };
          }

          const proposalId = proposalsData.data.items[0].id;
          const res = await this.api.request(
            'GET',
            `/api/proposals/${proposalId}/versions?limit=5`
          );
          const data = await res.json();

          if (!data.ok || !data.data || !Array.isArray(data.data.items)) {
            throw new Error(
              `Invalid response structure. Expected data.data.items array, got: ${JSON.stringify(data)}`
            );
          }
          return { proposalId, versionCount: data.data.items.length };
        },
      },
      {
        name: 'Version data structure validation',
        test: async () => {
          const res = await this.api.request('GET', '/api/proposals/versions?limit=1');
          const data = await res.json();

          if (data.data && data.data.items && data.data.items.length > 0) {
            const version = data.data.items[0];
            const requiredFields = ['id', 'proposalId', 'version', 'changeType', 'createdAt'];

            for (const field of requiredFields) {
              if (!(field in version)) {
                throw new Error(`Missing required field: ${field}`);
              }
            }
            return { validated: true, fields: requiredFields };
          }
          return { validated: false, reason: 'No versions to validate' };
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
