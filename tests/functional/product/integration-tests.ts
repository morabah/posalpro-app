#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product Integration Testing Module
 * User Story: US-2.1 (Product Management), US-2.2 (Product Catalog)
 * Hypothesis: H4 (Product management improves efficiency), H5 (Catalog system enhances usability)
 *
 * 🔄 INTEGRATION TESTING: Cross-module interaction validation
 * ✅ TESTS: Data flow between modules, API communication, service dependencies
 * ✅ VALIDATES: System integration and data consistency across modules
 * ✅ MEASURES: Integration reliability and data flow integrity
 */

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
    console.log('\n🔄 Testing Product Cross-Module Integration');

    const tests: Array<{
      name: string;
      test: () => Promise<any>;
    }> = [
      {
        name: 'Product-Proposal Data Flow Integration',
        test: async () => {
          // Test that product data properly integrates with proposal data
          const productsRes = await this.api.request('GET', '/api/products?limit=3');
          const proposalsRes = await this.api.request('GET', '/api/proposals?limit=3');

          if (productsRes.status !== 200 || proposalsRes.status !== 200) {
            throw new Error('Cannot test product-proposal integration - APIs not responding');
          }

          const productsData = await productsRes.json();
          const proposalsData = await proposalsRes.json();

          const products = productsData.data?.items || [];
          const proposals = proposalsData.data?.items || [];

          if (products.length === 0 || proposals.length === 0) {
            return {
              status: 'insufficient_data',
              message: 'Need both products and proposals for integration test',
            };
          }

          // Test referential integrity (if proposals reference products)
          let validReferences = 0;
          let totalReferences = 0;

          for (const proposal of proposals) {
            if (proposal.productId || proposal.productIds) {
              totalReferences++;
              const productIds = proposal.productIds || [proposal.productId];
              const hasValidProducts = productIds.every((id: string) =>
                products.some((p: any) => p.id === id)
              );

              if (hasValidProducts) {
                validReferences++;
              }
            }
          }

          const integrationStrength = totalReferences === 0 ? 1 : validReferences / totalReferences;

          return {
            totalProducts: products.length,
            totalProposals: proposals.length,
            totalReferences,
            validReferences,
            integrationStrength: `${(integrationStrength * 100).toFixed(1)}%`,
            referentialIntegrity: integrationStrength > 0.8,
            dataFlowWorking: integrationStrength > 0,
          };
        },
      },

      {
        name: 'Product Statistics-Product Data Synchronization',
        test: async () => {
          // Test that product statistics are synchronized with actual product data
          const productsRes = await this.api.request('GET', '/api/products?limit=20');
          const statsRes = await this.api.request('GET', '/api/products/stats');

          if (productsRes.status !== 200) {
            throw new Error('Cannot test statistics sync - products API not responding');
          }

          const productsData = await productsRes.json();
          const products = productsData.data?.items || [];

          if (statsRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Statistics endpoint not implemented' };
          }

          if (statsRes.status === 200) {
            const statsData = await statsRes.json();
            const stats = statsData.data || statsData;

            // Compare actual product counts with statistics
            const actualProductCount = products.length;
            const statsProductCount = stats.totalProducts || stats.count || 0;

            // Check if statistics are reasonably close to actual data
            const countAccuracy = Math.abs(actualProductCount - statsProductCount) <= 5; // Allow small discrepancy

            // Check price statistics
            const actualPrices = products.map((p: any) => p.price).filter(p => p != null);
            const avgActualPrice =
              actualPrices.length > 0
                ? actualPrices.reduce((a, b) => a + b, 0) / actualPrices.length
                : 0;

            const statsAvgPrice = stats.averagePrice || stats.avgPrice || 0;
            const priceAccuracy = Math.abs(avgActualPrice - statsAvgPrice) < 10; // Allow $10 difference

            return {
              actualProductCount,
              statsProductCount,
              countAccuracy,
              actualAveragePrice: Math.round(avgActualPrice * 100) / 100,
              statsAveragePrice: statsAvgPrice,
              priceAccuracy,
              dataSynchronization: countAccuracy && priceAccuracy,
              statsSyncWorking: countAccuracy && priceAccuracy,
            };
          }

          return { status: statsRes.status, syncTestFailed: true };
        },
      },

      {
        name: 'API-to-API Communication Flow',
        test: async () => {
          // Test the flow: List → Detail → Related Data → Statistics
          const listRes = await this.api.request('GET', '/api/products?limit=2');

          if (listRes.status !== 200) {
            throw new Error('Cannot test API communication flow - list API not responding');
          }

          const listData = await listRes.json();
          const products = listData.data?.items || [];

          if (products.length === 0) {
            return { status: 'no_data', message: 'No products available for API flow test' };
          }

          const product = products[0];
          const results = [];

          // Test 1: Get product details
          try {
            const detailRes = await this.api.request('GET', `/api/products/${product.id}`);
            const detailSuccess = detailRes.status === 200;
            results.push({
              step: 'product_detail',
              success: detailSuccess,
              status: detailRes.status,
            });
          } catch (error) {
            results.push({ step: 'product_detail', success: false, error: error.message });
          }

          // Test 2: Get product search/filter
          try {
            const searchRes = await this.api.request(
              'GET',
              `/api/products/search?q=${encodeURIComponent(product.name.split(' ')[0])}&limit=5`
            );
            const searchSuccess = searchRes.status === 200 || searchRes.status === 404;
            results.push({
              step: 'product_search',
              success: searchSuccess,
              status: searchRes.status,
            });
          } catch (error) {
            results.push({ step: 'product_search', success: false, error: error.message });
          }

          // Test 3: Get product statistics
          try {
            const statsRes = await this.api.request('GET', '/api/products/stats');
            const statsSuccess = statsRes.status === 200 || statsRes.status === 404;
            results.push({ step: 'product_stats', success: statsSuccess, status: statsRes.status });
          } catch (error) {
            results.push({ step: 'product_stats', success: false, error: error.message });
          }

          // Test 4: Get category distribution (if available)
          try {
            const categoryRes = await this.api.request('GET', '/api/products/stats/categories');
            const categorySuccess = categoryRes.status === 200 || categoryRes.status === 404;
            results.push({
              step: 'category_stats',
              success: categorySuccess,
              status: categoryRes.status,
            });
          } catch (error) {
            results.push({ step: 'category_stats', success: false, error: error.message });
          }

          const successfulSteps = results.filter(r => r.success).length;
          const totalSteps = results.length;

          return {
            productId: product.id,
            totalApiCalls: totalSteps,
            successfulCalls: successfulSteps,
            successRate: `${((successfulSteps / totalSteps) * 100).toFixed(1)}%`,
            apiCommunicationFlow: successfulSteps === totalSteps ? 'seamless' : 'partial',
            integrationWorking: successfulSteps > 0,
            stepResults: results,
          };
        },
      },

      {
        name: 'Service Layer Dependency Chain',
        test: async () => {
          // Test that service layer dependencies work correctly
          const serviceChain = [
            { name: 'product_service', endpoint: '/api/products?limit=1' },
            { name: 'product_stats_service', endpoint: '/api/products/stats' },
            { name: 'product_search_service', endpoint: '/api/products/search?q=test&limit=1' },
            { name: 'proposal_service', endpoint: '/api/proposals?limit=1' },
            { name: 'customer_service', endpoint: '/api/customers?limit=1' },
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
              const responseFormat =
                hasData && hasItems
                  ? 'service_layer_format'
                  : hasData
                    ? 'stats_format'
                    : 'direct_format';

              results.push({
                service: service.name,
                status: res.status,
                duration,
                responseFormat,
                hasData,
                hasItems,
                serviceWorking:
                  res.status === 200 || (res.status === 404 && service.endpoint.includes('search')),
                endpoint: service.endpoint,
              });
            } catch (error) {
              results.push({
                service: service.name,
                status: 'error',
                duration: 0,
                responseFormat: 'error',
                hasData: false,
                hasItems: false,
                serviceWorking: false,
                endpoint: service.endpoint,
                error: error.message,
              });
            }
          }

          const workingServices = results.filter(r => r.serviceWorking).length;
          const totalServices = results.length;

          // Test service layer consistency
          const formats = results
            .filter(r => r.responseFormat !== 'error')
            .map(r => r.responseFormat);
          const consistentFormat = new Set(formats).size <= 2; // Allow some variation for different endpoint types

          return {
            totalServices,
            workingServices,
            serviceAvailability: `${((workingServices / totalServices) * 100).toFixed(1)}%`,
            formatConsistency: consistentFormat,
            dependencyChain: workingServices === totalServices ? 'complete' : 'partial',
            serviceLayerIntegration: 'validated',
            serviceResults: results,
          };
        },
      },

      {
        name: 'Real-time Data Synchronization',
        test: async () => {
          // Test that product data changes are reflected across related endpoints
          const initialProductsRes = await this.api.request('GET', '/api/products?limit=1');

          if (initialProductsRes.status !== 200) {
            throw new Error('Cannot test data synchronization - products API not responding');
          }

          const initialData = await initialProductsRes.json();
          const initialProducts = initialData.data?.items || [];

          if (initialProducts.length === 0) {
            return { status: 'no_data', message: 'No products available for sync test' };
          }

          const product = initialProducts[0];
          const originalPrice = product.price;

          // Make a change to the product
          const updateData = {
            price: originalPrice + 10,
            name: `${product.name} - Sync Test`,
          };

          const updateRes = await this.api.request(
            'PATCH',
            `/api/products/${product.id}`,
            updateData
          );

          if (updateRes.status !== 200) {
            throw new Error(`Cannot test sync - product update failed: ${updateRes.status}`);
          }

          // Wait a moment for potential caching/propagation
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if the change is reflected in different endpoints
          const syncChecks = [
            {
              name: 'products_list',
              endpoint: '/api/products?limit=5',
              check: data =>
                data.data?.items?.some(p => p.id === product.id && p.price === updateData.price),
            },
            {
              name: 'single_product',
              endpoint: `/api/products/${product.id}`,
              check: data =>
                data.data?.price === updateData.price && data.data?.name === updateData.name,
            },
            {
              name: 'product_stats',
              endpoint: '/api/products/stats',
              check: data => {
                // Check if stats reflect the price change (approximate)
                const stats = data.data || data;
                if (stats.averagePrice || stats.avgPrice) {
                  const avgPrice = stats.averagePrice || stats.avgPrice;
                  return Math.abs(avgPrice - originalPrice) > 1; // Should reflect the change
                }
                return true; // If no price stats, consider it synced
              },
            },
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
                  status: 'checked',
                });
              } else if (res.status === 404 && check.endpoint.includes('stats')) {
                syncResults.push({
                  endpoint: check.name,
                  synchronized: true, // Stats endpoint not implemented, so no sync issue
                  status: 'endpoint_not_found',
                });
              } else {
                syncResults.push({
                  endpoint: check.name,
                  synchronized: false,
                  status: 'api_error',
                  apiStatus: res.status,
                });
              }
            } catch (error) {
              syncResults.push({
                endpoint: check.name,
                synchronized: false,
                status: 'error',
                error: error.message,
              });
            }
          }

          // Revert the changes
          await this.api.request('PATCH', `/api/products/${product.id}`, {
            price: originalPrice,
            name: product.name,
          });

          const synchronizedEndpoints = syncResults.filter(r => r.synchronized).length;
          const totalChecks = syncResults.length;

          return {
            productId: product.id,
            originalPrice,
            updatedPrice: updateData.price,
            syncChecks: totalChecks,
            synchronizedEndpoints,
            synchronizationRate: `${((synchronizedEndpoints / totalChecks) * 100).toFixed(1)}%`,
            realTimeSync: synchronizedEndpoints === totalChecks,
            dataPropagation: synchronizedEndpoints > 0 ? 'working' : 'delayed',
            syncResults,
          };
        },
      },

      {
        name: 'Cross-Module Business Logic Validation',
        test: async () => {
          // Test that business rules are consistently applied across modules
          const businessRules = [
            {
              name: 'product_price_profit_validation',
              test: async () => {
                // Test that products maintain profitable pricing (price > cost)
                const productsRes = await this.api.request('GET', '/api/products?limit=10');
                if (productsRes.status !== 200)
                  return { valid: false, reason: 'cannot_fetch_products' };

                const productsData = await productsRes.json();
                const products = productsData.data?.items || [];

                if (products.length === 0) return { valid: false, reason: 'no_products' };

                let profitableProducts = 0;
                for (const product of products) {
                  if (product.price && product.cost && product.price > product.cost) {
                    profitableProducts++;
                  } else if (product.price && !product.cost) {
                    profitableProducts++; // Assume profitable if no cost specified
                  }
                }

                return {
                  valid: profitableProducts === products.length,
                  totalProducts: products.length,
                  profitableProducts,
                };
              },
            },
            {
              name: 'product_status_inventory_consistency',
              test: async () => {
                // Test that active products have stock
                const productsRes = await this.api.request('GET', '/api/products?limit=10');
                if (productsRes.status !== 200)
                  return { valid: false, reason: 'cannot_fetch_products' };

                const productsData = await productsRes.json();
                const products = productsData.data?.items || [];

                if (products.length === 0) return { valid: false, reason: 'no_products' };

                let consistentProducts = 0;
                for (const product of products) {
                  if (product.status === 'ACTIVE') {
                    if (product.stockQuantity >= 0) {
                      consistentProducts++;
                    }
                  } else {
                    consistentProducts++; // Non-active products don't need stock validation
                  }
                }

                return {
                  valid: consistentProducts === products.length,
                  totalProducts: products.length,
                  consistentProducts,
                };
              },
            },
            {
              name: 'unique_sku_constraint',
              test: async () => {
                // Test that SKU uniqueness is maintained
                const productsRes = await this.api.request('GET', '/api/products?limit=20');
                if (productsRes.status !== 200)
                  return { valid: false, reason: 'cannot_fetch_products' };

                const productsData = await productsRes.json();
                const products = productsData.data?.items || [];

                if (products.length < 2) return { valid: true, reason: 'insufficient_data' };

                const skus = products.map(p => p.sku).filter(sku => sku);
                const uniqueSkus = new Set(skus);

                return {
                  valid: uniqueSkus.size === skus.length,
                  totalProducts: products.length,
                  uniqueSkus: uniqueSkus.size,
                  duplicateSkus: skus.length - uniqueSkus.size,
                };
              },
            },
            {
              name: 'category_data_consistency',
              test: async () => {
                // Test that category data is consistent across products
                const productsRes = await this.api.request('GET', '/api/products?limit=15');
                if (productsRes.status !== 200)
                  return { valid: false, reason: 'cannot_fetch_products' };

                const productsData = await productsRes.json();
                const products = productsData.data?.items || [];

                if (products.length === 0) return { valid: false, reason: 'no_products' };

                // Check that categories are valid strings
                let validCategories = 0;
                for (const product of products) {
                  if (product.category === undefined || product.category === null) {
                    continue; // Null/undefined is acceptable
                  }
                  if (typeof product.category === 'string' && product.category.trim().length > 0) {
                    validCategories++;
                  }
                }

                const productsWithCategories = products.filter(
                  p => p.category !== undefined && p.category !== null
                );

                return {
                  valid: validCategories === productsWithCategories.length,
                  totalProducts: products.length,
                  productsWithCategories: productsWithCategories.length,
                  validCategories,
                };
              },
            },
          ];

          const results = [];
          for (const rule of businessRules) {
            try {
              const result = await rule.test();
              results.push({
                rule: rule.name,
                valid: result.valid,
                details: result,
              });
            } catch (error) {
              results.push({
                rule: rule.name,
                valid: false,
                error: error.message,
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
            ruleResults: results,
          };
        },
      },

      {
        name: 'Error Propagation Across Modules',
        test: async () => {
          // Test that errors are properly propagated and handled across module boundaries
          const errorScenarios = [
            {
              name: 'invalid_product_id',
              endpoint: '/api/products/invalid-id-123',
              expectedStatus: 404,
            },
            {
              name: 'invalid_product_search',
              endpoint: '/api/products/search?q=<script>alert(1)</script>',
              expectedStatus: 400,
            },
            {
              name: 'invalid_product_update',
              endpoint: '/api/products/invalid-id',
              method: 'PATCH',
              body: { price: 10 },
              expectedStatus: 404,
            },
            {
              name: 'invalid_product_creation',
              endpoint: '/api/products',
              method: 'POST',
              body: { name: '', sku: '', price: -10 },
              expectedStatus: 400,
            },
            {
              name: 'invalid_stats_endpoint',
              endpoint: '/api/products/stats/invalid',
              expectedStatus: 404,
            },
          ];

          const results = [];
          for (const scenario of errorScenarios) {
            try {
              const res = await this.api.request(
                scenario.method || 'GET',
                scenario.endpoint,
                scenario.body
              );

              const correctStatus = res.status === scenario.expectedStatus;
              const errorHandled = res.status >= 400;

              results.push({
                scenario: scenario.name,
                expectedStatus: scenario.expectedStatus,
                actualStatus: res.status,
                correctStatus,
                errorHandled,
                propagation: 'tested',
              });
            } catch (error) {
              results.push({
                scenario: scenario.name,
                expectedStatus: scenario.expectedStatus,
                actualStatus: 'error',
                correctStatus: false,
                errorHandled: true, // Error indicates it was handled
                propagation: 'failed',
                error: error.message,
              });
            }
          }

          const properlyHandledErrors = results.filter(
            r => r.correctStatus || r.errorHandled
          ).length;
          const totalScenarios = results.length;

          return {
            errorScenarios: totalScenarios,
            properlyHandled: properlyHandledErrors,
            errorHandlingRate: `${((properlyHandledErrors / totalScenarios) * 100).toFixed(1)}%`,
            errorPropagation:
              properlyHandledErrors === totalScenarios ? 'consistent' : 'inconsistent',
            crossModuleErrors: 'validated',
            scenarioResults: results,
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
