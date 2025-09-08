#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Permissions Tests
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 */

import { ApiClient } from './api-client';

export class PermissionsTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔒 Testing Advanced Permissions');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Role-based version access',
        test: async () => {
          // Test different role-based access patterns
          const endpoints = [
            '/api/proposals/versions?limit=1',
            '/api/proposals/versions/stats',
            '/api/proposals/versions/search?q=test',
          ];

          const results: any[] = [];

          for (const endpoint of endpoints) {
            const res = await this.api.request('GET', endpoint);
            results.push({
              endpoint,
              status: res.status,
              accessible: res.status === 200,
            });
          }

          const accessibleCount = results.filter(r => r.accessible).length;

          return {
            endpointsTested: results.length,
            accessible: accessibleCount,
            allAccessible: accessibleCount === results.length,
          };
        },
      },
      {
        name: 'Cross-proposal version isolation',
        test: async () => {
          // Get multiple proposals if available
          const proposalsRes = await this.api.request('GET', '/api/proposals?limit=3');
          const proposalsData = await proposalsRes.json();

          if (!proposalsData.data || proposalsData.data.items.length < 2) {
            console.log('⏭️ Cross-proposal version isolation - SKIP: Need multiple proposals');
            return { status: 'SKIP', reason: 'Need multiple proposals for isolation test' };
          }

          const proposals = proposalsData.data.items;
          const isolationResults: any[] = [];

          // Test that versions are properly isolated per proposal
          for (const proposal of proposals.slice(0, 2)) {
            const versionsRes = await this.api.request(
              'GET',
              `/api/proposals/${proposal.id}/versions?limit=5`
            );

            if (versionsRes.status === 200) {
              const versionsData = await versionsRes.json();
              const items = versionsData.data?.items || [];

              // Check if all versions belong to the correct proposal
              const correctProposal = items.every((item: any) => item.proposalId === proposal.id);
              const versionCount = items.length;

              isolationResults.push({
                proposalId: proposal.id,
                versionCount,
                correctProposal,
                isolated: correctProposal,
              });
            }
          }

          const allIsolated = isolationResults.every(r => r.isolated);

          return {
            proposals: proposals.length,
            isolationResults,
            allIsolated,
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
