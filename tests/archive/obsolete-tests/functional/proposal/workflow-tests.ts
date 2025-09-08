#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Proposal Workflow Tests
 * Tests complete proposal lifecycle and workflow operations
 */

import { ApiClient } from './api-client';

export class WorkflowTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔄 Testing Proposal Module Workflows');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Complete proposal lifecycle workflow',
        test: async () => {
          let proposalId: string | null = null;

          try {
            // 1. Create proposal
            const testProposal = await this.api.createTestProposal();
            proposalId = testProposal.id;

            // 2. Read proposal
            const readRes = await this.api.request('GET', `/api/proposals/${proposalId}`);
            const readData = await readRes.json();

            if (readRes.status !== 200) {
              throw new Error(`Failed to read proposal: ${readRes.status}`);
            }

            // 3. Update proposal
            const updateData = {
              title: 'Updated Test Proposal',
              status: 'IN_PROGRESS',
              priority: 'HIGH',
              description: 'Updated description for workflow test',
            };

            const updateRes = await this.api.request('PUT', `/api/proposals/${proposalId}`, updateData);
            if (updateRes.status !== 200) {
              throw new Error(`Failed to update proposal: ${updateRes.status}`);
            }

            // 4. Verify update
            const verifyRes = await this.api.request('GET', `/api/proposals/${proposalId}`);
            const verifyData = await verifyRes.json();

            const titleUpdated = verifyData.data.title === updateData.title;
            const statusUpdated = verifyData.data.status === updateData.status;
            const priorityUpdated = verifyData.data.priority === updateData.priority;

            return {
              proposalId,
              lifecycle: ['create', 'read', 'update', 'verify'],
              titleUpdated,
              statusUpdated,
              priorityUpdated,
              workflowComplete: titleUpdated && statusUpdated && priorityUpdated,
            };
          } catch (error) {
            if (proposalId) {
              try {
                await this.api.cleanupTestProposal(proposalId);
              } catch (cleanupError) {
                // Ignore cleanup errors
              }
            }
            throw error;
          }
        },
      },
      {
        name: 'Proposal status transition workflow',
        test: async () => {
          const testProposal = await this.api.createTestProposal();

          try {
            const statusTransitions = ['DRAFT', 'IN_PROGRESS', 'REVIEW', 'APPROVED'];
            const results = [];

            for (let i = 1; i < statusTransitions.length; i++) {
              const prevStatus = statusTransitions[i - 1];
              const newStatus = statusTransitions[i];

              // Update status
              const updateRes = await this.api.request('PUT', `/api/proposals/${testProposal.id}`, {
                status: newStatus,
              });

              if (updateRes.status !== 200) {
                throw new Error(`Failed to transition from ${prevStatus} to ${newStatus}`);
              }

              // Verify status change
              const verifyRes = await this.api.request('GET', `/api/proposals/${testProposal.id}`);
              const verifyData = await verifyRes.json();

              const transitionSuccessful = verifyData.data.status === newStatus;
              results.push({
                from: prevStatus,
                to: newStatus,
                successful: transitionSuccessful,
                currentStatus: verifyData.data.status,
              });

              if (!transitionSuccessful) {
                throw new Error(`Status transition failed: expected ${newStatus}, got ${verifyData.data.status}`);
              }
            }

            return {
              proposalId: testProposal.id,
              transitions: results,
              allSuccessful: results.every(r => r.successful),
              totalTransitions: results.length,
            };
          } finally {
            await this.api.cleanupTestProposal(testProposal.id);
          }
        },
      },
      {
        name: 'Proposal with customer relationship workflow',
        test: async () => {
          let proposalId: string | null = null;
          let customerId: string | null = null;

          try {
            // 1. Create customer
            const testCustomer = await this.api.createTestCustomer();
            customerId = testCustomer.id;

            // 2. Create proposal with customer relationship
            const testProposal = await this.api.createTestProposal({
              customerId: customerId,
              title: 'Customer Relationship Test Proposal',
            });
            proposalId = testProposal.id;

            // 3. Verify relationship
            const verifyRes = await this.api.request('GET', `/api/proposals/${proposalId}`);
            const verifyData = await verifyRes.json();

            const hasCustomerId = verifyData.data.customerId === customerId;
            const hasCustomerData = verifyData.data.customer !== undefined;

            return {
              proposalId,
              customerId,
              hasCustomerId,
              hasCustomerData,
              relationshipEstablished: hasCustomerId,
              customerName: verifyData.data.customer?.name,
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
      {
        name: 'Bulk proposal operations workflow',
        test: async () => {
          const proposals = [];
          const createdIds = [];

          try {
            // 1. Create multiple proposals
            for (let i = 0; i < 3; i++) {
              const proposal = await this.api.createTestProposal({
                title: `Bulk Test Proposal ${i + 1}`,
                value: (i + 1) * 15000,
              });
              proposals.push(proposal);
              createdIds.push(proposal.id);
            }

            // 2. Bulk read (list all)
            const listRes = await this.api.request('GET', '/api/proposals?limit=10');
            const listData = await listRes.json();

            const allProposalsFound = createdIds.every(id =>
              listData.data.items.some((item: any) => item.id === id)
            );

            // 3. Bulk update (change status)
            const updatePromises = createdIds.map(id =>
              this.api.request('PUT', `/api/proposals/${id}`, { status: 'REVIEW' })
            );
            const updateResults = await Promise.all(updatePromises);
            const allUpdatesSuccessful = updateResults.every(res => res.status === 200);

            // 4. Verify bulk update
            const verifyPromises = createdIds.map(id =>
              this.api.request('GET', `/api/proposals/${id}`)
            );
            const verifyResults = await Promise.all(verifyPromises);
            const verifyData = await Promise.all(verifyResults.map(res => res.json()));

            const allStatusesUpdated = verifyData.every(data =>
              data.data.status === 'REVIEW'
            );

            return {
              createdCount: proposals.length,
              allProposalsFound,
              allUpdatesSuccessful,
              allStatusesUpdated,
              bulkOperationComplete: allProposalsFound && allUpdatesSuccessful && allStatusesUpdated,
            };
          } finally {
            // Cleanup all test proposals
            for (const proposal of proposals) {
              try {
                await this.api.cleanupTestProposal(proposal.id);
              } catch (cleanupError) {
                // Ignore cleanup errors
              }
            }
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
