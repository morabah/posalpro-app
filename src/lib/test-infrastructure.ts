/**
 * Infrastructure Testing Utilities
 * Comprehensive testing of logging, performance, and validation systems
 * to ensure all utilities work correctly across environments
 */

import { logDebug, logInfo, logWarn, logError, logValidation } from './logger';
import {
  startMeasurement,
  endMeasurement,
  trackPerformance,
  trackPerformanceSync,
  getPerformanceSummary,
} from './performance';
import {
  recordValidation,
  getProjectProgress,
  getValidationStats,
  startPhase,
  ValidationStatus,
} from './validationTracker';

// Test results interface
export interface TestResult {
  testName: string;
  status: 'success' | 'failed';
  duration: number;
  details: string;
  error?: Error;
}

// Test suite interface
export interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  totalDuration: number;
}

// Infrastructure test runner class
class InfrastructureTestRunner {
  private testResults: TestResult[] = [];

  // Run a single test with performance tracking
  private async runTest(
    testName: string,
    testFunction: () => Promise<void> | void
  ): Promise<TestResult> {
    const startTime = performance.now();

    try {
      await testFunction();
      const duration = performance.now() - startTime;

      const result: TestResult = {
        testName,
        status: 'success',
        duration,
        details: 'Test completed successfully',
      };

      this.testResults.push(result);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      const result: TestResult = {
        testName,
        status: 'failed',
        duration,
        details: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error : new Error(String(error)),
      };

      this.testResults.push(result);
      return result;
    }
  }

  // Test logging utilities
  async testLoggingSystem(): Promise<void> {
    await this.runTest('Basic Logging Functions', async () => {
      await logDebug('Debug test message', { test: true, value: 123 });
      await logInfo('Info test message', { operation: 'test', timestamp: Date.now() });
      await logWarn('Warning test message', { warning: 'This is a test warning' });
      await logError('Error test message', new Error('Test error'), { context: 'testing' });
    });

    await this.runTest('Validation Logging', async () => {
      await logValidation(
        '1.3',
        'success',
        'Infrastructure testing in progress',
        'Testing infrastructure components',
        'Testing pattern'
      );
    });

    await this.runTest('Large Data Logging', async () => {
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` })),
        metadata: {
          source: 'test',
          timestamp: Date.now(),
          environment: 'testing',
        },
      };

      await logInfo('Large data test', largeData);
    });

    await this.runTest('Error Object Logging', async () => {
      const testError = new Error('Test error with stack trace');
      testError.stack = 'Test stack trace\n  at testFunction\n  at runTest';

      await logError('Detailed error test', testError, {
        context: 'error testing',
        userAction: 'running tests',
      });
    });
  }

  // Test performance monitoring
  async testPerformanceSystem(): Promise<void> {
    await this.runTest('Basic Performance Measurement', async () => {
      const measurementId = startMeasurement('test_operation', { category: 'testing' });

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));

      const duration = endMeasurement(measurementId);

      if (duration <= 0) {
        throw new Error('Performance measurement returned invalid duration');
      }
    });

    await this.runTest('Performance Tracking Async', async () => {
      const result = await trackPerformance(
        'async_test_operation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          return 'async_result';
        },
        { category: 'async_testing' }
      );

      if (result !== 'async_result') {
        throw new Error('Async performance tracking returned wrong result');
      }
    });

    await this.runTest('Performance Tracking Sync', () => {
      const result = trackPerformanceSync(
        'sync_test_operation',
        () => {
          // Simulate sync work
          let sum = 0;
          for (let i = 0; i < 1000; i++) {
            sum += i;
          }
          return sum;
        },
        { category: 'sync_testing' }
      );

      if (result !== 499500) {
        throw new Error('Sync performance tracking returned wrong result');
      }
    });

    await this.runTest('Performance Summary', () => {
      const summary = getPerformanceSummary();

      if (summary.totalMeasurements < 3) {
        throw new Error('Performance summary shows insufficient measurements');
      }

      if (summary.averageDuration <= 0) {
        throw new Error('Performance summary shows invalid average duration');
      }
    });
  }

  // Test validation tracking system
  async testValidationSystem(): Promise<void> {
    await this.runTest('Validation Recording', () => {
      const result = recordValidation(
        '1.3',
        'success',
        'Test validation recording',
        'Validation system works correctly',
        'Testing pattern',
        { testMetadata: true }
      );

      if (result.status !== ValidationStatus.SUCCESS) {
        throw new Error('Validation recording returned wrong status');
      }

      if (result.phase !== '1.3') {
        throw new Error('Validation recording returned wrong phase');
      }
    });

    await this.runTest('Phase Management', () => {
      // Start a test phase
      startPhase('1');

      const progress = getProjectProgress();

      if (!progress.phases['1']) {
        throw new Error('Phase not found in project progress');
      }

      if (progress.phases['1'].status !== ValidationStatus.IN_PROGRESS) {
        throw new Error('Phase status not updated correctly');
      }
    });

    await this.runTest('Validation Statistics', () => {
      const stats = getValidationStats();

      if (stats.total === 0) {
        throw new Error('Validation statistics show no validations');
      }

      if (stats.successRate < 0 || stats.successRate > 100) {
        throw new Error('Validation statistics show invalid success rate');
      }
    });
  }

  // Test error handling
  async testErrorHandling(): Promise<void> {
    await this.runTest('Performance Error Handling', async () => {
      try {
        await trackPerformance(
          'error_test',
          async () => {
            throw new Error('Intentional test error');
          },
          { category: 'error_testing' }
        );
        throw new Error('Expected error was not thrown');
      } catch (error) {
        if (error instanceof Error && error.message !== 'Intentional test error') {
          throw new Error('Wrong error was thrown');
        }
      }
    });

    await this.runTest('Validation Error Recording', () => {
      const result = recordValidation(
        '1.3',
        'failed',
        'Test validation failure',
        'Error handling lesson',
        'Error pattern'
      );

      if (result.status !== ValidationStatus.FAILED) {
        throw new Error('Failed validation not recorded correctly');
      }
    });
  }

  // Test integration between systems
  async testSystemIntegration(): Promise<void> {
    await this.runTest('Logging-Performance Integration', async () => {
      const measurementId = startMeasurement('integration_test');

      await logInfo('Integration test message', { measurementId });

      const duration = endMeasurement(measurementId);

      if (duration <= 0) {
        throw new Error('Integration test failed to measure duration');
      }
    });

    await this.runTest('Validation-Performance Integration', () => {
      const result = trackPerformanceSync(
        'validation_integration_test',
        () => {
          return recordValidation(
            '1.3',
            'success',
            'Integration test validation',
            'Systems integrate well',
            'Integration pattern'
          );
        },
        { category: 'integration' }
      );

      if (result.status !== ValidationStatus.SUCCESS) {
        throw new Error('Validation-performance integration failed');
      }
    });
  }

  // Run all tests and generate report
  public async runAllTests(): Promise<TestSuite> {
    logInfo('Starting infrastructure testing suite');

    this.testResults = [];

    try {
      await this.testLoggingSystem();
      await this.testPerformanceSystem();
      await this.testValidationSystem();
      await this.testErrorHandling();
      await this.testSystemIntegration();
    } catch (error) {
      logError('Test suite execution failed', error);
    }

    // Generate test suite summary
    const passedTests = this.testResults.filter(t => t.status === 'success').length;
    const failedTests = this.testResults.filter(t => t.status === 'failed').length;
    const totalDuration = this.testResults.reduce((sum, t) => sum + t.duration, 0);

    const testSuite: TestSuite = {
      suiteName: 'Infrastructure Testing Suite',
      results: this.testResults,
      totalTests: this.testResults.length,
      passedTests,
      failedTests,
      successRate: (passedTests / this.testResults.length) * 100,
      totalDuration,
    };

    // Log test suite results
    logInfo('Infrastructure testing suite completed', {
      category: 'test_results',
      testSuite,
      summary: {
        passed: passedTests,
        failed: failedTests,
        successRate: testSuite.successRate,
        totalDuration,
      },
    });

    return testSuite;
  }

  // Get individual test results
  public getTestResults(): TestResult[] {
    return [...this.testResults];
  }
}

// Export test runner and functions
export const infrastructureTestRunner = new InfrastructureTestRunner();

export const runInfrastructureTests = (): Promise<TestSuite> =>
  infrastructureTestRunner.runAllTests();

export const getTestResults = (): TestResult[] => infrastructureTestRunner.getTestResults();
