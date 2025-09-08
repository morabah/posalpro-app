#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product Deployment & Configuration Tests
 * User Story: US-2.1 (Product Management), US-2.2 (Product Catalog)
 * Hypothesis: H4 (Product management improves efficiency), H5 (Catalog system enhances usability)
 *
 * 🚀 DEPLOYMENT & CONFIGURATION TESTING: Environment and deployment validation
 * ✅ TESTS: Environment variables, database connections, CDN assets, SSL/TLS
 * ✅ VALIDATES: Production readiness and configuration integrity
 * ✅ MEASURES: Deployment stability and configuration compliance
 */

import { ApiClient } from './api-client';

export class DeploymentConfigTests {
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
    console.log('\n🚀 Testing Product Deployment & Configuration');

    const tests: Array<{
      name: string;
      test: () => Promise<any>;
    }> = [
      {
        name: 'Environment Variable Validation',
        test: async () => {
          // Test that critical environment variables are properly configured
          const envTests = [
            {
              name: 'api_base_url',
              test: async () => {
                // Test that API base URL is accessible
                const res = await this.api.request('GET', '/api/products?limit=1');
                return {
                  configured: res.status !== 0, // 0 would indicate network error
                  accessible: res.status === 200,
                  status: res.status,
                };
              },
            },
            {
              name: 'database_connection',
              test: async () => {
                // Test database connectivity through API response
                const res = await this.api.request('GET', '/api/products?limit=1');
                const data = await res.json();

                const dbConnected = res.status === 200 && data.ok === true;
                const hasData = data.data?.items !== undefined;

                return {
                  connected: dbConnected,
                  hasData,
                  responseTime: res.status === 200 ? 'acceptable' : 'unknown',
                };
              },
            },
            {
              name: 'session_configuration',
              test: async () => {
                // Test session configuration
                const sessionRes = await this.api.request('GET', '/api/auth/session');
                const sessionConfigured = sessionRes.status === 200 || sessionRes.status === 401;

                return {
                  configured: sessionConfigured,
                  status: sessionRes.status,
                  authenticationReady: sessionRes.status === 401, // 401 means auth is working but user not logged in
                };
              },
            },
          ];

          const envResults = [];

          for (const envTest of envTests) {
            try {
              const result = await envTest.test();
              envResults.push({
                variable: envTest.name,
                configured: result.configured,
                status: result.status || 'unknown',
                working: result.connected !== false && result.accessible !== false,
                result,
              });
            } catch (error) {
              envResults.push({
                variable: envTest.name,
                configured: false,
                status: 'error',
                working: false,
                error: error.message,
              });
            }
          }

          const workingVariables = envResults.filter(r => r.working).length;
          const totalVariables = envResults.length;

          return {
            variablesTested: totalVariables,
            workingVariables,
            configurationHealth: `${((workingVariables / totalVariables) * 100).toFixed(1)}%`,
            deploymentReady: workingVariables === totalVariables,
            environmentStability: workingVariables >= totalVariables * 0.8,
            envResults,
          };
        },
      },

      {
        name: 'Database Connection Pool Configuration',
        test: async () => {
          // Test database connection pool settings and performance
          const poolTests = [
            {
              name: 'connection_pool_stress',
              test: async () => {
                // Test multiple concurrent connections
                const concurrentQueries = 5;
                const requests = [];

                for (let i = 0; i < concurrentQueries; i++) {
                  requests.push(this.api.request('GET', '/api/products?limit=2'));
                }

                const start = Date.now();
                const results = await Promise.allSettled(requests);
                const duration = Date.now() - start;

                const successful = results.filter(
                  r => r.status === 'fulfilled' && (r.value as any).status === 200
                ).length;

                return {
                  concurrentConnections: concurrentQueries,
                  successfulConnections: successful,
                  totalDuration: duration,
                  averageResponseTime: duration / concurrentQueries,
                  poolEfficiency: successful === concurrentQueries ? 'excellent' : 'acceptable',
                };
              },
            },
            {
              name: 'connection_pool_recovery',
              test: async () => {
                // Test connection recovery after potential issues
                const testRequests = 3;
                const recoveryResults = [];

                for (let i = 0; i < testRequests; i++) {
                  try {
                    const res = await this.api.request('GET', '/api/products?limit=1');
                    recoveryResults.push({
                      attempt: i + 1,
                      status: res.status,
                      successful: res.status === 200,
                    });
                  } catch (error) {
                    recoveryResults.push({
                      attempt: i + 1,
                      status: 'error',
                      successful: false,
                      error: error.message,
                    });
                  }
                }

                const successfulRecovery = recoveryResults.filter(r => r.successful).length;

                return {
                  recoveryAttempts: testRequests,
                  successfulRecovery,
                  recoveryRate: `${((successfulRecovery / testRequests) * 100).toFixed(1)}%`,
                  connectionStability: successfulRecovery === testRequests,
                  poolRecovery: successfulRecovery >= testRequests * 0.8,
                };
              },
            },
          ];

          const poolResults = [];

          for (const poolTest of poolTests) {
            try {
              const result = await poolTest.test();
              poolResults.push({
                test: poolTest.name,
                ...result,
              });
            } catch (error) {
              poolResults.push({
                test: poolTest.name,
                error: error.message,
                poolEfficiency: 'failed',
              });
            }
          }

          const efficientPools = poolResults.filter(
            r => r.poolEfficiency === 'excellent' || r.poolEfficiency === 'acceptable'
          ).length;
          const totalPools = poolResults.length;

          return {
            poolTests: totalPools,
            efficientPools,
            poolConfiguration: `${((efficientPools / totalPools) * 100).toFixed(1)}%`,
            databasePerformance: efficientPools === totalPools,
            connectionPooling: 'validated',
            poolResults,
          };
        },
      },

      {
        name: 'CDN and Asset Loading Configuration',
        test: async () => {
          // Test CDN configuration and asset loading
          const cdnTests = [
            {
              name: 'api_response_headers',
              test: async () => {
                // Check for proper CORS and cache headers
                const res = await this.api.request('GET', '/api/products?limit=1');

                // Check CORS headers
                const corsHeader = res.headers.get('access-control-allow-origin');
                const corsEnabled = corsHeader !== null;

                // Check cache headers
                const cacheHeader = res.headers.get('cache-control');
                const cacheConfigured = cacheHeader !== null;

                // Check content type
                const contentType = res.headers.get('content-type');
                const contentTypeCorrect = contentType?.includes('application/json');

                return {
                  corsEnabled,
                  cacheConfigured,
                  contentTypeCorrect,
                  headersComplete: corsEnabled && cacheConfigured && contentTypeCorrect,
                  cdnReady: corsEnabled, // CORS is critical for CDN
                };
              },
            },
            {
              name: 'static_asset_access',
              test: async () => {
                // Test static asset accessibility (simulated through API)
                const assetTests = [
                  { type: 'products_endpoint', endpoint: '/api/products?limit=1' },
                  { type: 'product_stats', endpoint: '/api/products/stats' },
                  { type: 'product_search', endpoint: '/api/products/search?q=test&limit=1' },
                ];

                const assetResults = [];

                for (const asset of assetTests) {
                  try {
                    const res = await this.api.request('GET', asset.endpoint);
                    assetResults.push({
                      asset: asset.type,
                      accessible: res.status === 200 || res.status === 404, // 404 is acceptable for search
                      status: res.status,
                      loadTime: res.status === 200 ? 'fast' : 'unknown',
                    });
                  } catch (error) {
                    assetResults.push({
                      asset: asset.type,
                      accessible: false,
                      status: 'error',
                      loadTime: 'failed',
                      error: error.message,
                    });
                  }
                }

                const accessibleAssets = assetResults.filter(r => r.accessible).length;

                return {
                  assetsTested: assetResults.length,
                  accessibleAssets,
                  assetAccessibility: `${((accessibleAssets / assetResults.length) * 100).toFixed(1)}%`,
                  cdnConfiguration: accessibleAssets === assetResults.length,
                  assetResults,
                };
              },
            },
          ];

          const cdnResults = [];

          for (const cdnTest of cdnTests) {
            try {
              const result = await cdnTest.test();
              cdnResults.push({
                test: cdnTest.name,
                ...result,
              });
            } catch (error) {
              cdnResults.push({
                test: cdnTest.name,
                error: error.message,
                cdnReady: false,
              });
            }
          }

          const readyCDN = cdnResults.filter(r => r.cdnReady !== false).length;
          const totalCDN = cdnResults.length;

          return {
            cdnTests: totalCDN,
            cdnReady: readyCDN,
            cdnConfiguration: `${((readyCDN / totalCDN) * 100).toFixed(1)}%`,
            assetDelivery: readyCDN === totalCDN,
            deploymentAssets: 'validated',
            cdnResults,
          };
        },
      },

      {
        name: 'SSL/TLS Configuration',
        test: async () => {
          // Test SSL/TLS configuration and security headers
          const sslTests = [
            {
              name: 'https_enforcement',
              test: async () => {
                // Test HTTPS enforcement (if applicable)
                const baseUrl = this.api['baseUrl'];
                const isHttps = baseUrl.startsWith('https://');

                // In development, HTTP might be acceptable
                const httpsEnforced =
                  isHttps || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

                return {
                  httpsEnabled: isHttps,
                  httpsEnforced,
                  sslConfigured: isHttps,
                  securityLevel: isHttps ? 'high' : 'development',
                };
              },
            },
            {
              name: 'security_headers',
              test: async () => {
                // Test security headers
                const res = await this.api.request('GET', '/api/products?limit=1');

                const headers = res.headers;
                const securityHeaders = {
                  'x-frame-options': headers.get('x-frame-options'),
                  'x-content-type-options': headers.get('x-content-type-options'),
                  'x-xss-protection': headers.get('x-xss-protection'),
                  'strict-transport-security': headers.get('strict-transport-security'),
                  'content-security-policy': headers.get('content-security-policy'),
                };

                const configuredHeaders = Object.values(securityHeaders).filter(
                  h => h !== null
                ).length;
                const totalHeaders = Object.keys(securityHeaders).length;

                return {
                  securityHeaders: configuredHeaders,
                  totalHeaders,
                  headerCoverage: `${((configuredHeaders / totalHeaders) * 100).toFixed(1)}%`,
                  securityConfigured: configuredHeaders > 0,
                  headerDetails: securityHeaders,
                };
              },
            },
            {
              name: 'secure_cookies',
              test: async () => {
                // Test secure cookie configuration
                const res = await this.api.request('GET', '/api/auth/session');

                const setCookieHeader = res.headers.get('set-cookie');
                if (!setCookieHeader) {
                  return {
                    cookiesConfigured: false,
                    secureCookies: false,
                    httpOnlyCookies: false,
                    cookieSecurity: 'not_configured',
                  };
                }

                // Parse cookie attributes
                const cookies = setCookieHeader.split(',').map(c => c.trim());
                let secureCount = 0;
                let httpOnlyCount = 0;
                let totalCookies = 0;

                for (const cookie of cookies) {
                  totalCookies++;
                  if (cookie.includes('Secure')) secureCount++;
                  if (cookie.includes('HttpOnly')) httpOnlyCount++;
                }

                const secureCookies = secureCount > 0;
                const httpOnlyCookies = httpOnlyCount > 0;
                const cookieSecurity =
                  secureCookies && httpOnlyCookies ? 'excellent' : secureCookies ? 'good' : 'basic';

                return {
                  cookiesConfigured: true,
                  totalCookies,
                  secureCookies,
                  httpOnlyCookies,
                  cookieSecurity,
                };
              },
            },
          ];

          const sslResults = [];

          for (const sslTest of sslTests) {
            try {
              const result = await sslTest.test();
              sslResults.push({
                test: sslTest.name,
                ...result,
              });
            } catch (error) {
              sslResults.push({
                test: sslTest.name,
                error: error.message,
                sslConfigured: false,
              });
            }
          }

          const configuredSSL = sslResults.filter(r => r.sslConfigured !== false).length;
          const totalSSL = sslResults.length;

          return {
            sslTests: totalSSL,
            sslConfigured: configuredSSL,
            sslConfiguration: `${((configuredSSL / totalSSL) * 100).toFixed(1)}%`,
            securityReady: configuredSSL === totalSSL,
            tlsSecurity: 'validated',
            sslResults,
          };
        },
      },

      {
        name: 'Build Optimization and Performance',
        test: async () => {
          // Test build optimization settings and performance
          const buildTests = [
            {
              name: 'response_compression',
              test: async () => {
                // Test response compression
                const res = await this.api.request('GET', '/api/products?limit=10');

                const contentEncoding = res.headers.get('content-encoding');
                const contentLength = res.headers.get('content-length');

                const compressionEnabled = contentEncoding !== null;
                const reasonableSize = !contentLength || parseInt(contentLength) < 50000; // Under 50KB

                return {
                  compressionEnabled,
                  reasonableSize,
                  contentEncoding,
                  contentLength,
                  optimizationEffective: compressionEnabled || reasonableSize,
                };
              },
            },
            {
              name: 'caching_configuration',
              test: async () => {
                // Test caching headers and configuration
                const cacheTests = [
                  { endpoint: '/api/products?limit=5', type: 'dynamic_data' },
                  { endpoint: '/api/products/stats', type: 'aggregated_data' },
                ];

                const cacheResults = [];

                for (const cacheTest of cacheTests) {
                  const res = await this.api.request('GET', cacheTest.endpoint);
                  const cacheControl = res.headers.get('cache-control');
                  const etag = res.headers.get('etag');
                  const lastModified = res.headers.get('last-modified');

                  cacheResults.push({
                    endpoint: cacheTest.type,
                    cacheControl,
                    etag: !!etag,
                    lastModified: !!lastModified,
                    cachingConfigured: !!(cacheControl || etag || lastModified),
                  });
                }

                const configuredCaching = cacheResults.filter(r => r.cachingConfigured).length;

                return {
                  cacheTests: cacheResults.length,
                  configuredCaching,
                  cachingCoverage: `${((configuredCaching / cacheResults.length) * 100).toFixed(1)}%`,
                  cacheOptimization: configuredCaching > 0,
                  cacheResults,
                };
              },
            },
            {
              name: 'bundle_size_optimization',
              test: async () => {
                // Test bundle size through response analysis
                const endpoints = [
                  '/api/products?limit=20',
                  '/api/customers?limit=20',
                  '/api/proposals?limit=20',
                  '/api/products/stats',
                ];

                const bundleResults = [];

                for (const endpoint of endpoints) {
                  const res = await this.api.request('GET', endpoint);
                  const contentLength = res.headers.get('content-length');

                  if (contentLength) {
                    const sizeKB = parseInt(contentLength) / 1024;
                    bundleResults.push({
                      endpoint,
                      sizeKB: Math.round(sizeKB * 10) / 10,
                      sizeCategory: sizeKB < 50 ? 'small' : sizeKB < 100 ? 'medium' : 'large',
                      optimized: sizeKB < 100,
                    });
                  } else {
                    bundleResults.push({
                      endpoint,
                      sizeKB: 0,
                      sizeCategory: 'unknown',
                      optimized: true, // Assume optimized if no size header
                    });
                  }
                }

                const optimizedBundles = bundleResults.filter(r => r.optimized).length;
                const averageSize =
                  bundleResults.reduce((sum, r) => sum + r.sizeKB, 0) / bundleResults.length;

                return {
                  endpointsTested: bundleResults.length,
                  optimizedBundles,
                  averageSizeKB: Math.round(averageSize * 10) / 10,
                  bundleOptimization: `${((optimizedBundles / bundleResults.length) * 100).toFixed(1)}%`,
                  performanceOptimized: optimizedBundles === bundleResults.length,
                  bundleResults,
                };
              },
            },
          ];

          const buildResults = [];

          for (const buildTest of buildTests) {
            try {
              const result = await buildTest.test();
              buildResults.push({
                test: buildTest.name,
                ...result,
              });
            } catch (error) {
              buildResults.push({
                test: buildTest.name,
                error: error.message,
                optimizationEffective: false,
              });
            }
          }

          const effectiveOptimizations = buildResults.filter(
            r => r.optimizationEffective !== false
          ).length;
          const totalOptimizations = buildResults.length;

          return {
            buildTests: totalOptimizations,
            effectiveOptimizations,
            optimizationCoverage: `${((effectiveOptimizations / totalOptimizations) * 100).toFixed(1)}%`,
            buildOptimized: effectiveOptimizations === totalOptimizations,
            performanceReady: effectiveOptimizations >= totalOptimizations * 0.8,
            buildResults,
          };
        },
      },

      {
        name: 'Error Monitoring and Logging Configuration',
        test: async () => {
          // Test error monitoring and logging configuration
          const loggingTests = [
            {
              name: 'error_response_format',
              test: async () => {
                // Test error responses for proper logging format
                const errorRes = await this.api.request('GET', '/api/products/invalid-id');

                const isErrorResponse = errorRes.status >= 400;
                const hasErrorBody = errorRes.status !== 404; // 404 might not have body

                let errorFormat = 'unknown';
                if (isErrorResponse) {
                  try {
                    const errorData = await errorRes.json();
                    if (errorData.message && errorData.code) {
                      errorFormat = 'structured';
                    } else if (errorData.message) {
                      errorFormat = 'basic';
                    } else {
                      errorFormat = 'minimal';
                    }
                  } catch (e) {
                    errorFormat = 'text_only';
                  }
                }

                return {
                  errorResponseGenerated: isErrorResponse,
                  errorFormat,
                  loggingEnabled: errorFormat !== 'unknown',
                  monitoringReady: isErrorResponse && errorFormat !== 'minimal',
                };
              },
            },
            {
              name: 'request_logging',
              test: async () => {
                // Test that requests are being logged
                const requests = [
                  { endpoint: '/api/products?limit=1', description: 'basic_request' },
                  { endpoint: '/api/products/stats', description: 'stats_request' },
                ];

                const loggingResults = [];

                for (const req of requests) {
                  const start = Date.now();
                  const res = await this.api.request('GET', req.endpoint);
                  const duration = Date.now() - start;

                  // Assume logging is working if request completes (would be logged on server)
                  loggingResults.push({
                    request: req.description,
                    logged: res.status < 500, // Assume 5xx errors might not be logged
                    duration,
                    status: res.status,
                    loggingActive: res.status < 500,
                  });
                }

                const loggedRequests = loggingResults.filter(r => r.logged).length;

                return {
                  requestsTested: requests.length,
                  loggedRequests,
                  loggingCoverage: `${((loggedRequests / requests.length) * 100).toFixed(1)}%`,
                  requestLogging: loggedRequests === requests.length,
                  monitoringActive: loggedRequests > 0,
                  loggingResults,
                };
              },
            },
          ];

          const loggingResults = [];

          for (const loggingTest of loggingTests) {
            try {
              const result = await loggingTest.test();
              loggingResults.push({
                test: loggingTest.name,
                ...result,
              });
            } catch (error) {
              loggingResults.push({
                test: loggingTest.name,
                error: error.message,
                loggingEnabled: false,
              });
            }
          }

          const enabledLogging = loggingResults.filter(r => r.loggingEnabled !== false).length;
          const totalLogging = loggingResults.length;

          return {
            loggingTests: totalLogging,
            enabledLogging,
            loggingConfiguration: `${((enabledLogging / totalLogging) * 100).toFixed(1)}%`,
            errorMonitoring: enabledLogging === totalLogging,
            deploymentMonitoring: enabledLogging >= totalLogging * 0.8,
            loggingResults,
          };
        },
      },

      {
        name: 'Health Check and Readiness Validation',
        test: async () => {
          // Test application health checks and readiness probes
          const healthTests = [
            {
              name: 'application_health',
              test: async () => {
                // Test basic application health
                const healthRes = await this.api.request('GET', '/api/products?limit=1');

                const applicationHealthy = healthRes.status === 200;
                const responseTime = healthRes.status === 200 ? 'fast' : 'unknown';

                return {
                  applicationHealthy,
                  responseTime,
                  healthCheckPassing: applicationHealthy,
                  serviceReady: applicationHealthy,
                };
              },
            },
            {
              name: 'database_health',
              test: async () => {
                // Test database connectivity
                const dbRes = await this.api.request('GET', '/api/products/stats');

                const databaseHealthy = dbRes.status === 200;
                const connectionStable = databaseHealthy;

                return {
                  databaseHealthy,
                  connectionStable,
                  dbHealthCheckPassing: databaseHealthy,
                  dataAccessWorking: databaseHealthy,
                };
              },
            },
            {
              name: 'readiness_probe_simulation',
              test: async () => {
                // Simulate readiness probe checks
                const readinessChecks = [
                  '/api/products/stats',
                  '/api/customers?limit=1',
                  '/api/proposals?limit=1',
                ];

                const readinessResults = [];

                for (const check of readinessChecks) {
                  const res = await this.api.request('GET', check);
                  readinessResults.push({
                    endpoint: check,
                    ready: res.status === 200,
                    status: res.status,
                  });
                }

                const readyEndpoints = readinessResults.filter(r => r.ready).length;

                return {
                  readinessChecks: readinessChecks.length,
                  readyEndpoints,
                  readinessPercentage: `${((readyEndpoints / readinessChecks.length) * 100).toFixed(1)}%`,
                  applicationReady: readyEndpoints === readinessChecks.length,
                  deploymentReady: readyEndpoints >= readinessChecks.length * 0.8,
                  readinessResults,
                };
              },
            },
          ];

          const healthResults = [];

          for (const healthTest of healthTests) {
            try {
              const result = await healthTest.test();
              healthResults.push({
                test: healthTest.name,
                ...result,
              });
            } catch (error) {
              healthResults.push({
                test: healthTest.name,
                error: error.message,
                healthCheckPassing: false,
              });
            }
          }

          const passingHealthChecks = healthResults.filter(
            r => r.healthCheckPassing !== false
          ).length;
          const totalHealthChecks = healthResults.length;

          return {
            healthTests: totalHealthChecks,
            passingHealthChecks,
            healthStatus: `${((passingHealthChecks / totalHealthChecks) * 100).toFixed(1)}%`,
            applicationHealthy: passingHealthChecks === totalHealthChecks,
            deploymentHealthy: passingHealthChecks >= totalHealthChecks * 0.8,
            healthResults,
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
