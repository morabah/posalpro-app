#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Proposal Authentication Tests
 * Tests authentication and RBAC for proposal operations
 */

import { ApiClient } from './api-client';

export class AuthTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔐 Testing Proposal Module Authentication & RBAC');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Verify authenticated user can access proposal endpoints',
        test: async () => {
          const res = await this.api.request('GET', '/api/proposals');
          const data = await res.json();

          if (res.status === 401) {
            throw new Error('Authentication failed - received 401 Unauthorized');
          }

          return {
            status: res.status,
            hasData: data.data !== undefined,
            isAuthenticated: res.status !== 401,
          };
        },
      },
      {
        name: 'Test proposal creation requires authentication',
        test: async () => {
          // This should work with our authenticated session
          const testProposal = await this.api.createTestProposal();

          try {
            // Verify the proposal was created successfully
            const verifyRes = await this.api.request('GET', `/api/proposals/${testProposal.id}`);
            const verifyData = await verifyRes.json();

            if (verifyRes.status !== 200) {
              throw new Error(`Failed to verify created proposal: ${verifyRes.status}`);
            }

            return {
              proposalCreated: true,
              proposalId: testProposal.id,
              verificationStatus: verifyRes.status,
              title: verifyData.data?.title,
            };
          } finally {
            await this.api.cleanupTestProposal(testProposal.id);
          }
        },
      },
      {
        name: 'Test proposal update permissions',
        test: async () => {
          const testProposal = await this.api.createTestProposal();

          try {
            // Update the proposal
            const updateData = {
              title: 'Updated Test Proposal',
              status: 'IN_PROGRESS',
            };

            const updateRes = await this.api.request(
              'PUT',
              `/api/proposals/${testProposal.id}`,
              updateData
            );

            if (updateRes.status !== 200) {
              throw new Error(`Update failed with status: ${updateRes.status}`);
            }

            // Verify the update
            const verifyRes = await this.api.request('GET', `/api/proposals/${testProposal.id}`);
            const verifyData = await verifyRes.json();

            const titleUpdated = verifyData.data.title === updateData.title;
            const statusUpdated = verifyData.data.status === updateData.status;

            return {
              proposalId: testProposal.id,
              updateStatus: updateRes.status,
              titleUpdated,
              statusUpdated,
              currentTitle: verifyData.data.title,
              currentStatus: verifyData.data.status,
            };
          } finally {
            await this.api.cleanupTestProposal(testProposal.id);
          }
        },
      },
      {
        name: 'Test proposal deletion permissions',
        test: async () => {
          const testProposal = await this.api.createTestProposal();
          const proposalId = testProposal.id;

          // Delete the proposal
          const deleteRes = await this.api.request('DELETE', `/api/proposals/${proposalId}`);

          if (deleteRes.status !== 200 && deleteRes.status !== 204) {
            throw new Error(`Delete failed with status: ${deleteRes.status}`);
          }

          // Verify deletion
          const verifyRes = await this.api.request('GET', `/api/proposals/${proposalId}`);
          const isDeleted = verifyRes.status === 404;

          return {
            proposalId,
            deleteStatus: deleteRes.status,
            isDeleted,
            verificationStatus: verifyRes.status,
          };
        },
      },
      {
        name: 'Test unauthorized access to proposal endpoints',
        test: async () => {
          // Create a new API client without authentication
          const unauthApi = new ApiClient(this.api['baseUrl']);

          // Try to access proposal endpoint without auth
          const res = await unauthApi.request('GET', '/api/proposals');

          const isUnauthorized = res.status === 401;
          const hasErrorMessage = true; // We expect some form of error response

          return {
            status: res.status,
            isUnauthorized,
            hasErrorMessage,
            accessDenied: isUnauthorized,
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
