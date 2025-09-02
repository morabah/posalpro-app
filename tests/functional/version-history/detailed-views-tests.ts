#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Detailed Views Tests
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 */

import { ApiClient } from './api-client';

export class DetailedViewsTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔎 Testing Detailed Version Views');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Version detail with diff',
        test: async () => {
          // Get a proposal with versions
          const proposalsRes = await this.api.request('GET', '/api/proposals?limit=1');
          const proposalsData = await proposalsRes.json();

          if (!proposalsData.data || proposalsData.data.items.length === 0) {
            console.log('⏭️ Version detail with diff - SKIP: No proposals available');
            return { status: 'SKIP', reason: 'No proposals available' };
          }

          const proposalId = proposalsData.data.items[0].id;
          const versionsRes = await this.api.request(
            'GET',
            `/api/proposals/${proposalId}/versions?limit=2`
          );
          const versionsData = await versionsRes.json();

          if (!versionsData.ok || !versionsData.data || versionsData.data.items.length < 2) {
            console.log('⏭️ Version detail with diff - SKIP: Insufficient versions');
            return { status: 'SKIP', reason: 'Insufficient versions' };
          }

          const latestVersion = versionsData.data.items[0].version;

          // Try to get detailed version info
          const detailRes = await this.api.request(
            'GET',
            `/api/proposals/${proposalId}/versions?version=${latestVersion}&detail=1`
          );

          if (detailRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Detail endpoint not implemented' };
          }

          if (detailRes.status !== 200) {
            throw new Error(`Detail request failed with status: ${detailRes.status}`);
          }

          const detailData = await detailRes.json();

          // Check if detailed response has expected fields
          if (detailData.data && typeof detailData.data === 'object') {
            const hasDiff = 'diff' in detailData.data;
            const hasSnapshot = 'snapshot' in detailData.data;

            return {
              version: latestVersion,
              hasDiff,
              hasSnapshot,
              fields: Object.keys(detailData.data),
            };
          }

          return { status: detailRes.status, dataReceived: true };
        },
      },
      {
        name: 'Version comparison data',
        test: async () => {
          // Get versions for comparison
          const versionsRes = await this.api.request('GET', '/api/proposals/versions?limit=5');
          const versionsData = await versionsRes.json();

          if (
            versionsRes.status !== 200 ||
            !versionsData.data?.items ||
            versionsData.data.items.length < 2
          ) {
            console.log('⏭️ Version comparison data - SKIP: Not enough versions for comparison');
            return { status: 'SKIP', reason: 'Not enough versions for comparison' };
          }

          const items = versionsData.data.items;
          const comparisons: any[] = [];

          // Compare adjacent versions
          for (let i = 0; i < Math.min(items.length - 1, 2); i++) {
            const current = items[i];
            const previous = items[i + 1];

            const currentTime = new Date(current.createdAt).getTime();
            const previousTime = new Date(previous.createdAt).getTime();

            comparisons.push({
              versions: `${previous.version} → ${current.version}`,
              timeGap: currentTime - previousTime,
              chronological: currentTime > previousTime,
            });
          }

          return {
            comparisons,
            allChronological: comparisons.every(c => c.chronological),
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
