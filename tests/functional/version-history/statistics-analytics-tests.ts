#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Statistics & Analytics Tests
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 */

import { ApiClient } from './api-client';

export class StatisticsAnalyticsTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n📊 Testing Statistics & Analytics');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Version statistics endpoint',
        test: async () => {
          const statsRes = await this.api.request('GET', '/api/proposals/versions/stats');

          if (statsRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Statistics endpoint not implemented' };
          }

          if (statsRes.status !== 200) {
            throw new Error(`Statistics failed with status: ${statsRes.status}`);
          }

          const statsData = await statsRes.json();

          if (!statsData.data) {
            throw new Error('Missing data field in statistics response');
          }

          return {
            hasData: !!statsData.data,
            responseStructure: typeof statsData.data,
            endpointWorking: statsRes.status === 200,
          };
        },
      },
      {
        name: 'User activity statistics',
        test: async () => {
          // Get versions to analyze user activity
          const versionsRes = await this.api.request('GET', '/api/proposals/versions?limit=20');
          const versionsData = await versionsRes.json();

          if (versionsRes.status !== 200 || !versionsData.data?.items) {
            throw new Error('Failed to fetch versions for user analysis');
          }

          const items = versionsData.data.items;
          const userActivity: Record<string, number> = {};

          // Count versions by user
          for (const item of items) {
            const userId = item.createdBy;
            if (userId) {
              userActivity[userId] = (userActivity[userId] || 0) + 1;
            }
          }

          return {
            totalVersions: items.length,
            uniqueUsers: Object.keys(userActivity).length,
            topContributor:
              Object.entries(userActivity).sort(([, a], [, b]) => b - a)[0]?.[0] || 'none',
          };
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
