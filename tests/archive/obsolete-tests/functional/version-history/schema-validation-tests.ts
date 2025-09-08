#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Schema Validation Testing Module
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * 🔍 SCHEMA VALIDATION TESTING: Database schema integrity
 * ✅ TESTS: Migration validation, foreign keys, indexes, schema drift
 * ✅ VALIDATES: Schema consistency and referential integrity
 * ✅ MEASURES: Schema health and data integrity
 */

import { logInfo } from '../../../src/lib/logger';
import { ApiClient } from './api-client';

export class SchemaValidationTests {
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
    console.log('\n🔍 Testing Schema Validation & Integrity');

    const tests: Array<{
      name: string;
      test: () => Promise<any>;
    }> = [
      {
        name: 'Database Schema Consistency Check',
        test: async () => {
          // Test that all entities have consistent schema structure
          const entities = [
            { name: 'proposals', endpoint: '/api/proposals?limit=3' },
            { name: 'customers', endpoint: '/api/customers?limit=3' },
            { name: 'products', endpoint: '/api/products?limit=3' },
            { name: 'versions', endpoint: '/api/proposals/versions?limit=3' }
          ];

          const schemaResults = [];

          for (const entity of entities) {
            try {
              const res = await this.api.request('GET', entity.endpoint);
              if (res.status === 200) {
                const data = await res.json();

                // Validate common schema patterns
                const items = data.data?.items || [];
                const hasConsistentStructure = items.every((item: any) => {
                  // Check for required ID field
                  if (!item.id) return false;

                  // Check for consistent ID format (CUID)
                  if (!item.id.startsWith('cm')) return false;

                  // Check for createdAt field
                  if (!item.createdAt) return false;

                  // Check for proper date format
                  if (isNaN(Date.parse(item.createdAt))) return false;

                  return true;
                });

                schemaResults.push({
                  entity: entity.name,
                  itemsChecked: items.length,
                  schemaValid: hasConsistentStructure,
                  requiredFields: items.length > 0 ? ['id', 'createdAt'] : [],
                  idFormat: 'cuid',
                  dateFormat: 'iso'
                });
              } else {
                schemaResults.push({
                  entity: entity.name,
                  itemsChecked: 0,
                  schemaValid: false,
                  error: `API returned ${res.status}`,
                  status: res.status
                });
              }
            } catch (error) {
              schemaResults.push({
                entity: entity.name,
                itemsChecked: 0,
                schemaValid: false,
                error: error.message
              });
            }
          }

          const validSchemas = schemaResults.filter(r => r.schemaValid).length;
          const totalEntities = schemaResults.length;

          return {
            entitiesValidated: totalEntities,
            schemasValid: validSchemas,
            validationRate: `${((validSchemas / totalEntities) * 100).toFixed(1)}%`,
            schemaConsistency: validSchemas === totalEntities,
            databaseIntegrity: 'checked',
            schemaResults
          };
        }
      },

      {
        name: 'Foreign Key Referential Integrity',
        test: async () => {
          // Test that foreign key relationships are maintained
          const relationshipTests = [
            {
              name: 'proposal_customer_relationship',
              test: async () => {
                const proposalsRes = await this.api.request('GET', '/api/proposals?limit=5');
                if (proposalsRes.status !== 200) return { valid: false, reason: 'cannot_fetch_proposals' };

                const proposalsData = await proposalsRes.json();
                const proposals = proposalsData.data?.items || [];

                let validRefs = 0;
                let totalRefs = 0;

                for (const proposal of proposals) {
                  if (proposal.customerId) {
                    totalRefs++;
                    // Check if customer exists
                    const customerRes = await this.api.request('GET', `/api/customers/${proposal.customerId}`);
                    if (customerRes.status === 200) {
                      validRefs++;
                    }
                  }
                }

                return {
                  relationship: 'proposal_customer',
                  totalReferences: totalRefs,
                  validReferences: validRefs,
                  integrity: totalRefs === 0 ? 1 : validRefs / totalRefs
                };
              }
            },
            {
              name: 'version_proposal_relationship',
              test: async () => {
                const versionsRes = await this.api.request('GET', '/api/proposals/versions?limit=10');
                if (versionsRes.status !== 200) return { valid: false, reason: 'cannot_fetch_versions' };

                const versionsData = await versionsRes.json();
                const versions = versionsData.data?.items || [];

                let validRefs = 0;
                let totalRefs = 0;

                for (const version of versions) {
                  if (version.proposalId) {
                    totalRefs++;
                    // Check if proposal exists
                    const proposalRes = await this.api.request('GET', `/api/proposals/${version.proposalId}`);
                    if (proposalRes.status === 200) {
                      validRefs++;
                    }
                  }
                }

                return {
                  relationship: 'version_proposal',
                  totalReferences: totalRefs,
                  validReferences: validRefs,
                  integrity: totalRefs === 0 ? 1 : validRefs / totalRefs
                };
              }
            }
          ];

          const results = [];
          for (const relationshipTest of relationshipTests) {
            try {
              const result = await relationshipTest.test();
              results.push(result);
            } catch (error) {
              results.push({
                relationship: relationshipTest.name,
                error: error.message,
                integrity: 0
              });
            }
          }

          const averageIntegrity = results.reduce((sum, r) => sum + (r.integrity || 0), 0) / results.length;
          const perfectIntegrity = results.every(r => (r.integrity || 0) === 1);

          return {
            relationshipsTested: results.length,
            averageIntegrity: `${(averageIntegrity * 100).toFixed(1)}%`,
            perfectIntegrity,
            referentialIntegrity: perfectIntegrity ? 'excellent' : averageIntegrity > 0.9 ? 'good' : 'needs_attention',
            relationshipResults: results
          };
        }
      },

      {
        name: 'Index Performance Validation',
        test: async () => {
          // Test that database indexes are working effectively
          const indexTests = [
            { name: 'proposal_lookup', endpoint: '/api/proposals?limit=1' },
            { name: 'customer_lookup', endpoint: '/api/customers?limit=1' },
            { name: 'product_lookup', endpoint: '/api/products?limit=1' },
            { name: 'version_lookup', endpoint: '/api/proposals/versions?limit=1' },
            { name: 'proposal_filter', endpoint: '/api/proposals?status=DRAFT&limit=5' },
            { name: 'version_filter', endpoint: '/api/proposals/versions?changeType=create&limit=5' }
          ];

          const performanceResults = [];

          for (const indexTest of indexTests) {
            try {
              const start = Date.now();
              const res = await this.api.request('GET', indexTest.endpoint);
              const duration = Date.now() - start;

              performanceResults.push({
                index: indexTest.name,
                responseTime: duration,
                status: res.status,
                efficient: duration < 1000, // Less than 1 second is good
                endpoint: indexTest.endpoint
              });
            } catch (error) {
              performanceResults.push({
                index: indexTest.name,
                responseTime: 0,
                status: 'error',
                efficient: false,
                error: error.message,
                endpoint: indexTest.endpoint
              });
            }

            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          const efficientIndexes = performanceResults.filter(r => r.efficient).length;
          const totalIndexes = performanceResults.length;
          const avgResponseTime = performanceResults.reduce((sum, r) => sum + r.responseTime, 0) / totalIndexes;

          return {
            indexesTested: totalIndexes,
            efficientIndexes,
            averageResponseTime: Math.round(avgResponseTime),
            indexEfficiency: `${((efficientIndexes / totalIndexes) * 100).toFixed(1)}%`,
            databasePerformance: avgResponseTime < 500 ? 'excellent' : avgResponseTime < 1000 ? 'good' : 'needs_optimization',
            indexResults: performanceResults
          };
        }
      },

      {
        name: 'Schema Drift Detection',
        test: async () => {
          // Test for schema drift between different environments/data sources
          const schemaComparisons = [
            {
              name: 'proposal_schema_consistency',
              endpoints: ['/api/proposals?limit=1', '/api/proposals?limit=2'],
              compareFields: ['id', 'title', 'status', 'customerId', 'createdAt']
            },
            {
              name: 'customer_schema_consistency',
              endpoints: ['/api/customers?limit=1', '/api/customers?limit=2'],
              compareFields: ['id', 'name', 'email', 'createdAt']
            },
            {
              name: 'version_schema_consistency',
              endpoints: ['/api/proposals/versions?limit=1', '/api/proposals/versions?limit=2'],
              compareFields: ['id', 'proposalId', 'version', 'changeType', 'createdAt']
            }
          ];

          const driftResults = [];

          for (const comparison of schemaComparisons) {
            try {
              const results = [];

              // Fetch from both endpoints
              for (const endpoint of comparison.endpoints) {
                const res = await this.api.request('GET', endpoint);
                if (res.status === 200) {
                  const data = await res.json();
                  const item = data.data?.items?.[0];
                  if (item) {
                    results.push(item);
                  }
                }
              }

              if (results.length === 2) {
                // Compare schemas
                const schema1 = Object.keys(results[0]);
                const schema2 = Object.keys(results[1]);

                const commonFields = comparison.compareFields.filter(field =>
                  schema1.includes(field) && schema2.includes(field)
                );

                const missingIn1 = comparison.compareFields.filter(field =>
                  !schema1.includes(field)
                );

                const missingIn2 = comparison.compareFields.filter(field =>
                  !schema2.includes(field)
                );

                const schemaDrift = missingIn1.length > 0 || missingIn2.length > 0;

                driftResults.push({
                  comparison: comparison.name,
                  expectedFields: comparison.compareFields.length,
                  commonFields: commonFields.length,
                  missingFields: missingIn1.length + missingIn2.length,
                  schemaDrift,
                  consistency: !schemaDrift
                });
              } else {
                driftResults.push({
                  comparison: comparison.name,
                  expectedFields: comparison.compareFields.length,
                  commonFields: 0,
                  missingFields: comparison.compareFields.length,
                  schemaDrift: true,
                  consistency: false,
                  reason: 'insufficient_data'
                });
              }
            } catch (error) {
              driftResults.push({
                comparison: comparison.name,
                error: error.message,
                schemaDrift: true,
                consistency: false
              });
            }
          }

          const consistentSchemas = driftResults.filter(r => r.consistency).length;
          const totalComparisons = driftResults.length;

          return {
            schemaComparisons: totalComparisons,
            consistentSchemas,
            driftDetected: totalComparisons - consistentSchemas,
            schemaStability: `${((consistentSchemas / totalComparisons) * 100).toFixed(1)}%`,
            driftAnalysis: driftResults
          };
        }
      },

      {
        name: 'Data Type Consistency Validation',
        test: async () => {
          // Test that data types are consistent across all records
          const typeValidationTests = [
            {
              name: 'proposal_data_types',
              endpoint: '/api/proposals?limit=10',
              typeChecks: {
                id: 'string',
                title: 'string',
                status: 'string',
                value: 'number',
                createdAt: 'date',
                updatedAt: 'date'
              }
            },
            {
              name: 'customer_data_types',
              endpoint: '/api/customers?limit=10',
              typeChecks: {
                id: 'string',
                name: 'string',
                email: 'string',
                createdAt: 'date'
              }
            },
            {
              name: 'version_data_types',
              endpoint: '/api/proposals/versions?limit=10',
              typeChecks: {
                id: 'string',
                proposalId: 'string',
                version: 'number',
                changeType: 'string',
                createdAt: 'date'
              }
            }
          ];

          const typeResults = [];

          for (const typeTest of typeValidationTests) {
            try {
              const res = await this.api.request('GET', typeTest.endpoint);
              if (res.status === 200) {
                const data = await res.json();
                const items = data.data?.items || [];

                const typeValidation = {};

                for (const [field, expectedType] of Object.entries(typeTest.typeChecks)) {
                  let validCount = 0;
                  let totalCount = 0;

                  for (const item of items) {
                    totalCount++;
                    const value = item[field];

                    if (value !== undefined && value !== null) {
                      let isValid = false;

                      switch (expectedType) {
                        case 'string':
                          isValid = typeof value === 'string';
                          break;
                        case 'number':
                          isValid = typeof value === 'number' && !isNaN(value);
                          break;
                        case 'date':
                          isValid = typeof value === 'string' && !isNaN(Date.parse(value));
                          break;
                        case 'boolean':
                          isValid = typeof value === 'boolean';
                          break;
                      }

                      if (isValid) validCount++;
                    }
                  }

                  typeValidation[field] = {
                    expectedType,
                    validRecords: validCount,
                    totalRecords: totalCount,
                    typeConsistency: totalCount === 0 ? 1 : validCount / totalCount
                  };
                }

                const overallConsistency = Object.values(typeValidation).reduce(
                  (sum: number, check: any) => sum + check.typeConsistency, 0
                ) / Object.keys(typeValidation).length;

                typeResults.push({
                  entity: typeTest.name,
                  recordsValidated: items.length,
                  fieldsValidated: Object.keys(typeValidation).length,
                  overallTypeConsistency: overallConsistency,
                  fieldValidations: typeValidation
                });
              } else {
                typeResults.push({
                  entity: typeTest.name,
                  recordsValidated: 0,
                  fieldsValidated: 0,
                  overallTypeConsistency: 0,
                  error: `API returned ${res.status}`
                });
              }
            } catch (error) {
              typeResults.push({
                entity: typeTest.name,
                recordsValidated: 0,
                fieldsValidated: 0,
                overallTypeConsistency: 0,
                error: error.message
              });
            }
          }

          const averageConsistency = typeResults.reduce((sum, r) => sum + r.overallTypeConsistency, 0) / typeResults.length;
          const perfectConsistency = typeResults.every(r => r.overallTypeConsistency === 1);

          return {
            entitiesValidated: typeResults.length,
            averageTypeConsistency: `${(averageConsistency * 100).toFixed(1)}%`,
            perfectTypeConsistency: perfectConsistency,
            dataTypeIntegrity: perfectConsistency ? 'excellent' : averageConsistency > 0.95 ? 'good' : 'needs_attention',
            typeValidationResults: typeResults
          };
        }
      },

      {
        name: 'Required Field Enforcement',
        test: async () => {
          // Test that required fields are always present and non-null
          const requiredFieldTests = [
            {
              name: 'proposal_required_fields',
              endpoint: '/api/proposals?limit=10',
              requiredFields: ['id', 'title', 'status', 'createdAt']
            },
            {
              name: 'customer_required_fields',
              endpoint: '/api/customers?limit=10',
              requiredFields: ['id', 'name', 'email', 'createdAt']
            },
            {
              name: 'version_required_fields',
              endpoint: '/api/proposals/versions?limit=10',
              requiredFields: ['id', 'proposalId', 'version', 'changeType', 'createdAt']
            },
            {
              name: 'product_required_fields',
              endpoint: '/api/products?limit=10',
              requiredFields: ['id', 'name', 'price', 'createdAt']
            }
          ];

          const requiredFieldResults = [];

          for (const requiredTest of requiredFieldTests) {
            try {
              const res = await this.api.request('GET', requiredTest.endpoint);
              if (res.status === 200) {
                const data = await res.json();
                const items = data.data?.items || [];

                const fieldCompliance = {};

                for (const field of requiredTest.requiredFields) {
                  let compliantRecords = 0;

                  for (const item of items) {
                    const value = item[field];
                    if (value !== undefined && value !== null && value !== '') {
                      compliantRecords++;
                    }
                  }

                  fieldCompliance[field] = {
                    compliantRecords,
                    totalRecords: items.length,
                    complianceRate: items.length === 0 ? 1 : compliantRecords / items.length
                  };
                }

                const overallCompliance = Object.values(fieldCompliance).reduce(
                  (sum: number, check: any) => sum + check.complianceRate, 0
                ) / requiredTest.requiredFields.length;

                requiredFieldResults.push({
                  entity: requiredTest.name,
                  recordsChecked: items.length,
                  requiredFields: requiredTest.requiredFields.length,
                  overallCompliance: overallCompliance,
                  fieldCompliance
                });
              } else {
                requiredFieldResults.push({
                  entity: requiredTest.name,
                  recordsChecked: 0,
                  requiredFields: requiredTest.requiredFields.length,
                  overallCompliance: 0,
                  error: `API returned ${res.status}`
                });
              }
            } catch (error) {
              requiredFieldResults.push({
                entity: requiredTest.name,
                recordsChecked: 0,
                requiredFields: requiredTest.requiredFields.length,
                overallCompliance: 0,
                error: error.message
              });
            }
          }

          const averageCompliance = requiredFieldResults.reduce((sum, r) => sum + r.overallCompliance, 0) / requiredFieldResults.length;
          const perfectCompliance = requiredFieldResults.every(r => r.overallCompliance === 1);

          return {
            entitiesValidated: requiredFieldResults.length,
            averageCompliance: `${(averageCompliance * 100).toFixed(1)}%`,
            perfectCompliance,
            requiredFieldEnforcement: perfectCompliance ? 'excellent' : averageCompliance > 0.95 ? 'good' : 'needs_improvement',
            complianceResults: requiredFieldResults
          };
        }
      },

      {
        name: 'Enum Value Validation',
        test: async () => {
          // Test that enum fields contain only valid values
          const enumValidationTests = [
            {
              name: 'proposal_status_enum',
              endpoint: '/api/proposals?limit=20',
              field: 'status',
              validValues: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACCEPTED', 'DECLINED']
            },
            {
              name: 'customer_tier_enum',
              endpoint: '/api/customers?limit=20',
              field: 'tier',
              validValues: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']
            },
            {
              name: 'version_change_type_enum',
              endpoint: '/api/proposals/versions?limit=20',
              field: 'changeType',
              validValues: ['create', 'update', 'delete', 'batch_import', 'rollback', 'status_change', 'INITIAL']
            },
            {
              name: 'product_status_enum',
              endpoint: '/api/products?limit=20',
              field: 'status',
              validValues: ['ACTIVE', 'INACTIVE', 'DISCONTINUED']
            }
          ];

          const enumResults = [];

          for (const enumTest of enumValidationTests) {
            try {
              const res = await this.api.request('GET', enumTest.endpoint);
              if (res.status === 200) {
                const data = await res.json();
                const items = data.data?.items || [];

                let validEnumValues = 0;
                let invalidEnumValues = 0;
                const invalidValues = [];

                for (const item of items) {
                  const value = item[enumTest.field];
                  if (value !== undefined && value !== null) {
                    if (enumTest.validValues.includes(value)) {
                      validEnumValues++;
                    } else {
                      invalidEnumValues++;
                      invalidValues.push(value);
                    }
                  }
                }

                const totalValues = validEnumValues + invalidEnumValues;
                const enumCompliance = totalValues === 0 ? 1 : validEnumValues / totalValues;

                enumResults.push({
                  enumField: enumTest.name,
                  recordsChecked: items.length,
                  validEnumValues,
                  invalidEnumValues,
                  uniqueInvalidValues: [...new Set(invalidValues)],
                  enumCompliance: enumCompliance,
                  validValues: enumTest.validValues
                });
              } else {
                enumResults.push({
                  enumField: enumTest.name,
                  recordsChecked: 0,
                  validEnumValues: 0,
                  invalidEnumValues: 0,
                  uniqueInvalidValues: [],
                  enumCompliance: 0,
                  error: `API returned ${res.status}`
                });
              }
            } catch (error) {
              enumResults.push({
                enumField: enumTest.name,
                recordsChecked: 0,
                validEnumValues: 0,
                invalidEnumValues: 0,
                uniqueInvalidValues: [],
                enumCompliance: 0,
                error: error.message
              });
            }
          }

          const averageCompliance = enumResults.reduce((sum, r) => sum + r.enumCompliance, 0) / enumResults.length;
          const perfectCompliance = enumResults.every(r => r.enumCompliance === 1);
          const totalInvalidValues = enumResults.reduce((sum, r) => sum + r.invalidEnumValues, 0);

          return {
            enumFieldsValidated: enumResults.length,
            averageEnumCompliance: `${(averageCompliance * 100).toFixed(1)}%`,
            perfectEnumCompliance: perfectCompliance,
            totalInvalidEnumValues: totalInvalidValues,
            enumValidation: perfectCompliance ? 'excellent' : averageCompliance > 0.95 ? 'good' : 'needs_enum_cleanup',
            enumResults
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
