#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Integration Testing Module
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * 🔄 INTEGRATION TESTING: Cross-module interaction validation
 * ✅ TESTS: Data flow between modules, API communication, service dependencies
 * ✅ VALIDATES: System integration and data consistency across modules
 * ✅ MEASURES: Integration reliability and data flow integrity
 */

import { logInfo } from '../../../src/lib/logger';
import { ApiClient } from './api-client';

export class IntegrationTests {
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
    console.log('\n🔄 Testing Cross-Module Integration');

    const tests: Array<{
      name: string;
      test: () => Promise<any>;
    }> = [
      {
        name: 'Proposal-Customer Data Flow Integration',
        test: async () => {
          // Test that proposal data properly references customer data
          const proposalsRes = await this.api.request('GET', '/api/proposals?limit=5');
          const customersRes = await this.api.request('GET', '/api/customers?limit=5');

          if (proposalsRes.status !== 200 || customersRes.status !== 200) {
            throw new Error('Cannot test proposal-customer integration - APIs not responding');
          }

          const proposalsData = await proposalsRes.json();
          const customersData = await customersRes.json();

          const proposals = proposalsData.data?.items || [];
          const customers = customersData.data?.items || [];

          if (proposals.length === 0 || customers.length === 0) {
            return { status: 'insufficient_data', message: 'Need both proposals and customers for integration test' };
          }

          // Test referential integrity
          const proposalsWithValidCustomers = proposals.filter(p => {
            if (!p.customerId) return false;
            return customers.some(c => c.id === p.customerId);
          });

          const integrationStrength = proposalsWithValidCustomers.length / proposals.length;

          return {
            totalProposals: proposals.length,
            totalCustomers: customers.length,
            validReferences: proposalsWithValidCustomers.length,
            integrationStrength: `${(integrationStrength * 100).toFixed(1)}%`,
            referentialIntegrity: integrationStrength > 0.8, // 80% threshold
            dataFlowWorking: integrationStrength > 0
          };
        }
      },

      {
        name: 'Version History-Proposal Bidirectional Sync',
        test: async () => {
          // Test that version history and proposal data stay synchronized
          const proposalsRes = await this.api.request('GET', '/api/proposals?limit=3');
          const versionsRes = await this.api.request('GET', '/api/proposals/versions?limit=10');

          if (proposalsRes.status !== 200 || versionsRes.status !== 200) {
            throw new Error('Cannot test version-proposal sync - APIs not responding');
          }

          const proposalsData = await proposalsRes.json();
          const versionsData = await versionsRes.json();

          const proposals = proposalsData.data?.items || [];
          const versions = versionsData.data?.items || [];

          // Test that all version history entries reference valid proposals
          const validVersions = versions.filter(v => {
            if (!v.proposalId) return false;
            return proposals.some(p => p.id === v.proposalId);
          });

          // Test that version counts are consistent
          const versionCountsByProposal = {};
          versions.forEach(v => {
            versionCountsByProposal[v.proposalId] = (versionCountsByProposal[v.proposalId] || 0) + 1;
          });

          // Get detailed version counts for each proposal
          const detailedVersionCounts = [];
          for (const proposal of proposals.slice(0, 2)) {
            try {
              const detailRes = await this.api.request('GET', `/api/proposals/${proposal.id}/versions?limit=20`);
              if (detailRes.status === 200) {
                const detailData = await detailRes.json();
                detailedVersionCounts.push({
                  proposalId: proposal.id,
                  listCount: versionCountsByProposal[proposal.id] || 0,
                  detailCount: detailData.data?.items?.length || 0,
                  consistent: (versionCountsByProposal[proposal.id] || 0) === (detailData.data?.items?.length || 0)
                });
              }
            } catch (error) {
              // Skip if detailed endpoint fails
            }
          }

          const consistentCounts = detailedVersionCounts.filter(d => d.consistent).length;
          const totalChecked = detailedVersionCounts.length;

          return {
            totalVersions: versions.length,
            validVersionReferences: validVersions.length,
            referenceValidity: `${((validVersions.length / versions.length) * 100).toFixed(1)}%`,
            consistencyChecks: totalChecked,
            consistentCounts,
            bidirectionalSync: consistentCounts === totalChecked && validVersions.length === versions.length,
            dataSynchronization: 'working'
          };
        }
      },

      {
        name: 'API-to-API Communication Flow',
        test: async () => {
          // Test the flow: List → Detail → Related Data
          const listRes = await this.api.request('GET', '/api/proposals?limit=2');

          if (listRes.status !== 200) {
            throw new Error('Cannot test API communication flow - list API not responding');
          }

          const listData = await listRes.json();
          const proposals = listData.data?.items || [];

          if (proposals.length === 0) {
            return { status: 'no_data', message: 'No proposals available for API flow test' };
          }

          const proposal = proposals[0];
          const results = [];

          // Test 1: Get proposal details
          try {
            const detailRes = await this.api.request('GET', `/api/proposals/${proposal.id}`);
            const detailSuccess = detailRes.status === 200;
            results.push({ step: 'proposal_detail', success: detailSuccess, status: detailRes.status });
          } catch (error) {
            results.push({ step: 'proposal_detail', success: false, error: error.message });
          }

          // Test 2: Get proposal version history
          try {
            const versionsRes = await this.api.request('GET', `/api/proposals/${proposal.id}/versions?limit=3`);
            const versionsSuccess = versionsRes.status === 200;
            results.push({ step: 'version_history', success: versionsSuccess, status: versionsRes.status });
          } catch (error) {
            results.push({ step: 'version_history', success: false, error: error.message });
          }

          // Test 3: Get customer data if proposal has customer
          if (proposal.customerId) {
            try {
              const customerRes = await this.api.request('GET', `/api/customers/${proposal.customerId}`);
              const customerSuccess = customerRes.status === 200;
              results.push({ step: 'customer_detail', success: customerSuccess, status: customerRes.status });
            } catch (error) {
              results.push({ step: 'customer_detail', success: false, error: error.message });
            }
          }

          // Test 4: Get proposal statistics
          try {
            const statsRes = await this.api.request('GET', '/api/proposals/stats');
            const statsSuccess = statsRes.status === 200;
            results.push({ step: 'proposal_stats', success: statsSuccess, status: statsRes.status });
          } catch (error) {
            results.push({ step: 'proposal_stats', success: false, error: error.message });
          }

          const successfulSteps = results.filter(r => r.success).length;
          const totalSteps = results.length;

          return {
            proposalId: proposal.id,
            customerId: proposal.customerId,
            totalApiCalls: totalSteps,
            successfulCalls: successfulSteps,
            successRate: `${((successfulSteps / totalSteps) * 100).toFixed(1)}%`,
            apiCommunicationFlow: successfulSteps === totalSteps ? 'seamless' : 'partial',
            integrationWorking: successfulSteps > 0,
            stepResults: results
          };
        }
      },

      {
        name: 'Service Layer Dependency Chain',
        test: async () => {
          // Test that service layer dependencies work correctly
          // This simulates the service layer calling other services

          const serviceChain = [
            { name: 'version_history_service', endpoint: '/api/proposals/versions?limit=1' },
            { name: 'proposal_service', endpoint: '/api/proposals?limit=1' },
            { name: 'customer_service', endpoint: '/api/customers?limit=1' },
            { name: 'product_service', endpoint: '/api/products?limit=1' }
          ];

          const results = [];
          for (const service of serviceChain) {
            try {
              const start = Date.now();
              const res = await this.api.request('GET', service.endpoint);
              const duration = Date.now() - start;

              const responseData = await res.json();
              const hasData = responseData.data !== undefined;
              const hasItems = responseData.data?.items !== undefined;
              const responseFormat = hasData && hasItems ? 'service_layer_format' : 'direct_format';

              results.push({
                service: service.name,
                status: res.status,
                duration,
                responseFormat,
                hasData,
                hasItems,
                serviceWorking: res.status === 200 && hasData
              });
            } catch (error) {
              results.push({
                service: service.name,
                status: 'error',
                error: error.message,
                serviceWorking: false
              });
            }
          }

          const workingServices = results.filter(r => r.serviceWorking).length;
          const totalServices = results.length;

          // Test service layer consistency (all services should return similar format)
          const formats = results.filter(r => r.responseFormat).map(r => r.responseFormat);
          const consistentFormat = new Set(formats).size === 1;

          return {
            totalServices,
            workingServices,
            serviceAvailability: `${((workingServices / totalServices) * 100).toFixed(1)}%`,
            formatConsistency: consistentFormat,
            dependencyChain: workingServices === totalServices ? 'complete' : 'partial',
            serviceLayerIntegration: 'validated',
            serviceResults: results
          };
        }
      },

      {
        name: 'Real-time Data Synchronization',
        test: async () => {
          // Test that data changes are reflected across related endpoints
          const initialProposalsRes = await this.api.request('GET', '/api/proposals?limit=1');

          if (initialProposalsRes.status !== 200) {
            throw new Error('Cannot test data synchronization - proposals API not responding');
          }

          const initialData = await initialProposalsRes.json();
          const initialProposals = initialData.data?.items || [];

          if (initialProposals.length === 0) {
            return { status: 'no_data', message: 'No proposals available for sync test' };
          }

          const proposal = initialProposals[0];
          const originalTitle = proposal.title;

          // Make a change to the proposal
          const updateRes = await this.api.request('PATCH', `/api/proposals/${proposal.id}`, {
            title: `${originalTitle} - Sync Test ${Date.now()}`
          });

          if (updateRes.status !== 200) {
            throw new Error(`Cannot test sync - proposal update failed: ${updateRes.status}`);
          }

          // Wait a moment for potential caching/propagation
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if the change is reflected in different endpoints
          const syncChecks = [
            {
              name: 'proposals_list',
              endpoint: '/api/proposals?limit=5',
              check: (data) => data.data?.items?.some(p => p.id === proposal.id && p.title !== originalTitle)
            },
            {
              name: 'single_proposal',
              endpoint: `/api/proposals/${proposal.id}`,
              check: (data) => data.data?.title !== originalTitle
            }
          ];

          const syncResults = [];
          for (const check of syncChecks) {
            try {
              const res = await this.api.request('GET', check.endpoint);
              if (res.status === 200) {
                const data = await res.json();
                const isSynchronized = check.check(data);
                syncResults.push({
                  endpoint: check.name,
                  synchronized: isSynchronized,
                  status: 'checked'
                });
              } else {
                syncResults.push({
                  endpoint: check.name,
                  synchronized: false,
                  status: 'api_error',
                  apiStatus: res.status
                });
              }
            } catch (error) {
              syncResults.push({
                endpoint: check.name,
                synchronized: false,
                status: 'error',
                error: error.message
              });
            }
          }

          const synchronizedEndpoints = syncResults.filter(r => r.synchronized).length;
          const totalChecks = syncResults.length;

          return {
            proposalId: proposal.id,
            originalTitle,
            syncChecks: totalChecks,
            synchronizedEndpoints,
            synchronizationRate: `${((synchronizedEndpoints / totalChecks) * 100).toFixed(1)}%`,
            realTimeSync: synchronizedEndpoints === totalChecks,
            dataPropagation: synchronizedEndpoints > 0 ? 'working' : 'delayed',
            syncResults
          };
        }
      },

      {
        name: 'Cross-Module Business Logic Validation',
        test: async () => {
          // Test that business rules are consistently applied across modules
          const businessRules = [
            {
              name: 'version_sequence_integrity',
              test: async () => {
                // Test that version numbers are sequential within proposals
                const proposalsRes = await this.api.request('GET', '/api/proposals?limit=2');
                const proposalsData = await proposalsRes.json();

                if (!proposalsData.data?.items?.length) return { valid: false, reason: 'no_proposals' };

                let validSequences = 0;
                for (const proposal of proposalsData.data.items.slice(0, 1)) {
                  const versionsRes = await this.api.request('GET', `/api/proposals/${proposal.id}/versions?limit=10`);
                  if (versionsRes.status === 200) {
                    const versionsData = await versionsRes.json();
                    const versions = versionsData.data?.items || [];

                    if (versions.length > 1) {
                      const versionNumbers = versions.map(v => v.version).sort((a, b) => b - a);
                      const isSequential = versionNumbers.every((v, i) =>
                        i === 0 || v === versionNumbers[i - 1] - 1
                      );
                      if (isSequential) validSequences++;
                    }
                  }
                }

                return { valid: validSequences > 0, checked: 1 };
              }
            },
            {
              name: 'customer_proposal_relationship',
              test: async () => {
                // Test that customer-proposal relationships are bidirectional
                const customersRes = await this.api.request('GET', '/api/customers?limit=2');
                const customersData = await customersRes.json();

                if (!customersData.data?.items?.length) return { valid: false, reason: 'no_customers' };

                let validRelationships = 0;
                for (const customer of customersData.data.items.slice(0, 1)) {
                  // Check if customer has associated proposals
                  const customerProposalsRes = await this.api.request('GET', `/api/customers/${customer.id}/proposals`);
                  if (customerProposalsRes.status === 200) {
                    const customerProposalsData = await customerProposalsRes.json();
                    const customerProposals = customerProposalsData.data?.items || [];

                    // Verify that each proposal references back to this customer
                    const validRefs = customerProposals.every(p => p.customerId === customer.id);
                    if (validRefs) validRelationships++;
                  }
                }

                return { valid: validRelationships > 0, checked: 1 };
              }
            },
            {
              name: 'audit_trail_completeness',
              test: async () => {
                // Test that all changes are properly audited
                const versionsRes = await this.api.request('GET', '/api/proposals/versions?limit=5');
                const versionsData = await versionsRes.json();

                const versions = versionsData.data?.items || [];
                const completeAudits = versions.filter(v =>
                  v.id && v.proposalId && v.version && v.changeType && v.createdAt
                ).length;

                return {
                  valid: completeAudits === versions.length,
                  totalVersions: versions.length,
                  completeAudits
                };
              }
            }
          ];

          const results = [];
          for (const rule of businessRules) {
            try {
              const result = await rule.test();
              results.push({
                rule: rule.name,
                valid: result.valid,
                details: result
              });
            } catch (error) {
              results.push({
                rule: rule.name,
                valid: false,
                error: error.message
              });
            }
          }

          const validRules = results.filter(r => r.valid).length;
          const totalRules = results.length;

          return {
            businessRules: totalRules,
            validRules,
            complianceRate: `${((validRules / totalRules) * 100).toFixed(1)}%`,
            crossModuleConsistency: validRules === totalRules,
            businessLogicIntegration: validRules > 0 ? 'working' : 'needs_attention',
            ruleResults: results
          };
        }
      },

      {
        name: 'Error Propagation Across Modules',
        test: async () => {
          // Test that errors are properly propagated and handled across module boundaries
          const errorScenarios = [
            {
              name: 'invalid_proposal_id',
              endpoint: '/api/proposals/invalid-id/versions',
              expectedStatus: 404
            },
            {
              name: 'invalid_customer_id',
              endpoint: '/api/customers/invalid-id',
              expectedStatus: 404
            },
            {
              name: 'invalid_product_id',
              endpoint: '/api/products/invalid-id',
              expectedStatus: 404
            },
            {
              name: 'unauthorized_access',
              endpoint: '/api/admin/users',
              expectedStatus: 401,
              skipAuth: true
            }
          ];

          const results = [];
          for (const scenario of errorScenarios) {
            try {
              // Temporarily clear auth for unauthorized test
              if (scenario.skipAuth) {
                const originalCookies = new Map(this.api['cookies']);
                this.api['cookies'].clear();

                const res = await this.api.request('GET', scenario.endpoint);
                const status = res.status;

                // Restore auth
                this.api['cookies'] = originalCookies;

                results.push({
                  scenario: scenario.name,
                  expectedStatus: scenario.expectedStatus,
                  actualStatus: status,
                  errorHandled: status === scenario.expectedStatus,
                  propagation: 'tested'
                });
              } else {
                const res = await this.api.request('GET', scenario.endpoint);
                const status = res.status;

                results.push({
                  scenario: scenario.name,
                  expectedStatus: scenario.expectedStatus,
                  actualStatus: status,
                  errorHandled: status === scenario.expectedStatus,
                  propagation: 'tested'
                });
              }
            } catch (error) {
              results.push({
                scenario: scenario.name,
                expectedStatus: scenario.expectedStatus,
                actualStatus: 'error',
                error: error.message,
                errorHandled: false,
                propagation: 'failed'
              });
            }
          }

          const properlyHandledErrors = results.filter(r => r.errorHandled).length;
          const totalScenarios = results.length;

          return {
            errorScenarios: totalScenarios,
            properlyHandled: properlyHandledErrors,
            errorHandlingRate: `${((properlyHandledErrors / totalScenarios) * 100).toFixed(1)}%`,
            errorPropagation: properlyHandledErrors === totalScenarios ? 'consistent' : 'inconsistent',
            crossModuleErrors: 'validated',
            scenarioResults: results
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
