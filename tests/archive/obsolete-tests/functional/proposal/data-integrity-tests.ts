#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Proposal Data Integrity Tests
 * Tests data consistency and validation for proposal operations
 */

import { ApiClient } from './api-client';

export class DataIntegrityTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔒 Testing Proposal Module Data Integrity');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Proposal chronological creation order',
        test: async () => {
          const proposals = [];
          const timestamps = [];

          // Create proposals with time gaps
          for (let i = 0; i < 3; i++) {
            const proposal = await this.api.createTestProposal({
              title: `Chronology Test ${i + 1}`,
            });
            proposals.push(proposal);
            timestamps.push(new Date(proposal.createdAt).getTime());

            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          try {
            // Verify chronological order
            let isChronological = true;
            for (let i = 1; i < timestamps.length; i++) {
              if (timestamps[i] < timestamps[i - 1]) {
                isChronological = false;
                break;
              }
            }

            // Verify creation order in API response
            const listRes = await this.api.request('GET', '/api/proposals?sortBy=createdAt&sortOrder=asc&limit=10');
            const listData = await listRes.json();

            const proposalIds = proposals.map(p => p.id);
            const apiOrder = listData.data.items
              .filter((item: any) => proposalIds.includes(item.id))
              .map((item: any) => item.id);

            const apiOrderCorrect = proposalIds.every((id, index) => apiOrder[index] === id);

            return {
              proposalCount: proposals.length,
              isChronological,
              apiOrderCorrect,
              dataIntegrity: isChronological && apiOrderCorrect,
            };
          } finally {
            // Cleanup
            for (const proposal of proposals) {
              await this.api.cleanupTestProposal(proposal.id);
            }
          }
        },
      },
      {
        name: 'Title uniqueness validation',
        test: async () => {
          const uniqueTitle = `Unique Test ${Date.now()}`;
          const proposals = [];

          try {
            // Create first proposal
            const proposal1 = await this.api.createTestProposal({
              title: uniqueTitle,
            });
            proposals.push(proposal1);

            // Try to create second proposal with same title
            const proposal2 = await this.api.createTestProposal({
              title: uniqueTitle,
            });
            proposals.push(proposal2);

            // Both should succeed (titles don't have to be unique)
            return {
              firstProposalId: proposal1.id,
              secondProposalId: proposal2.id,
              titlesMatch: proposal1.title === proposal2.title,
              bothCreated: true,
            };
          } finally {
            // Cleanup
            for (const proposal of proposals) {
              await this.api.cleanupTestProposal(proposal.id);
            }
          }
        },
      },
      {
        name: 'Data consistency checks',
        test: async () => {
          const testProposal = await this.api.createTestProposal({
            value: 25000,
            status: 'DRAFT',
            priority: 'MEDIUM',
          });

          try {
            // Read proposal and verify data consistency
            const readRes = await this.api.request('GET', `/api/proposals/${testProposal.id}`);
            const readData = await readRes.json();

            const consistencyChecks = {
              idMatches: readData.data.id === testProposal.id,
              titleMatches: readData.data.title === testProposal.title,
              valueMatches: readData.data.value === testProposal.value,
              statusMatches: readData.data.status === testProposal.status,
              priorityMatches: readData.data.priority === testProposal.priority,
              hasCreatedAt: readData.data.createdAt !== undefined,
              hasUpdatedAt: readData.data.updatedAt !== undefined,
            };

            const allConsistent = Object.values(consistencyChecks).every(check => check === true);
            const failedChecks = Object.entries(consistencyChecks)
              .filter(([_, check]) => check === false)
              .map(([key, _]) => key);

            return {
              proposalId: testProposal.id,
              allConsistent,
              failedChecks,
              totalChecks: Object.keys(consistencyChecks).length,
              consistencyScore: Object.values(consistencyChecks).filter(Boolean).length / Object.keys(consistencyChecks).length,
            };
          } finally {
            await this.api.cleanupTestProposal(testProposal.id);
          }
        },
      },
      {
        name: 'Referential integrity with customers',
        test: async () => {
          let proposalId: string | null = null;
          let customerId: string | null = null;

          try {
            // Create customer
            const testCustomer = await this.api.createTestCustomer();
            customerId = testCustomer.id;

            // Create proposal with customer reference
            const testProposal = await this.api.createTestProposal({
              customerId: customerId,
            });
            proposalId = testProposal.id;

            // Verify referential integrity
            const verifyRes = await this.api.request('GET', `/api/proposals/${proposalId}`);
            const verifyData = await verifyRes.json();

            const customerReferenceValid = verifyData.data.customerId === customerId;
            const customerDataExists = verifyData.data.customer !== undefined;

            // Verify customer can also reference the proposal
            const customerProposalsRes = await this.api.request('GET', `/api/customers/${customerId}/proposals`);
            const customerProposalsData = await customerProposalsRes.json();

            const proposalInCustomerList = customerProposalsData.data?.some((p: any) => p.id === proposalId);

            return {
              proposalId,
              customerId,
              customerReferenceValid,
              customerDataExists,
              proposalInCustomerList,
              referentialIntegrity: customerReferenceValid && customerDataExists && proposalInCustomerList,
            };
          } catch (error) {
            if (proposalId) {
              try {
                await this.api.cleanupTestProposal(proposalId);
              } catch (cleanupError) {
                // Ignore cleanup errors
              }
            }
            if (customerId) {
              try {
                await this.api.cleanupTestCustomer(customerId);
              } catch (cleanupError) {
                // Ignore cleanup errors
              }
            }
            throw error;
          }
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
