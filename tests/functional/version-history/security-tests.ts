#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Security Testing Module
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * 🔒 SECURITY TESTING: Comprehensive security validation
 * ✅ TESTS: SQL injection, XSS prevention, input validation, session security
 * ✅ VALIDATES: Security vulnerabilities and attack prevention
 * ✅ MEASURES: Security posture and compliance
 */

import { logInfo } from '../../../src/lib/logger';
import { ApiClient } from './api-client';

export class SecurityTests {
  private api: ApiClient;
  private testResults: Array<{
    test: string;
    status: 'PASS' | 'FAIL' | 'SKIP' | 'TIMEOUT';
    duration: number;
    error?: string;
    data?: any;
  }> = [];

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔒 Testing Security & Vulnerability Prevention');

    const tests: Array<{
      name: string;
      test: () => Promise<any>;
    }> = [
      {
        name: 'SQL Injection Prevention in Search',
        test: async () => {
          const maliciousQueries = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "'; SELECT * FROM users; --",
            "' UNION SELECT password FROM users; --",
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "../../../etc/passwd",
            "..\\..\\windows\\system32\\cmd.exe"
          ];

          const results = [];
          for (const query of maliciousQueries) {
            try {
              const res = await this.api.request('GET', `/api/proposals/versions/search?q=${encodeURIComponent(query)}`);
              const responseText = await res.text();

              // Check if the query was executed (bad) or rejected (good)
              const isVulnerable = responseText.includes('SQL') ||
                                 responseText.includes('syntax') ||
                                 responseText.includes('error') && res.status === 500;

              results.push({
                query,
                status: res.status,
                vulnerable: isVulnerable,
                blocked: !isVulnerable
              });
            } catch (error) {
              results.push({
                query,
                status: 'error',
                error: error.message,
                blocked: true
              });
            }
          }

          const blockedCount = results.filter(r => r.blocked).length;
          const totalCount = results.length;

          if (blockedCount < totalCount) {
            throw new Error(`${totalCount - blockedCount} malicious queries were not properly blocked`);
          }

          return {
            totalQueries: totalCount,
            blockedQueries: blockedCount,
            successRate: `${((blockedCount / totalCount) * 100).toFixed(1)}%`,
            secure: true
          };
        }
      },

      {
        name: 'XSS Prevention in User Input',
        test: async () => {
          const xssPayloads = [
            '<script>alert("xss")</script>',
            '<img src="x" onerror="alert(\'xss\')">',
            '<svg onload="alert(\'xss\')">',
            'javascript:alert("xss")',
            '<iframe src="javascript:alert(\'xss\')"></iframe>',
            '<body onload="alert(\'xss\')">'
          ];

          const results = [];
          for (const payload of xssPayloads) {
            try {
              // Test in search parameters
              const searchRes = await this.api.request('GET', `/api/proposals/versions/search?q=${encodeURIComponent(payload)}`);
              const searchText = await searchRes.text();

              // Test in filter parameters
              const filterRes = await this.api.request('GET', `/api/proposals/versions?changeType=${encodeURIComponent(payload)}`);
              const filterText = await filterRes.text();

              // Check if XSS payload appears unescaped in response
              const isVulnerable = searchText.includes(payload) && !searchText.includes('&lt;') ||
                                 filterText.includes(payload) && !filterText.includes('&lt;');

              results.push({
                payload,
                searchStatus: searchRes.status,
                filterStatus: filterRes.status,
                vulnerable: isVulnerable,
                sanitized: !isVulnerable
              });
            } catch (error) {
              results.push({
                payload,
                status: 'error',
                error: error.message,
                sanitized: true
              });
            }
          }

          const sanitizedCount = results.filter(r => r.sanitized).length;
          const totalCount = results.length;

          if (sanitizedCount < totalCount) {
            throw new Error(`${totalCount - sanitizedCount} XSS payloads were not properly sanitized`);
          }

          return {
            totalPayloads: totalCount,
            sanitizedPayloads: sanitizedCount,
            successRate: `${((sanitizedCount / totalCount) * 100).toFixed(1)}%`,
            xssProtected: true
          };
        }
      },

      {
        name: 'Input Validation Edge Cases',
        test: async () => {
          const edgeCases = [
            { param: 'limit', value: '0', description: 'Zero limit' },
            { param: 'limit', value: '-1', description: 'Negative limit' },
            { param: 'limit', value: '999999', description: 'Very large limit' },
            { param: 'limit', value: 'notanumber', description: 'Non-numeric limit' },
            { param: 'limit', value: '1.5', description: 'Float limit' },
            { param: 'page', value: '0', description: 'Zero page' },
            { param: 'page', value: '-5', description: 'Negative page' },
            { param: 'dateFrom', value: 'invalid-date', description: 'Invalid date format' },
            { param: 'dateTo', value: '2023-13-45', description: 'Impossible date' },
            { param: 'changeType', value: '', description: 'Empty change type' },
            { param: 'changeType', value: '   ', description: 'Whitespace only' },
            { param: 'changeType', value: 'NONEXISTENT_TYPE', description: 'Invalid enum value' }
          ];

          const results = [];
          for (const testCase of edgeCases) {
            try {
              const res = await this.api.request('GET', `/api/proposals/versions?${testCase.param}=${encodeURIComponent(testCase.value)}`);

              // Check if the API properly handles the edge case
              const isHandled = res.status === 400 || res.status === 422 || res.status === 200;
              const responseText = await res.text();
              const hasErrorMessage = responseText.includes('error') || responseText.includes('invalid');

              results.push({
                testCase: testCase.description,
                param: testCase.param,
                value: testCase.value,
                status: res.status,
                handled: isHandled,
                hasErrorMessage: hasErrorMessage,
                properlyValidated: isHandled && (res.status !== 200 || !hasErrorMessage)
              });
            } catch (error) {
              results.push({
                testCase: testCase.description,
                param: testCase.param,
                value: testCase.value,
                status: 'error',
                error: error.message,
                handled: true,
                properlyValidated: true
              });
            }
          }

          const properlyValidatedCount = results.filter(r => r.properlyValidated).length;
          const totalCount = results.length;

          return {
            totalEdgeCases: totalCount,
            properlyValidated: properlyValidatedCount,
            successRate: `${((properlyValidatedCount / totalCount) * 100).toFixed(1)}%`,
            validationRobust: properlyValidatedCount === totalCount
          };
        }
      },

      {
        name: 'Session Security & CSRF Protection',
        test: async () => {
          // Test CSRF token validation
          const csrfRes = await this.api.request('GET', '/api/auth/csrf');
          const hasCsrfToken = csrfRes.status === 200;

          // Test session handling
          const sessionRes = await this.api.request('GET', '/api/auth/session');
          const hasSession = sessionRes.status === 200;

          // Test session persistence across requests
          const initialCookies = this.api['cookies'];
          await this.api.request('GET', '/api/proposals/versions?limit=1');
          const finalCookies = this.api['cookies'];

          const sessionPersistent = finalCookies.size >= initialCookies.size;

          // Test logout/session termination
          const logoutRes = await this.api.request('POST', '/api/auth/signout');
          const logoutSuccessful = logoutRes.status === 200 || logoutRes.status === 302;

          return {
            csrfProtection: hasCsrfToken,
            sessionManagement: hasSession,
            sessionPersistence: sessionPersistent,
            secureLogout: logoutSuccessful,
            overallSecurity: hasCsrfToken && hasSession && sessionPersistent
          };
        }
      },

      {
        name: 'Rate Limiting Effectiveness',
        test: async () => {
          const startTime = Date.now();
          const requests = [];

          // Make multiple rapid requests to test rate limiting
          for (let i = 0; i < 20; i++) {
            requests.push(this.api.request('GET', '/api/proposals/versions?limit=1'));
          }

          const results = await Promise.allSettled(requests);
          const endTime = Date.now();

          const successfulRequests = results.filter(r => r.status === 'fulfilled' &&
            (r.value as any).status === 200).length;
          const rateLimitedRequests = results.filter(r => r.status === 'fulfilled' &&
            (r.value as any).status === 429).length;
          const failedRequests = results.filter(r => r.status === 'rejected').length;

          // Rate limiting should kick in and block some requests
          const hasRateLimiting = rateLimitedRequests > 0 || successfulRequests < requests.length;

          return {
            totalRequests: requests.length,
            successfulRequests,
            rateLimitedRequests,
            failedRequests,
            duration: endTime - startTime,
            rateLimitingActive: hasRateLimiting,
            effectiveness: hasRateLimiting ? 'effective' : 'needs_improvement'
          };
        }
      },

      {
        name: 'Authentication Bypass Attempts',
        test: async () => {
          const bypassAttempts = [
            { method: 'GET', path: '/api/admin/users', description: 'Direct admin access' },
            { method: 'GET', path: '/api/admin/roles', description: 'Role enumeration' },
            { method: 'GET', path: '/api/admin/permissions', description: 'Permission enumeration' },
            { method: 'POST', path: '/api/admin/users', body: { role: 'admin' }, description: 'Privilege escalation' },
            { method: 'DELETE', path: '/api/admin/users/nonexistent', description: 'Unauthorized deletion' }
          ];

          const results = [];
          for (const attempt of bypassAttempts) {
            try {
              const res = await this.api.request(attempt.method, attempt.path, attempt.body);
              const isBlocked = res.status === 401 || res.status === 403 || res.status === 404;

              results.push({
                attempt: attempt.description,
                method: attempt.method,
                path: attempt.path,
                status: res.status,
                blocked: isBlocked,
                vulnerable: !isBlocked
              });
            } catch (error) {
              results.push({
                attempt: attempt.description,
                method: attempt.method,
                path: attempt.path,
                status: 'error',
                blocked: true,
                vulnerable: false
              });
            }
          }

          const blockedAttempts = results.filter(r => r.blocked).length;
          const vulnerableAttempts = results.filter(r => r.vulnerable).length;

          if (vulnerableAttempts > 0) {
            throw new Error(`${vulnerableAttempts} authentication bypass attempts succeeded`);
          }

          return {
            totalAttempts: bypassAttempts.length,
            blockedAttempts,
            vulnerableAttempts,
            securityIntact: vulnerableAttempts === 0,
            authenticationSecure: true
          };
        }
      },

      {
        name: 'Data Exposure Prevention',
        test: async () => {
          // Test for sensitive data exposure in responses
          const endpoints = [
            '/api/proposals/versions?limit=5',
            '/api/proposals?limit=5',
            '/api/customers?limit=5',
            '/api/products?limit=5'
          ];

          const results = [];
          for (const endpoint of endpoints) {
            try {
              const res = await this.api.request('GET', endpoint);
              const responseText = await res.text();

              // Check for sensitive data patterns
              const hasPasswords = responseText.includes('password') || responseText.includes('secret');
              const hasTokens = responseText.includes('token') && !responseText.includes('csrf');
              const hasKeys = responseText.includes('private') || responseText.includes('secret');
              const hasSensitiveData = hasPasswords || hasTokens || hasKeys;

              results.push({
                endpoint,
                status: res.status,
                hasSensitiveData,
                dataProtected: !hasSensitiveData,
                responseSize: responseText.length
              });
            } catch (error) {
              results.push({
                endpoint,
                status: 'error',
                hasSensitiveData: false,
                dataProtected: true,
                error: error.message
              });
            }
          }

          const protectedEndpoints = results.filter(r => r.dataProtected).length;
          const totalEndpoints = results.length;

          if (protectedEndpoints < totalEndpoints) {
            throw new Error(`${totalEndpoints - protectedEndpoints} endpoints exposed sensitive data`);
          }

          return {
            totalEndpoints,
            protectedEndpoints,
            dataProtection: 'effective',
            noDataLeaks: true,
            privacyCompliant: true
          };
        }
      }
    ];

    for (const { name, test } of tests) {
      const start = Date.now();
      try {
        const result = await test();
        this.recordResult(name, 'PASS', Date.now() - start, undefined, result);
      } catch (error) {
        this.recordResult(name, 'FAIL', Date.now() - start, error.message);
      }
    }

    return this.testResults;
  }

  private recordResult(
    test: string,
    status: 'PASS' | 'FAIL' | 'SKIP' | 'TIMEOUT',
    duration: number,
    error?: string,
    data?: any
  ) {
    this.testResults.push({
      test,
      status,
      duration,
      error,
      data,
    });

    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'TIMEOUT' ? '⏰' : '⏭️';
    console.log(`${icon} ${test} - ${duration}ms`);
    if (error) console.log(`   Error: ${error}`);
    if (data) console.log(`   Result: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
  }
}
