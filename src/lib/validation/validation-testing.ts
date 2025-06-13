/**
 * PosalPro MVP2 - Validation Testing Framework
 * Enhanced testing utilities for Zod schemas and validation functions
 * Supports hypothesis validation and performance measurement
 */

import { z } from 'zod';
import { logger } from '../logger';

export interface ValidationTestCase<T = any> {
  name: string;
  input: unknown;
  expected: {
    success: boolean;
    data?: T;
    errors?: string[];
  };
  performance?: {
    maxDuration: number; // milliseconds
    memoryThreshold: number; // bytes
  };
}

export interface ValidationTestSuite<T = any> {
  schema: z.ZodSchema<T>;
  name: string;
  description: string;
  testCases: ValidationTestCase<T>[];
  hypothesis?: string;
  userStory?: string;
}

export interface ValidationTestResult {
  testName: string;
  passed: boolean;
  duration: number;
  memoryUsage?: number;
  errors: string[];
  warnings: string[];
  actualOutput?: unknown;
  expectedOutput?: unknown;
}

export interface ValidationSuiteResult {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  averageDuration: number;
  results: ValidationTestResult[];
  performanceMetrics: {
    fastestTest: number;
    slowestTest: number;
    memoryPeak: number;
    memoryAverage: number;
  };
  hypothesis?: string;
  hypothesisValidated?: boolean;
}

export interface PerformanceValidationConfig {
  maxValidationTime: number; // milliseconds
  maxMemoryUsage: number; // bytes
  sampleSize: number;
  iterations: number;
  warmupRuns: number;
}

/**
 * Enhanced validation testing framework
 */
export class ValidationTester {
  private logger: typeof logger;
  private performanceConfig: PerformanceValidationConfig;

  constructor(config?: Partial<PerformanceValidationConfig>) {
    this.logger = logger;
    this.performanceConfig = {
      maxValidationTime: 100, // 100ms max validation time
      maxMemoryUsage: 1024 * 1024, // 1MB max memory
      sampleSize: 1000,
      iterations: 10,
      warmupRuns: 3,
      ...config,
    };
  }

  /**
   * Run a complete validation test suite
   */
  async runTestSuite<T>(suite: ValidationTestSuite<T>): Promise<ValidationSuiteResult> {
    this.logger.info(`Running validation test suite: ${suite.name}`);
    const startTime = Date.now();

    const results: ValidationTestResult[] = [];
    let totalDuration = 0;
    const memoryUsages: number[] = [];

    for (const testCase of suite.testCases) {
      const result = await this.runTestCase(suite.schema, testCase);
      results.push(result);
      totalDuration += result.duration;

      if (result.memoryUsage) {
        memoryUsages.push(result.memoryUsage);
      }
    }

    const passedTests = results.filter(r => r.passed).length;
    const failedTests = results.length - passedTests;
    const averageDuration = totalDuration / results.length;

    const performanceMetrics = {
      fastestTest: Math.min(...results.map(r => r.duration)),
      slowestTest: Math.max(...results.map(r => r.duration)),
      memoryPeak: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
      memoryAverage:
        memoryUsages.length > 0 ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length : 0,
    };

    // Hypothesis validation check
    let hypothesisValidated = false;
    if (suite.hypothesis) {
      hypothesisValidated = this.validateHypothesis(suite, results, performanceMetrics);
    }

    const suiteResult: ValidationSuiteResult = {
      suiteName: suite.name,
      totalTests: results.length,
      passedTests,
      failedTests,
      totalDuration,
      averageDuration,
      results,
      performanceMetrics,
      hypothesis: suite.hypothesis,
      hypothesisValidated,
    };

    const duration = Date.now() - startTime;
    this.logger.info(`Validation test suite completed: ${suite.name}`, {
      duration,
      passedTests,
      failedTests,
      averageDuration,
      hypothesisValidated,
    });

    return suiteResult;
  }

  /**
   * Run a single validation test case
   */
  private async runTestCase<T>(
    schema: z.ZodSchema<T>,
    testCase: ValidationTestCase<T>
  ): Promise<ValidationTestResult> {
    const startTime = Date.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = schema.safeParse(testCase.input);
      const duration = Date.now() - startTime;
      const memoryUsage = this.getMemoryUsage() - startMemory;

      // Check performance constraints
      const warnings: string[] = [];
      if (testCase.performance?.maxDuration && duration > testCase.performance.maxDuration) {
        warnings.push(
          `Performance warning: Test took ${duration}ms, expected max ${testCase.performance.maxDuration}ms`
        );
      }

      if (
        testCase.performance?.memoryThreshold &&
        memoryUsage > testCase.performance.memoryThreshold
      ) {
        warnings.push(
          `Memory warning: Test used ${memoryUsage} bytes, expected max ${testCase.performance.memoryThreshold} bytes`
        );
      }

      // Validate result
      const passed = this.validateTestResult(result, testCase.expected);
      const errors: string[] = [];

      if (!passed) {
        if (result.success !== testCase.expected.success) {
          errors.push(`Expected success: ${testCase.expected.success}, got: ${result.success}`);
        }

        if (result.success && testCase.expected.data) {
          const dataMatches = this.deepEqual(result.data, testCase.expected.data);
          if (!dataMatches) {
            errors.push('Data mismatch between expected and actual output');
          }
        }

        if (!result.success && testCase.expected.errors) {
          const errorMessages = result.error?.issues.map(issue => issue.message) || [];
          const hasExpectedErrors = testCase.expected.errors.every(expectedError =>
            errorMessages.some(actualError => actualError.includes(expectedError))
          );
          if (!hasExpectedErrors) {
            errors.push('Expected error messages not found in actual errors');
          }
        }
      }

      return {
        testName: testCase.name,
        passed,
        duration,
        memoryUsage,
        errors,
        warnings,
        actualOutput: result.success ? result.data : result.error?.issues,
        expectedOutput: testCase.expected,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName: testCase.name,
        passed: false,
        duration,
        errors: [
          `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        warnings: [],
        actualOutput: null,
        expectedOutput: testCase.expected,
      };
    }
  }

  /**
   * Performance validation for schemas
   */
  async validateSchemaPerformance<T>(
    schema: z.ZodSchema<T>,
    testData: unknown[],
    schemaName: string
  ): Promise<{
    averageTime: number;
    medianTime: number;
    p95Time: number;
    p99Time: number;
    throughput: number;
    memoryEfficiency: number;
    passed: boolean;
  }> {
    this.logger.info(`Running performance validation for schema: ${schemaName}`);

    // Warmup runs
    for (let i = 0; i < this.performanceConfig.warmupRuns; i++) {
      testData.forEach(data => schema.safeParse(data));
    }

    const times: number[] = [];
    const memoryUsages: number[] = [];

    // Performance test runs
    for (let iteration = 0; iteration < this.performanceConfig.iterations; iteration++) {
      for (const data of testData.slice(0, this.performanceConfig.sampleSize)) {
        const startTime = performance.now();
        const startMemory = this.getMemoryUsage();

        schema.safeParse(data);

        const endTime = performance.now();
        const endMemory = this.getMemoryUsage();

        times.push(endTime - startTime);
        memoryUsages.push(endMemory - startMemory);
      }
    }

    times.sort((a, b) => a - b);
    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const medianTime = times[Math.floor(times.length / 2)];
    const p95Time = times[Math.floor(times.length * 0.95)];
    const p99Time = times[Math.floor(times.length * 0.99)];
    const throughput = 1000 / averageTime; // operations per second
    const memoryEfficiency = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;

    const passed =
      averageTime <= this.performanceConfig.maxValidationTime &&
      memoryEfficiency <= this.performanceConfig.maxMemoryUsage;

    this.logger.info(`Performance validation completed for schema: ${schemaName}`, {
      averageTime,
      medianTime,
      p95Time,
      p99Time,
      throughput,
      memoryEfficiency,
      passed,
    });

    return {
      averageTime,
      medianTime,
      p95Time,
      p99Time,
      throughput,
      memoryEfficiency,
      passed,
    };
  }

  /**
   * Generate test data for schema testing
   */
  generateTestData<T>(schema: z.ZodSchema<T>, count: number = 100): unknown[] {
    // This is a simplified test data generator
    // In a real implementation, you would use a library like @faker-js/faker
    const testData: unknown[] = [];

    for (let i = 0; i < count; i++) {
      // Generate valid and invalid test cases
      if (i % 10 === 0) {
        // 10% invalid data
        testData.push(this.generateInvalidData());
      } else {
        // 90% attempt to generate valid data
        testData.push(this.generateValidData(schema));
      }
    }

    return testData;
  }

  /**
   * Validate hypothesis based on test results
   */
  private validateHypothesis(
    suite: ValidationTestSuite,
    results: ValidationTestResult[],
    performanceMetrics: any
  ): boolean {
    const passRate = results.filter(r => r.passed).length / results.length;
    const averageDuration = performanceMetrics.fastestTest;

    // Different validation criteria based on hypothesis
    switch (suite.hypothesis) {
      case 'H8': // Technical Configuration Validation
        return passRate >= 0.95 && averageDuration <= 50; // 95% pass rate, under 50ms
      case 'H1': // Content Search Performance
        return passRate >= 0.9 && averageDuration <= 100; // 90% pass rate, under 100ms
      default:
        return passRate >= 0.85; // Generic 85% pass rate
    }
  }

  /**
   * Validate test result against expected outcome
   */
  private validateTestResult(actual: z.SafeParseReturnType<any, any>, expected: any): boolean {
    if (actual.success !== expected.success) {
      return false;
    }

    if (actual.success && expected.data) {
      return this.deepEqual(actual.data, expected.data);
    }

    if (!actual.success && expected.errors) {
      const errorMessages = actual.error.issues.map(issue => issue.message);
      return expected.errors.every((expectedError: string) =>
        errorMessages.some(actualError => actualError.includes(expectedError))
      );
    }

    return true;
  }

  /**
   * Deep equality check for test validation
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;

      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEqual(a[key], b[key])) return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Get current memory usage (simplified)
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * Generate invalid test data
   */
  private generateInvalidData(): unknown {
    const invalidCases = [null, undefined, '', 'invalid-string', -1, {}, [], { invalid: 'data' }];
    return invalidCases[Math.floor(Math.random() * invalidCases.length)];
  }

  /**
   * Generate valid test data (simplified)
   */
  private generateValidData(schema: z.ZodSchema): unknown {
    // This is a simplified implementation
    // In a real scenario, you would analyze the schema and generate appropriate data
    return {
      id: `test-${Math.random().toString(36).substr(2, 9)}`,
      name: `Test Name ${Math.floor(Math.random() * 1000)}`,
      email: `test${Math.floor(Math.random() * 1000)}@example.com`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Validation test suite builder
 */
export class ValidationTestSuiteBuilder<T> {
  private suite: ValidationTestSuite<T>;

  constructor(schema: z.ZodSchema<T>, name: string) {
    this.suite = {
      schema,
      name,
      description: '',
      testCases: [],
    };
  }

  description(desc: string): this {
    this.suite.description = desc;
    return this;
  }

  hypothesis(hypothesis: string): this {
    this.suite.hypothesis = hypothesis;
    return this;
  }

  userStory(userStory: string): this {
    this.suite.userStory = userStory;
    return this;
  }

  addTestCase(testCase: ValidationTestCase<T>): this {
    this.suite.testCases.push(testCase);
    return this;
  }

  expectValid(name: string, input: unknown, expectedData?: T): this {
    return this.addTestCase({
      name,
      input,
      expected: { success: true, data: expectedData },
    });
  }

  expectInvalid(name: string, input: unknown, expectedErrors?: string[]): this {
    return this.addTestCase({
      name,
      input,
      expected: { success: false, errors: expectedErrors },
    });
  }

  expectPerformant(
    name: string,
    input: unknown,
    maxDuration: number,
    memoryThreshold?: number
  ): this {
    return this.addTestCase({
      name,
      input,
      expected: { success: true },
      performance: { maxDuration, memoryThreshold: memoryThreshold || 1024 },
    });
  }

  build(): ValidationTestSuite<T> {
    return { ...this.suite };
  }
}

/**
 * Factory function for creating validation test suites
 */
export function createValidationTestSuite<T>(
  schema: z.ZodSchema<T>,
  name: string
): ValidationTestSuiteBuilder<T> {
  return new ValidationTestSuiteBuilder(schema, name);
}

/**
 * Global validation tester instance
 */
export const validationTester = new ValidationTester();
