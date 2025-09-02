#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Authentication & RBAC Tests
 * Tests authentication, authorization, and role-based access control
 */

import { ApiClient } from './api-client';

export class AuthTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔐 Testing Authentication & RBAC');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Unauthorized access should fail',
        test: async () => {
          const res = await this.api.request('GET', '/api/proposals/versions');
          if (res.status === 401) return { success: true };
          throw new Error(`Expected 401, got ${res.status}`);
        },
      },
      {
        name: 'Login with valid credentials',
        test: async () => {
          await this.api.login('admin@posalpro.com', 'ProposalPro2024!', 'System Administrator');
          return { success: true };
        },
      },
      {
        name: 'Authenticated user can access version history',
        test: async () => {
          const res = await this.api.request('GET', '/api/proposals/versions?limit=5');
          if (res.status === 200) return { success: true };
          throw new Error(`Expected 200, got ${res.status}`);
        },
      },
    ];

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
        const isTimeout = error.message.includes('TIMEOUT');
        const isInfiniteLoop = error.message.includes('INFINITE_LOOP_DETECTED');

        results.push({
          test: name,
          status: isTimeout ? 'TIMEOUT' : 'FAIL',
          duration: Date.now() - start,
          error: error.message,
          issues,
        });
      }
    }

    return results;
  }
}
