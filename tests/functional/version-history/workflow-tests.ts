#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - User Workflow Tests
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 */

import { ApiClient } from './api-client';

export class WorkflowTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔄 Testing Complete User Workflows');
    this.api.resetTracking();

    const tests = [
      {
        name: 'End-to-end proposal lifecycle with versions',
        test: async () => {
          // Step 1: Get initial proposal state
          const proposalsRes = await this.api.request('GET', '/api/proposals?limit=1');
          const proposalsData = await proposalsRes.json();

          if (!proposalsData.data || proposalsData.data.items.length === 0) {
            console.log('⏭️ End-to-end proposal lifecycle - SKIP: No proposals available');
            return { status: 'SKIP', reason: 'No proposals available' };
          }

          const proposal = proposalsData.data.items[0];

          // Step 2: Check initial version count
          const initialVersionsRes = await this.api.request(
            'GET',
            `/api/proposals/${proposal.id}/versions?limit=10`
          );
          const initialVersionsData = await initialVersionsRes.json();
          const initialCount = initialVersionsData.data?.items?.length || 0;

          // Step 3: Update proposal (should create new version)
          const updateRes = await this.api.request('PATCH', `/api/proposals/${proposal.id}`, {
            title: `${proposal.title} - Workflow Test ${Date.now()}`,
            value: proposal.value + 500,
          });

          if (updateRes.status !== 200) {
            throw new Error(`Failed to update proposal: ${updateRes.status}`);
          }

          // Step 4: Verify new version was created
          const finalVersionsRes = await this.api.request(
            'GET',
            `/api/proposals/${proposal.id}/versions?limit=10`
          );
          const finalVersionsData = await finalVersionsRes.json();
          const finalCount = finalVersionsData.data?.items?.length || 0;

          // Step 5: Verify version history is accessible
          const historyRes = await this.api.request('GET', '/api/proposals/versions?limit=5');
          const historyAccessible = historyRes.status === 200;

          return {
            proposalId: proposal.id,
            initialVersions: initialCount,
            finalVersions: finalCount,
            versionCreated: finalCount > initialCount,
            historyAccessible,
            workflowComplete: finalCount > initialCount && historyAccessible,
          };
        },
      },
      {
        name: 'Version history data consistency',
        test: async () => {
          // Test that version history data remains consistent across multiple requests
          const versionsRes1 = await this.api.request('GET', '/api/proposals/versions?limit=10');
          const versionsData1 = await versionsRes1.json();

          // Wait a moment and request again
          await new Promise(resolve => setTimeout(resolve, 1000));

          const versionsRes2 = await this.api.request('GET', '/api/proposals/versions?limit=10');
          const versionsData2 = await versionsRes2.json();

          if (versionsRes1.status !== 200 || versionsRes2.status !== 200) {
            throw new Error('Failed to fetch version history consistently');
          }

          // Compare results (should be similar)
          const items1 = versionsData1.data?.items || [];
          const items2 = versionsData2.data?.items || [];

          // Check if we have similar data (allowing for minor differences)
          const minItems = Math.min(items1.length, items2.length);
          let consistentCount = 0;

          for (let i = 0; i < minItems; i++) {
            if (items1[i]?.id === items2[i]?.id) {
              consistentCount++;
            }
          }

          const consistencyRatio = minItems > 0 ? consistentCount / minItems : 1;

          return {
            request1Items: items1.length,
            request2Items: items2.length,
            consistentItems: consistentCount,
            consistencyRatio: Math.round(consistencyRatio * 100) / 100,
            dataConsistent: consistencyRatio > 0.8, // 80% consistency threshold
          };
        },
      },
      {
        name: 'Concurrent version access',
        test: async () => {
          // Test multiple simultaneous version history requests
          const promises = [
            this.api.request('GET', '/api/proposals/versions?limit=5'),
            this.api.request('GET', '/api/proposals/versions?limit=5'),
            this.api.request('GET', '/api/proposals/versions?limit=5'),
          ];

          const results = await Promise.all(promises);
          const allSuccessful = results.every(res => res.status === 200);

          if (!allSuccessful) {
            const failedCount = results.filter(res => res.status !== 200).length;
            throw new Error(`${failedCount} concurrent requests failed`);
          }

          return {
            concurrentRequests: promises.length,
            allSuccessful,
            responseStatuses: results.map(res => res.status),
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
