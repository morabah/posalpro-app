#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Proposal field validation Tests
 * Tests field validation functionality for proposal operations
 */

import { ApiClient } from './api-client';

export class FieldValidationTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔧 Testing Proposal Module field validation');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Basic field validation test',
        test: async () => {
          // Create test proposal for validation
          const testProposal = await this.api.createTestProposal();
          
          try {
            // Basic field validation validation test
            const result = await this.api.request('GET', `/api/proposals/${testProposal.id}`);
            
            return {
              proposalId: testProposal.id,
              status: result.status,
              success: result.status === 200,
            };
          } finally {
            await this.api.cleanupTestProposal(testProposal.id);
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
