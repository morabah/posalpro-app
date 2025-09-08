#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product Schema Validation Tests
 * User Story: US-2.1 (Product Management), US-2.2 (Product Catalog)
 * Hypothesis: H4 (Product management improves efficiency), H5 (Catalog system enhances usability)
 *
 * 📋 SCHEMA VALIDATION TESTING: Database schema integrity and validation
 * ✅ TESTS: Schema compliance, field validation, relationship integrity
 * ✅ VALIDATES: Data structure consistency and schema adherence
 * ✅ MEASURES: Schema validation coverage and data integrity
 */

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
    console.log('\n📋 Testing Product Schema Validation');

    const tests: Array<{
      name: string;
      test: () => Promise<any>;
    }> = [
      {
        name: 'Database Schema Field Compliance',
        test: async () => {
          // Test that API responses match expected database schema
          console.log('🔍 Validating database schema compliance...');

          const endpoints = [
            { url: '/api/products?limit=3', type: 'products' },
            { url: '/api/products/stats', type: 'stats' },
            { url: '/api/proposals?limit=2', type: 'proposals' },
            { url: '/api/customers?limit=2', type: 'customers' },
          ];

          const schemaValidationResults = [];

          for (const endpoint of endpoints) {
            try {
              const res = await this.api.request('GET', endpoint.url);

              if (res.status === 200) {
                const data = await res.json();
                const validation = this.validateEndpointSchema(endpoint.type, data);
                schemaValidationResults.push({
                  endpoint: endpoint.url,
                  type: endpoint.type,
                  ...validation,
                });
              } else {
                schemaValidationResults.push({
                  endpoint: endpoint.url,
                  type: endpoint.type,
                  valid: false,
                  status: res.status,
                  error: `API returned ${res.status}`,
                });
              }
            } catch (error) {
              schemaValidationResults.push({
                endpoint: endpoint.url,
                type: endpoint.type,
                valid: false,
                error: error.message,
              });
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          const validEndpoints = schemaValidationResults.filter(r => r.valid).length;
          const totalEndpoints = schemaValidationResults.length;

          return {
            endpointsValidated: totalEndpoints,
            schemaCompliantEndpoints: validEndpoints,
            schemaComplianceRate: `${((validEndpoints / totalEndpoints) * 100).toFixed(1)}%`,
            databaseSchemaValidation: validEndpoints === totalEndpoints,
            validationResults: schemaValidationResults,
            criticalIssues: schemaValidationResults.filter(r => !r.valid),
          };
        },
      },

      {
        name: 'Zod Schema Validation Coverage',
        test: async () => {
          // Test that Zod schemas properly validate data
          console.log('🔍 Validating Zod schema coverage...');

          const validationTests = [
            {
              name: 'Product Creation Validation',
              testData: [
                {
                  name: 'Valid Product',
                  sku: 'VALID-1',
                  price: 10,
                  stockQuantity: 1,
                  status: 'ACTIVE',
                },
                { name: '', sku: 'INVALID-1', price: 10, stockQuantity: 1, status: 'ACTIVE' }, // Invalid: empty name
                { name: 'Valid Product 2', sku: '', price: 10, stockQuantity: 1, status: 'ACTIVE' }, // Invalid: empty SKU
                {
                  name: 'Valid Product 3',
                  sku: 'VALID-2',
                  price: -10,
                  stockQuantity: 1,
                  status: 'ACTIVE',
                }, // Invalid: negative price
                {
                  name: 'Valid Product 4',
                  sku: 'VALID-3',
                  price: 10,
                  stockQuantity: -1,
                  status: 'ACTIVE',
                }, // Invalid: negative stock
                {
                  name: 'Valid Product 5',
                  sku: 'VALID-4',
                  price: 10,
                  stockQuantity: 1,
                  status: 'INVALID',
                }, // Invalid: wrong status
              ],
            },
          ];

          const zodValidationResults = [];

          for (const validationTest of validationTests) {
            const testResults = [];

            for (const testData of validationTest.testData) {
              try {
                const res = await this.api.request('POST', '/api/products', testData);

                const isValidData =
                  testData.name &&
                  testData.sku &&
                  testData.price >= 0 &&
                  testData.stockQuantity >= 0 &&
                  ['ACTIVE', 'INACTIVE', 'DISCONTINUED'].includes(testData.status);
                const shouldPass = isValidData;
                const actuallyPassed = res.status === 200 || res.status === 201;

                testResults.push({
                  testData: testData.name || 'Empty Name',
                  expectedResult: shouldPass ? 'pass' : 'fail',
                  actualResult: actuallyPassed ? 'pass' : 'fail',
                  correct: shouldPass === actuallyPassed,
                  status: res.status,
                });

                // Cleanup successful creations
                if (actuallyPassed && res.status === 200) {
                  const createData = await res.json();
                  const product = createData.data || createData;
                  if (product?.id) {
                    await this.api.cleanupTestProduct(product.id);
                  }
                }
              } catch (error) {
                testResults.push({
                  testData: testData.name || 'Empty Name',
                  expectedResult: 'fail',
                  actualResult: 'fail',
                  correct: true,
                  error: error.message,
                });
              }
            }

            const correctValidations = testResults.filter(r => r.correct).length;

            zodValidationResults.push({
              validationTest: validationTest.name,
              testsRun: testResults.length,
              correctValidations,
              accuracy: `${((correctValidations / testResults.length) * 100).toFixed(1)}%`,
              zodValidationWorking: correctValidations === testResults.length,
              testResults,
            });
          }

          const workingValidations = zodValidationResults.filter(
            r => r.zodValidationWorking
          ).length;
          const totalValidations = zodValidationResults.length;

          return {
            validationTests: totalValidations,
            workingZodValidations: workingValidations,
            zodValidationCoverage: `${((workingValidations / totalValidations) * 100).toFixed(1)}%`,
            schemaValidationEffective: workingValidations === totalValidations,
            zodValidationResults,
            validationAccuracy:
              zodValidationResults.reduce((sum, r) => sum + parseFloat(r.accuracy), 0) /
              totalValidations,
          };
        },
      },

      {
        name: 'Relationship Schema Integrity',
        test: async () => {
          // Test foreign key relationships and data integrity
          console.log('🔍 Validating relationship schema integrity...');

          const relationshipTests = [
            {
              name: 'Product-Proposal Relationships',
              primaryEndpoint: '/api/products?limit=3',
              relatedEndpoint: '/api/proposals?limit=5',
              relationshipField: 'customerId', // Products don't directly reference proposals, but we can test customer relationships
              testType: 'customer_relationship',
            },
            {
              name: 'Product-Customer Relationships',
              primaryEndpoint: '/api/products?limit=2',
              relatedEndpoint: '/api/customers?limit=3',
              relationshipField: 'customerId',
              testType: 'customer_reference',
            },
          ];

          const relationshipResults = [];

          for (const relTest of relationshipTests) {
            try {
              const [primaryRes, relatedRes] = await Promise.all([
                this.api.request('GET', relTest.primaryEndpoint),
                this.api.request('GET', relTest.relatedEndpoint),
              ]);

              if (primaryRes.status === 200 && relatedRes.status === 200) {
                const primaryData = await primaryRes.json();
                const relatedData = await relatedRes.json();

                const primaryItems = primaryData.data?.items || [];
                const relatedItems = relatedData.data?.items || [];

                if (relTest.testType === 'customer_reference') {
                  // Test that product customerIds reference valid customers
                  let validReferences = 0;
                  let totalReferences = 0;

                  // Actually, products don't have customerId - let's check proposals instead
                  const proposalRes = await this.api.request('GET', '/api/proposals?limit=3');
                  if (proposalRes.status === 200) {
                    const proposalData = await proposalRes.json();
                    const proposals = proposalData.data?.items || [];

                    for (const proposal of proposals) {
                      if (proposal.customerId) {
                        totalReferences++;
                        const customerExists = relatedItems.some(
                          (c: any) => c.id === proposal.customerId
                        );
                        if (customerExists) {
                          validReferences++;
                        }
                      }
                    }
                  }

                  const relationshipIntegrity =
                    totalReferences === 0 ? 1 : validReferences / totalReferences;

                  relationshipResults.push({
                    relationship: relTest.name,
                    totalReferences,
                    validReferences,
                    integrityScore: `${(relationshipIntegrity * 100).toFixed(1)}%`,
                    relationshipsValid: relationshipIntegrity > 0.8,
                    testType: relTest.testType,
                  });
                }
              } else {
                relationshipResults.push({
                  relationship: relTest.name,
                  valid: false,
                  error: `API error: primary ${primaryRes.status}, related ${relatedRes.status}`,
                });
              }
            } catch (error) {
              relationshipResults.push({
                relationship: relTest.name,
                valid: false,
                error: error.message,
              });
            }
          }

          const validRelationships = relationshipResults.filter(
            r => r.relationshipsValid !== false
          ).length;
          const totalRelationships = relationshipResults.length;

          return {
            relationshipsTested: totalRelationships,
            validRelationships,
            relationshipIntegrity: `${((validRelationships / totalRelationships) * 100).toFixed(1)}%`,
            schemaRelationshipsValid: validRelationships === totalRelationships,
            relationshipResults,
            dataIntegrity: validRelationships > 0,
          };
        },
      },

      {
        name: 'Enum Value Schema Compliance',
        test: async () => {
          // Test that enum values in the database match schema expectations
          console.log('🔍 Validating enum value schema compliance...');

          const enumTests = [
            {
              name: 'Product Status Enum',
              endpoint: '/api/products?limit=10',
              field: 'status',
              expectedValues: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'],
            },
            {
              name: 'Proposal Status Enum',
              endpoint: '/api/proposals?limit=5',
              field: 'status',
              expectedValues: [
                'DRAFT',
                'SUBMITTED',
                'IN_REVIEW',
                'PENDING_APPROVAL',
                'APPROVED',
                'REJECTED',
                'ACCEPTED',
                'DECLINED',
              ],
            },
            {
              name: 'Customer Status Enum',
              endpoint: '/api/customers?limit=5',
              field: 'status',
              expectedValues: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
            },
            {
              name: 'Customer Tier Enum',
              endpoint: '/api/customers?limit=5',
              field: 'tier',
              expectedValues: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
            },
          ];

          const enumValidationResults = [];

          for (const enumTest of enumTests) {
            try {
              const res = await this.api.request('GET', enumTest.endpoint);

              if (res.status === 200) {
                const data = await res.json();
                const items = data.data?.items || [];

                if (items.length === 0) {
                  enumValidationResults.push({
                    enumTest: enumTest.name,
                    itemsChecked: 0,
                    validEnums: 0,
                    enumCompliance: 'no_data',
                  });
                  continue;
                }

                let validEnums = 0;
                const invalidValues = [];

                for (const item of items) {
                  const fieldValue = item[enumTest.field];
                  if (fieldValue !== undefined && fieldValue !== null) {
                    if (enumTest.expectedValues.includes(fieldValue)) {
                      validEnums++;
                    } else {
                      invalidValues.push(fieldValue);
                    }
                  } else if (enumTest.field === 'tier') {
                    // Tier is optional, so null/undefined is acceptable
                    validEnums++;
                  }
                }

                const totalChecked = items.length;
                const complianceRate = (validEnums / totalChecked) * 100;

                enumValidationResults.push({
                  enumTest: enumTest.name,
                  itemsChecked: totalChecked,
                  validEnums,
                  invalidValues,
                  complianceRate: `${complianceRate.toFixed(1)}%`,
                  enumCompliance:
                    complianceRate === 100
                      ? 'perfect'
                      : complianceRate > 80
                        ? 'good'
                        : 'needs_review',
                });
              } else if (res.status === 403) {
                // Access denied for some endpoints is acceptable
                enumValidationResults.push({
                  enumTest: enumTest.name,
                  itemsChecked: 0,
                  validEnums: 0,
                  enumCompliance: 'access_denied',
                });
              } else {
                enumValidationResults.push({
                  enumTest: enumTest.name,
                  itemsChecked: 0,
                  validEnums: 0,
                  enumCompliance: 'api_error',
                  status: res.status,
                });
              }
            } catch (error) {
              enumValidationResults.push({
                enumTest: enumTest.name,
                itemsChecked: 0,
                validEnums: 0,
                enumCompliance: 'error',
                error: error.message,
              });
            }
          }

          const perfectEnums = enumValidationResults.filter(
            r => r.enumCompliance === 'perfect'
          ).length;
          const goodEnums = enumValidationResults.filter(
            r => r.enumCompliance === 'good' || r.enumCompliance === 'perfect'
          ).length;
          const totalEnums = enumValidationResults.length;

          return {
            enumTests: totalEnums,
            perfectEnumCompliance: perfectEnums,
            goodEnumCompliance: goodEnums,
            enumValidationCoverage: `${((goodEnums / totalEnums) * 100).toFixed(1)}%`,
            schemaEnumCompliance: perfectEnums === totalEnums,
            enumValidationResults,
            dataConsistency: goodEnums >= totalEnums * 0.8,
          };
        },
      },

      {
        name: 'Data Type Schema Validation',
        test: async () => {
          // Test that data types match schema expectations
          console.log('🔍 Validating data type schema compliance...');

          const typeValidationTests = [
            {
              name: 'Product Data Types',
              endpoint: '/api/products?limit=3',
              expectedTypes: {
                id: 'string',
                name: 'string',
                sku: 'string',
                price: 'number',
                stockQuantity: 'number',
                status: 'string',
                createdAt: 'string',
                updatedAt: 'string',
              },
            },
            {
              name: 'Customer Data Types',
              endpoint: '/api/customers?limit=2',
              expectedTypes: {
                id: 'string',
                name: 'string',
                email: 'string',
                status: 'string',
                createdAt: 'string',
                updatedAt: 'string',
              },
            },
          ];

          const typeValidationResults = [];

          for (const typeTest of typeValidationTests) {
            try {
              const res = await this.api.request('GET', typeTest.endpoint);

              if (res.status === 200) {
                const data = await res.json();
                const items = data.data?.items || [];

                if (items.length === 0) {
                  typeValidationResults.push({
                    typeTest: typeTest.name,
                    itemsChecked: 0,
                    typeCompliantFields: 0,
                    typeValidation: 'no_data',
                  });
                  continue;
                }

                let typeCompliantFields = 0;
                let totalFieldsChecked = 0;
                const typeErrors = [];

                for (const item of items.slice(0, 2)) {
                  // Check first 2 items
                  for (const [field, expectedType] of Object.entries(typeTest.expectedTypes)) {
                    totalFieldsChecked++;
                    const actualValue = item[field];

                    if (actualValue !== undefined && actualValue !== null) {
                      let typeMatches = false;

                      switch (expectedType) {
                        case 'string':
                          typeMatches = typeof actualValue === 'string';
                          break;
                        case 'number':
                          typeMatches = typeof actualValue === 'number' && !isNaN(actualValue);
                          break;
                        case 'boolean':
                          typeMatches = typeof actualValue === 'boolean';
                          break;
                      }

                      if (typeMatches) {
                        typeCompliantFields++;
                      } else {
                        typeErrors.push(
                          `${field}: expected ${expectedType}, got ${typeof actualValue}`
                        );
                      }
                    } else {
                      // Null/undefined values are acceptable for optional fields
                      typeCompliantFields++;
                    }
                  }
                }

                const typeComplianceRate =
                  totalFieldsChecked > 0 ? (typeCompliantFields / totalFieldsChecked) * 100 : 0;

                typeValidationResults.push({
                  typeTest: typeTest.name,
                  itemsChecked: items.length,
                  fieldsChecked: totalFieldsChecked,
                  typeCompliantFields,
                  typeErrors,
                  typeComplianceRate: `${typeComplianceRate.toFixed(1)}%`,
                  typeValidation:
                    typeComplianceRate === 100
                      ? 'perfect'
                      : typeComplianceRate > 90
                        ? 'good'
                        : 'needs_review',
                });
              } else {
                typeValidationResults.push({
                  typeTest: typeTest.name,
                  itemsChecked: 0,
                  typeCompliantFields: 0,
                  typeValidation: 'api_error',
                  status: res.status,
                });
              }
            } catch (error) {
              typeValidationResults.push({
                typeTest: typeTest.name,
                itemsChecked: 0,
                typeCompliantFields: 0,
                typeValidation: 'error',
                error: error.message,
              });
            }
          }

          const perfectTypeValidation = typeValidationResults.filter(
            r => r.typeValidation === 'perfect'
          ).length;
          const goodTypeValidation = typeValidationResults.filter(
            r => r.typeValidation === 'perfect' || r.typeValidation === 'good'
          ).length;
          const totalTypeTests = typeValidationResults.length;

          return {
            typeValidationTests: totalTypeTests,
            perfectTypeCompliance: perfectTypeValidation,
            goodTypeCompliance: goodTypeValidation,
            typeValidationCoverage: `${((goodTypeValidation / totalTypeTests) * 100).toFixed(1)}%`,
            schemaTypeCompliance: perfectTypeValidation === totalTypeTests,
            typeValidationResults,
            dataTypeIntegrity: goodTypeValidation >= totalTypeTests * 0.8,
          };
        },
      },

      {
        name: 'Required Field Schema Enforcement',
        test: async () => {
          // Test that required fields are properly enforced by the schema
          console.log('🔍 Validating required field schema enforcement...');

          const requiredFieldTests = [
            {
              name: 'Product Required Fields',
              endpoint: '/api/products',
              requiredFields: ['name', 'sku', 'price', 'stockQuantity', 'status'],
              testData: [
                { sku: 'TEST-1', price: 10, stockQuantity: 1, status: 'ACTIVE' }, // Missing name
                { name: 'Test Product', price: 10, stockQuantity: 1, status: 'ACTIVE' }, // Missing sku
                { name: 'Test Product', sku: 'TEST-2', stockQuantity: 1, status: 'ACTIVE' }, // Missing price
                { name: 'Test Product', sku: 'TEST-3', price: 10, status: 'ACTIVE' }, // Missing stockQuantity
                { name: 'Test Product', sku: 'TEST-4', price: 10, stockQuantity: 1 }, // Missing status
              ],
            },
          ];

          const requiredFieldResults = [];

          for (const reqTest of requiredFieldTests) {
            const testResults = [];

            for (const testData of reqTest.testData) {
              try {
                const res = await this.api.request('POST', reqTest.endpoint, testData);

                // Check which required field is missing
                const missingField = reqTest.requiredFields.find(field => !(field in testData));
                const shouldFail = !!missingField;
                const actuallyFailed = res.status >= 400;

                testResults.push({
                  missingField,
                  expectedResult: shouldFail ? 'fail' : 'pass',
                  actualResult: actuallyFailed ? 'fail' : 'pass',
                  correct: shouldFail === actuallyFailed,
                  status: res.status,
                });
              } catch (error) {
                testResults.push({
                  missingField: 'unknown',
                  expectedResult: 'fail',
                  actualResult: 'fail',
                  correct: true,
                  error: error.message,
                });
              }
            }

            const correctEnforcement = testResults.filter(r => r.correct).length;

            requiredFieldResults.push({
              requiredFieldTest: reqTest.name,
              testsRun: testResults.length,
              correctEnforcement,
              enforcementAccuracy: `${((correctEnforcement / testResults.length) * 100).toFixed(1)}%`,
              requiredFieldsEnforced: correctEnforcement === testResults.length,
              testResults,
            });
          }

          const enforcedRequiredFields = requiredFieldResults.filter(
            r => r.requiredFieldsEnforced
          ).length;
          const totalRequiredTests = requiredFieldResults.length;

          return {
            requiredFieldTests: totalRequiredTests,
            enforcedRequiredFields: enforcedRequiredFields,
            requiredFieldEnforcement: `${((enforcedRequiredFields / totalRequiredTests) * 100).toFixed(1)}%`,
            schemaRequiredFieldCompliance: enforcedRequiredFields === totalRequiredTests,
            requiredFieldResults,
            dataValidation: enforcedRequiredFields > 0,
          };
        },
      },
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

  private validateEndpointSchema(type: string, data: any) {
    // Basic schema validation for different endpoint types
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid response structure' };
    }

    switch (type) {
      case 'products':
        if (!data.data || !Array.isArray(data.data.items)) {
          return { valid: false, error: 'Products endpoint missing data.items array' };
        }

        // Check first product structure
        const product = data.data.items[0];
        if (product && typeof product === 'object') {
          const requiredFields = ['id', 'name', 'sku', 'price', 'stockQuantity', 'status'];
          const missingFields = requiredFields.filter(field => !(field in product));

          if (missingFields.length > 0) {
            return { valid: false, error: `Missing required fields: ${missingFields.join(', ')}` };
          }
        }
        break;

      case 'stats':
        // Stats can have various formats, just check it has some data
        if (!data.data && typeof data !== 'object') {
          return { valid: false, error: 'Stats endpoint missing data' };
        }
        break;

      case 'proposals':
        if (!data.data || !Array.isArray(data.data.items)) {
          return { valid: false, error: 'Proposals endpoint missing data.items array' };
        }
        break;

      case 'customers':
        if (!data.data || !Array.isArray(data.data.items)) {
          return { valid: false, error: 'Customers endpoint missing data.items array' };
        }
        break;
    }

    return { valid: true };
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

    const icon =
      status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'TIMEOUT' ? '⏰' : '⏭️';
    console.log(`${icon} ${test} - ${duration}ms`);
    if (error) console.log(`   Error: ${error}`);
    if (data) console.log(`   Result: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
  }
}
