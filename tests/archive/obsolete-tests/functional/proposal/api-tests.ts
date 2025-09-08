#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Proposal API Tests
 * Tests core proposal API functionality and data structure validation
 */

import { ApiClient } from './api-client';

export class ApiTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n📄 Testing Proposal Module API Functionality');
    this.api.resetTracking();

    const tests = [
      {
        name: 'List proposals with pagination and sorting',
        test: async () => {
          const res = await this.api.request(
            'GET',
            '/api/proposals?limit=5&sortBy=title&sortOrder=asc'
          );
          const data = await res.json();

          if (!data.data || !Array.isArray(data.data.items)) {
            throw new Error('Invalid proposal list response structure');
          }

          // Validate pagination metadata
          const hasPagination = data.data.pagination !== undefined;
          const hasItems = data.data.items.length >= 0; // Could be empty

          return {
            itemCount: data.data.items.length,
            hasPagination,
            hasItems,
            sortBy: 'title',
            sortOrder: 'asc',
          };
        },
      },
      {
        name: 'Get detailed proposal profile',
        test: async () => {
          // Create a test proposal first
          const testProposal = await this.api.createTestProposal();

          try {
            const res = await this.api.request('GET', `/api/proposals/${testProposal.id}`);
            const data = await res.json();

            if (!data.data || !data.data.id) {
              throw new Error('Invalid proposal detail response structure');
            }

            // Validate required fields
            const hasTitle = typeof data.data.title === 'string' && data.data.title.length > 0;
            const hasStatus = typeof data.data.status === 'string';
            const hasValue = typeof data.data.value === 'number' && data.data.value >= 0;

            return {
              proposalId: data.data.id,
              hasTitle,
              hasStatus,
              hasValue,
              status: data.data.status,
              value: data.data.value,
            };
          } finally {
            // Cleanup test data
            await this.api.cleanupTestProposal(testProposal.id);
          }
        },
      },
      {
        name: 'Validate proposal data structure',
        test: async () => {
          const testProposal = await this.api.createTestProposal();

          try {
            const res = await this.api.request('GET', `/api/proposals/${testProposal.id}`);
            const data = await res.json();

            // Check required fields presence
            const requiredFields = ['id', 'title', 'description', 'status', 'priority', 'value'];
            const missingFields = requiredFields.filter(field => !data.data.hasOwnProperty(field));

            if (missingFields.length > 0) {
              throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Validate field types
            const fieldTypes = {
              id: 'string',
              title: 'string',
              description: 'string',
              status: 'string',
              priority: 'string',
              value: 'number',
            };

            const typeErrors = [];
            for (const [field, expectedType] of Object.entries(fieldTypes)) {
              if (typeof data.data[field] !== expectedType) {
                typeErrors.push(`${field}: expected ${expectedType}, got ${typeof data.data[field]}`);
              }
            }

            if (typeErrors.length > 0) {
              throw new Error(`Type validation errors: ${typeErrors.join(', ')}`);
            }

            return {
              proposalId: data.data.id,
              requiredFieldsPresent: missingFields.length === 0,
              typeValidationPassed: typeErrors.length === 0,
              totalFields: Object.keys(data.data).length,
            };
          } finally {
            await this.api.cleanupTestProposal(testProposal.id);
          }
        },
      },
      {
        name: 'Test proposal listing with different sort options',
        test: async () => {
          // Create multiple test proposals
          const proposals = [];
          for (let i = 0; i < 3; i++) {
            const proposal = await this.api.createTestProposal({
              title: `Sort Test Proposal ${i}`,
              value: (i + 1) * 10000,
            });
            proposals.push(proposal);
          }

          try {
            // Test sorting by value descending
            const res = await this.api.request(
              'GET',
              '/api/proposals?sortBy=value&sortOrder=desc&limit=10'
            );
            const data = await res.json();

            if (!data.data || !Array.isArray(data.data.items)) {
              throw new Error('Invalid sorted proposal list response');
            }

            // Verify sorting worked
            const items = data.data.items;
            let isSorted = true;
            for (let i = 1; i < items.length; i++) {
              if (items[i-1].value < items[i].value) {
                isSorted = false;
                break;
              }
            }

            return {
              totalProposals: items.length,
              isSortedByValue: isSorted,
              sortOrder: 'desc',
              sortBy: 'value',
            };
          } finally {
            // Cleanup test data
            for (const proposal of proposals) {
              await this.api.cleanupTestProposal(proposal.id);
            }
          }
        },
      },
      {
        name: 'Verify proposal field presence and defaults',
        test: async () => {
          const testProposal = await this.api.createTestProposal();

          try {
            const res = await this.api.request('GET', `/api/proposals/${testProposal.id}`);
            const data = await res.json();

            // Check for expected fields and their defaults
            const fieldChecks = {
              id: data.data.id !== undefined,
              title: data.data.title !== undefined,
              description: data.data.description !== undefined,
              status: data.data.status !== undefined,
              priority: data.data.priority !== undefined,
              value: data.data.value !== undefined,
              dueDate: data.data.dueDate !== undefined,
              createdAt: data.data.createdAt !== undefined,
              updatedAt: data.data.updatedAt !== undefined,
            };

            const missingFields = Object.entries(fieldChecks)
              .filter(([_, present]) => !present)
              .map(([field, _]) => field);

            return {
              proposalId: data.data.id,
              allFieldsPresent: missingFields.length === 0,
              missingFields,
              totalFields: Object.keys(data.data).length,
              status: data.data.status,
              priority: data.data.priority,
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
