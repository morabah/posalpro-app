#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Data Integrity Tests
 * Tests data consistency, chronological order, and version sequencing
 */

import { ApiClient } from './api-client';

export class DataIntegrityTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔒 Testing Data Integrity');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Version history maintains chronological order',
        test: async () => {
          const res = await this.api.request('GET', '/api/proposals/versions?limit=20');
          const data = await res.json();

          if (data.data && data.data.items && data.data.items.length > 1) {
            const items = data.data.items;
            for (let i = 1; i < items.length; i++) {
              const prev = new Date(items[i - 1].createdAt);
              const curr = new Date(items[i].createdAt);
              if (prev < curr) {
                throw new Error('Versions not in chronological order');
              }
            }
            return { checked: items.length, chronological: true };
          }
          return { checked: 0, reason: 'Insufficient data for chronological test' };
        },
      },
      {
        name: 'Version numbers are sequential',
        test: async () => {
          // Get versions for a specific proposal
          const proposalsRes = await this.api.request('GET', '/api/proposals?limit=1');
          const proposalsData = await proposalsRes.json();

          if (!proposalsData.data || proposalsData.data.items.length === 0) {
            return { status: 'SKIP', reason: 'No proposals available' };
          }

          const proposalId = proposalsData.data.items[0].id;
          const res = await this.api.request(
            'GET',
            `/api/proposals/${proposalId}/versions?limit=10`
          );
          const data = await res.json();

          if (data.data && data.data.items && data.data.items.length > 1) {
            const versions = data.data.items
              .map((v: any) => v.version)
              .sort((a: number, b: number) => b - a);
            for (let i = 0; i < versions.length - 1; i++) {
              if (versions[i] !== versions[i + 1] + 1) {
                throw new Error(`Non-sequential versions: ${versions[i]} -> ${versions[i + 1]}`);
              }
            }
            return { proposalId, versions: versions.slice(0, 5) };
          }
          return { reason: 'Insufficient versions for sequential test' };
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
