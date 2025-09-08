#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Proposal Bulk Operations Tests
 * Tests bulk creation, update, and deletion of proposals
 */

import { ApiClient } from './api-client';

export class BulkOperationsTests {
  private api: ApiClient;
  private testProposals: any[] = [];

  constructor(api: ApiClient) {
    this.api = api;
  }

  private async createIsolatedTestProposals(count: number, prefix: string = 'bulk'): Promise<any[]> {
    const proposals = [];
    for (let i = 0; i < count; i++) {
      try {
        const proposal = await this.api.createTestProposal({
          title: `${prefix} Test Proposal ${i}`,
          value: 15000 + (i * 5000),
          status: 'DRAFT',
          priority: 'MEDIUM',
        });
        if (proposal?.id) {
          this.testProposals.push(proposal);
          proposals.push(proposal);
        }
      } catch (error) {
        console.log(`Failed to create test proposal ${i}:`, error);
      }
    }
    return proposals;
  }

  private async safeCleanup(proposals: any[]): Promise<void> {
    const cleanupPromises = proposals.map(async (proposal) => {
      try {
        if (proposal?.id) {
          await this.api.cleanupTestProposal(proposal.id);
        }
      } catch (error) {
        console.log(`Warning: Failed to cleanup proposal ${proposal?.id}:`, error);
      }
    });
    await Promise.allSettled(cleanupPromises);
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError!;
  }

  async runTests() {
    console.log('\n📦 Testing Proposal Module Bulk Operations');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Bulk proposal creation',
        test: async () => {
          const proposals = await this.createIsolatedTestProposals(5, 'bulk-create');

          const allCreated = proposals.length === 5;
          const allHaveIds = proposals.every(p => p.id);
          const allHaveTitles = proposals.every(p => p.title);

          return {
            requestedCount: 5,
            createdCount: proposals.length,
            allCreated,
            allHaveIds,
            allHaveTitles,
            successRate: proposals.length / 5,
          };
        },
      },
      {
        name: 'Bulk proposal status update',
        test: async () => {
          const proposals = await this.createIsolatedTestProposals(3, 'bulk-update');

          try {
            // Update all proposals to IN_PROGRESS
            const updatePromises = proposals.map(proposal =>
              this.api.request('PUT', `/api/proposals/${proposal.id}`, {
                status: 'IN_PROGRESS',
                priority: 'HIGH',
              })
            );

            const updateResults = await Promise.all(updatePromises);
            const allUpdatesSuccessful = updateResults.every(res => res.status === 200);

            // Verify updates
            const verifyPromises = proposals.map(proposal =>
              this.api.request('GET', `/api/proposals/${proposal.id}`)
            );

            const verifyResults = await Promise.all(verifyPromises);
            const verifyData = await Promise.all(verifyResults.map(res => res.json()));

            const allStatusesUpdated = verifyData.every(data =>
              data.data.status === 'IN_PROGRESS' && data.data.priority === 'HIGH'
            );

            return {
              proposalCount: proposals.length,
              allUpdatesSuccessful,
              allStatusesUpdated,
              bulkUpdateComplete: allUpdatesSuccessful && allStatusesUpdated,
            };
          } finally {
            await this.safeCleanup(proposals);
          }
        },
      },
      {
        name: 'Bulk proposal deletion',
        test: async () => {
          const proposals = await this.createIsolatedTestProposals(3, 'bulk-delete');

          // Delete all proposals
          const deletePromises = proposals.map(proposal =>
            this.api.request('DELETE', `/api/proposals/${proposal.id}`)
          );

          const deleteResults = await Promise.all(deletePromises);
          const allDeletesSuccessful = deleteResults.every(res => res.status === 200 || res.status === 204);

          // Verify deletions
          const verifyPromises = proposals.map(proposal =>
            this.api.request('GET', `/api/proposals/${proposal.id}`)
          );

          const verifyResults = await Promise.all(verifyPromises);
          const allDeleted = verifyResults.every(res => res.status === 404);

          return {
            proposalCount: proposals.length,
            allDeletesSuccessful,
            allDeleted,
            bulkDeletionComplete: allDeletesSuccessful && allDeleted,
          };
        },
      },
    ];

    // Execute tests and collect results
    const results = [];
    for (const { name, test } of tests) {
      const start = Date.now();
      try {
        const result = await test();
        const issues = this.api.getDetectedIssues();
        results.push({
          test: name,
          status: 'PASS',
          duration: Date.now() - start,
          result,
          issues,
        });
      } catch (error: any) {
        const issues = this.api.getDetectedIssues();
        results.push({
          test: name,
          status: 'FAIL',
          duration: Date.now() - start,
          error: error.message,
          issues,
        });
      }
    }

    return results;
  }
}
