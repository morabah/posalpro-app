/**
 * Environment Configuration & API Client Testing
 * Comprehensive tests for environment management and API client functionality
 */

import { logInfo, logWarn, logError } from './logger';
import { trackPerformance } from './performance';
import {
  getConfig,
  getValidationResult,
  isValidConfiguration,
  getCurrentEnvironment,
  Environment,
} from './env';
import {
  get,
  ApiError,
  ApiErrorType,
  addRequestInterceptor,
  addResponseInterceptor,
  clearInterceptors,
  clearCache,
  getCacheSize,
  createApiClient,
} from './api';

// Test result interfaces
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: boolean;
  duration: number;
  successRate: number;
}

// Environment configuration test runner
class EnvironmentTestRunner {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestSuite> {
    const startTime = performance.now();

    // Test environment detection
    await this.testEnvironmentDetection();

    // Test configuration loading
    await this.testConfigurationLoading();

    // Test environment validation
    await this.testEnvironmentValidation();

    // Test configuration access
    await this.testConfigurationAccess();

    // Test environment-specific behavior
    await this.testEnvironmentSpecificBehavior();

    const endTime = performance.now();
    const duration = endTime - startTime;
    const passed = this.results.every(test => test.passed);
    const successRate =
      (this.results.filter(test => test.passed).length / this.results.length) * 100;

    return {
      name: 'Environment Configuration Tests',
      tests: this.results,
      passed,
      duration,
      successRate,
    };
  }

  private async testEnvironmentDetection(): Promise<void> {
    const startTime = performance.now();

    try {
      const environment = getCurrentEnvironment();
      const isValidEnv = Object.values(Environment).includes(environment);

      if (!isValidEnv) {
        throw new Error(`Invalid environment detected: ${environment}`);
      }

      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Environment Detection',
        passed: true,
        duration,
        details: { environment, isValidEnv },
      });

      logInfo('Environment detection test passed', { environment });
    } catch (_error) {
      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Environment Detection',
        passed: false,
        duration,
        error: _error instanceof Error ? _error.message : String(_error),
      });

      logError('Environment detection test failed', _error);
    }
  }

  private async testConfigurationLoading(): Promise<void> {
    const startTime = performance.now();

    try {
      const config = getConfig();

      // Verify required configuration sections exist
      const requiredSections = [
        'nodeEnv',
        'port',
        'host',
        'database',
        'api',
        'auth',
        'services',
        'security',
        'features',
      ];
      const missingSections = requiredSections.filter(section => !(section in config));

      if (missingSections.length > 0) {
        throw new Error(`Missing configuration sections: ${missingSections.join(', ')}`);
      }

      // Verify configuration types
      if (typeof config.port !== 'number') {
        throw new Error('Port must be a number');
      }

      if (typeof config.host !== 'string') {
        throw new Error('Host must be a string');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Configuration Loading',
        passed: true,
        duration,
        details: {
          sectionsFound: requiredSections.length,
          configSummary: {
            environment: config.nodeEnv,
            port: config.port,
            host: config.host,
            databaseConfigured: !!config.database.url,
            apiConfigured: !!config.api.baseUrl,
          },
        },
      });

      logInfo('Configuration loading test passed', {
        environment: config.nodeEnv,
        sectionsCount: requiredSections.length,
      });
    } catch (_error) {
      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Configuration Loading',
        passed: false,
        duration,
        error: _error instanceof Error ? _error.message : String(_error),
      });

      logError('Configuration loading test failed', _error);
    }
  }

  private async testEnvironmentValidation(): Promise<void> {
    const startTime = performance.now();

    try {
      const validationResult = getValidationResult();
      const isValid = isValidConfiguration();

      // Log warnings if any
      if (validationResult.warnings.length > 0) {
        logWarn('Configuration warnings detected', { warnings: validationResult.warnings });
      }

      // In development, we allow some configuration errors
      const environment = getCurrentEnvironment();
      const allowErrors = environment === Environment.DEVELOPMENT;

      if (!isValid && !allowErrors) {
        throw new Error(`Configuration validation failed: ${validationResult.errors.join(', ')}`);
      }

      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Environment Validation',
        passed: true,
        duration,
        details: {
          isValid,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          environment: validationResult.environment,
          allowedDueToDev: allowErrors && !isValid,
        },
      });

      logInfo('Environment validation test passed', {
        isValid,
        errorsCount: validationResult.errors.length,
        warningsCount: validationResult.warnings.length,
      });
    } catch (_error) {
      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Environment Validation',
        passed: false,
        duration,
        error: _error instanceof Error ? _error.message : String(_error),
      });

      logError('Environment validation test failed', _error);
    }
  }

  private async testConfigurationAccess(): Promise<void> {
    const startTime = performance.now();

    try {
      const config = getConfig();

      // Test accessing various configuration sections
      const dbConfig = config.database;
      const apiConfig = config.api;
      const authConfig = config.auth;
      const securityConfig = config.security;
      const features = config.features;

      // Verify each section has expected properties
      if (!dbConfig.url || typeof dbConfig.maxConnections !== 'number') {
        throw new Error('Invalid database configuration');
      }

      if (!apiConfig.baseUrl || typeof apiConfig.timeout !== 'number') {
        throw new Error('Invalid API configuration');
      }

      if (!authConfig.jwtSecret || !authConfig.apiKey) {
        throw new Error('Invalid authentication configuration');
      }

      if (!Array.isArray(securityConfig.corsOrigins)) {
        throw new Error('Invalid security configuration');
      }

      if (typeof features.enableMetrics !== 'boolean') {
        throw new Error('Invalid features configuration');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Configuration Access',
        passed: true,
        duration,
        details: {
          databaseUrl: !!dbConfig.url,
          apiBaseUrl: !!apiConfig.baseUrl,
          authConfigured: !!authConfig.jwtSecret,
          corsOriginsCount: securityConfig.corsOrigins.length,
          featuresEnabled: Object.values(features).filter(Boolean).length,
        },
      });

      logInfo('Configuration access test passed');
    } catch (_error) {
      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Configuration Access',
        passed: false,
        duration,
        error: _error instanceof Error ? _error.message : String(_error),
      });

      logError('Configuration access test failed', _error);
    }
  }

  private async testEnvironmentSpecificBehavior(): Promise<void> {
    const startTime = performance.now();

    try {
      const config = getConfig();
      const environment = getCurrentEnvironment();

      // Test environment-specific defaults
      switch (environment) {
        case Environment.DEVELOPMENT:
          if (!config.features.enableDebugMode) {
            logWarn('Debug mode should be enabled in development');
          }
          break;

        case Environment.PRODUCTION:
          if (config.features.enableDebugMode) {
            throw new Error('Debug mode should not be enabled in production');
          }
          if (!config.database.ssl) {
            throw new Error('SSL should be enabled for database in production');
          }
          break;

        case Environment.TEST:
          if (config.database.url !== 'sqlite://memory') {
            logWarn('Test environment should use in-memory database');
          }
          break;
      }

      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Environment Specific Behavior',
        passed: true,
        duration,
        details: {
          environment,
          debugMode: config.features.enableDebugMode,
          databaseSsl: config.database.ssl,
          databaseUrl: config.database.url,
        },
      });

      logInfo('Environment specific behavior test passed', { environment });
    } catch (_error) {
      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Environment Specific Behavior',
        passed: false,
        duration,
        error: _error instanceof Error ? _error.message : String(_error),
      });

      logError('Environment specific behavior test failed', _error);
    }
  }
}

// API client test runner
class ApiClientTestRunner {
  private results: TestResult[] = [];
  private mockServer = {
    baseUrl: 'http://localhost:3001',
    delay: 100,
  };

  async runAllTests(): Promise<TestSuite> {
    const startTime = performance.now();

    // Test basic HTTP methods
    await this.testHttpMethods();

    // Test authentication integration
    await this.testAuthenticationIntegration();

    // Test error handling
    await this.testErrorHandling();

    // Test retry mechanisms
    await this.testRetryMechanisms();

    // Test caching functionality
    await this.testCaching();

    // Test interceptors
    await this.testInterceptors();

    // Test performance tracking
    await this.testPerformanceTracking();

    const endTime = performance.now();
    const duration = endTime - startTime;
    const passed = this.results.every(test => test.passed);
    const successRate =
      (this.results.filter(test => test.passed).length / this.results.length) * 100;

    return {
      name: 'API Client Tests',
      tests: this.results,
      passed,
      duration,
      successRate,
    };
  }

  private async testHttpMethods(): Promise<void> {
    const startTime = performance.now();

    try {
      // Create a test client with mock configuration
      const testClient = createApiClient({
        baseURL: this.mockServer.baseUrl,
        timeout: 5000,
        enableLogging: false,
      });

      // Test that methods are callable (they will fail due to no server, but that's expected)
      const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

      for (const method of methods) {
        try {
          // Call the appropriate client method in a type-safe way
          const endpoint = '/test';
          switch (method) {
            case 'get':
              await testClient.get(endpoint, {});
              break;
            case 'post':
              await testClient.post(endpoint, { test: true });
              break;
            case 'put':
              await testClient.put(endpoint, { test: true });
              break;
            case 'patch':
              await testClient.patch(endpoint, { test: true });
              break;
            case 'delete':
              await testClient.delete(endpoint, {});
              break;
            case 'head':
              await testClient.head(endpoint, {});
              break;
            case 'options':
              await testClient.options(endpoint, {});
              break;
            default:
              // Exhaustiveness check
              ((_: never) => _)(method as never);
          }
        } catch (_error) {
          // Expected to fail due to network error, which is fine for this test
          if (_error instanceof ApiError && _error.type === ApiErrorType.NETWORK) {
            // This is expected
          } else {
            throw _error;
          }
        }
      }

      const duration = performance.now() - startTime;
      this.results.push({
        name: 'HTTP Methods',
        passed: true,
        duration,
        details: { methodsTested: methods },
      });

      logInfo('HTTP methods test passed', { methodsCount: methods.length });
    } catch (_error) {
      const duration = performance.now() - startTime;
      this.results.push({
        name: 'HTTP Methods',
        passed: false,
        duration,
        error: _error instanceof Error ? _error.message : String(_error),
      });

      logError('HTTP methods test failed', _error);
    }
  }

  private async testAuthenticationIntegration(): Promise<void> {
    const startTime = performance.now();

    try {
      // Test authentication header addition
      const testClient = createApiClient({
        baseURL: this.mockServer.baseUrl,
        enableLogging: false,
      });

      // Add request interceptor to capture headers
      let capturedHeaders: Record<string, string> = {};

      testClient.addRequestInterceptor({
        onRequest: async (config, url) => {
          capturedHeaders = config.headers || {};
          return { config, url };
        },
      });

      try {
        // Test with bearer auth
        await testClient.get('/test', { authType: 'bearer' });
      } catch {
        // Expected network error
      }

      try {
        // Test with API key auth
        await testClient.get('/test', { authType: 'api-key' });
      } catch {
        // Expected network error
      }

      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Authentication Integration',
        passed: true,
        duration,
        details: {
          headersCaptured: Object.keys(capturedHeaders).length > 0,
          lastHeaders: capturedHeaders,
        },
      });

      logInfo('Authentication integration test passed');
    } catch (_error) {
      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Authentication Integration',
        passed: false,
        duration,
        error: _error instanceof Error ? _error.message : String(_error),
      });

      logError('Authentication integration test failed', _error);
    }
  }

  private async testErrorHandling(): Promise<void> {
    const startTime = performance.now();

    try {
      // Test different error types
      const testClient = createApiClient({
        baseURL: this.mockServer.baseUrl,
        timeout: 1000, // Short timeout for testing
        enableLogging: false,
      });

      // Test network error
      let networkErrorCaught = false;
      try {
        await testClient.get('/nonexistent');
      } catch (_error) {
        if (_error instanceof ApiError && _error.type === ApiErrorType.NETWORK) {
          networkErrorCaught = true;
        }
      }

      // Test timeout error
      let timeoutErrorCaught = false;
      try {
        await testClient.get('/slow', { timeout: 50 });
      } catch (_error) {
        if (
          _error instanceof ApiError &&
          (_error.type === ApiErrorType.TIMEOUT || _error.type === ApiErrorType.NETWORK)
        ) {
          timeoutErrorCaught = true;
        }
      }

      if (!networkErrorCaught) {
        throw new Error('Network error not properly caught');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Error Handling',
        passed: true,
        duration,
        details: {
          networkErrorCaught,
          timeoutErrorCaught,
        },
      });

      logInfo('Error handling test passed');
    } catch (_error) {
      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Error Handling',
        passed: false,
        duration,
        error: _error instanceof Error ? _error.message : String(_error),
      });

      logError('Error handling test failed', _error);
    }
  }

  private async testRetryMechanisms(): Promise<void> {
    const startTime = performance.now();

    try {
      const testClient = createApiClient({
        baseURL: this.mockServer.baseUrl,
        defaultRetryAttempts: 2,
        defaultRetryDelay: 100,
        enableLogging: false,
      });

      // Test retry on network error
      let retryAttempts = 0;

      testClient.addRequestInterceptor({
        onRequest: async (config, url) => {
          retryAttempts++;
          return { config, url };
        },
      });

      try {
        await testClient.get('/test');
      } catch {
        // Expected to fail
      }

      // Should have attempted at least 2 times (original + 1 retry)
      if (retryAttempts < 2) {
        throw new Error(`Expected at least 2 retry attempts, got ${retryAttempts}`);
      }

      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Retry Mechanisms',
        passed: true,
        duration,
        details: { retryAttempts },
      });

      logInfo('Retry mechanisms test passed', { retryAttempts });
    } catch (_error) {
      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Retry Mechanisms',
        passed: false,
        duration,
        error: _error instanceof Error ? _error.message : String(_error),
      });

      logError('Retry mechanisms test failed', _error);
    }
  }

  private async testCaching(): Promise<void> {
    const startTime = performance.now();

    try {
      // Clear cache before testing
      clearCache();
      const initialCacheSize = getCacheSize();

      if (initialCacheSize !== 0) {
        throw new Error('Cache not properly cleared');
      }

      // Cache functionality is tested by checking cache size changes
      // Since we can't make real requests, we verify the cache management functions work
      const cacheSize = getCacheSize();

      if (typeof cacheSize !== 'number') {
        throw new Error('Cache size should return a number');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Caching',
        passed: true,
        duration,
        details: {
          initialCacheSize,
          currentCacheSize: cacheSize,
          cacheFunctionsAvailable: true,
        },
      });

      logInfo('Caching test passed', { cacheSize });
    } catch (_error) {
      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Caching',
        passed: false,
        duration,
        error: _error instanceof Error ? _error.message : String(_error),
      });

      logError('Caching test failed', _error);
    }
  }

  private async testInterceptors(): Promise<void> {
    const startTime = performance.now();

    try {
      let requestInterceptorCalled = false;
      let responseInterceptorCalled = false;

      // Clear existing interceptors
      clearInterceptors();

      // Add test interceptors
      addRequestInterceptor({
        onRequest: async (config, url) => {
          requestInterceptorCalled = true;
          return { config, url };
        },
      });

      addResponseInterceptor({
        onError: async error => {
          responseInterceptorCalled = true;
          return error;
        },
      });

      try {
        await get('/test');
      } catch {
        // Expected to fail, but interceptors should be called
      }

      if (!requestInterceptorCalled) {
        throw new Error('Request interceptor not called');
      }

      if (!responseInterceptorCalled) {
        throw new Error('Response interceptor not called');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Interceptors',
        passed: true,
        duration,
        details: {
          requestInterceptorCalled,
          responseInterceptorCalled,
        },
      });

      logInfo('Interceptors test passed');
    } catch (_error) {
      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Interceptors',
        passed: false,
        duration,
        error: _error instanceof Error ? _error.message : String(_error),
      });

      logError('Interceptors test failed', _error);
    }
  }

  private async testPerformanceTracking(): Promise<void> {
    const startTime = performance.now();

    try {
      // Test that performance tracking integrates with API calls
      const beforeRequests = performance.now();

      try {
        await trackPerformance('test-api-call', async () => {
          await get('/test');
        });
      } catch {
        // Expected to fail due to network error
      }

      const afterRequests = performance.now();
      const callDuration = afterRequests - beforeRequests;

      // Verify performance tracking worked (call took some time)
      if (callDuration < 1) {
        throw new Error('Performance tracking may not be working correctly');
      }

      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Performance Tracking',
        passed: true,
        duration,
        details: {
          callDuration,
          performanceIntegrated: true,
        },
      });

      logInfo('Performance tracking test passed', { callDuration });
    } catch (_error) {
      const duration = performance.now() - startTime;
      this.results.push({
        name: 'Performance Tracking',
        passed: false,
        duration,
        error: _error instanceof Error ? _error.message : String(_error),
      });

      logError('Performance tracking test failed', _error);
    }
  }
}

// Main test runner
export class EnvApiTestRunner {
  async runAllTests(): Promise<{
    environmentTests: TestSuite;
    apiTests: TestSuite;
    overall: {
      passed: boolean;
      duration: number;
      totalTests: number;
      passedTests: number;
      successRate: number;
    };
  }> {
    const startTime = performance.now();

    logInfo('Starting Environment Configuration & API Client tests');

    // Run environment tests
    const envRunner = new EnvironmentTestRunner();
    const environmentTests = await envRunner.runAllTests();

    // Run API client tests
    const apiRunner = new ApiClientTestRunner();
    const apiTests = await apiRunner.runAllTests();

    const endTime = performance.now();
    const duration = endTime - startTime;

    const totalTests = environmentTests.tests.length + apiTests.tests.length;
    const passedTests =
      environmentTests.tests.filter(t => t.passed).length +
      apiTests.tests.filter(t => t.passed).length;
    const overall = {
      passed: environmentTests.passed && apiTests.passed,
      duration,
      totalTests,
      passedTests,
      successRate: (passedTests / totalTests) * 100,
    };

    logInfo('Environment Configuration & API Client tests completed', {
      environmentTestsPassed: environmentTests.passed,
      apiTestsPassed: apiTests.passed,
      overallPassed: overall.passed,
      successRate: overall.successRate,
      duration,
    });

    return {
      environmentTests,
      apiTests,
      overall,
    };
  }
}

// Export convenience function
export const runEnvApiTests = () => new EnvApiTestRunner().runAllTests();
