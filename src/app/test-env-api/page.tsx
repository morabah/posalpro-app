'use client';

/**
 * Environment Configuration & API Client Test Dashboard
 * Visual testing interface for infrastructure validation
 */

import React, { useState, useEffect } from 'react';
import { runEnvApiTests } from '../../lib/test-env-api';

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

interface TestResults {
  environmentTests: TestSuite;
  apiTests: TestSuite;
  overall: {
    passed: boolean;
    duration: number;
    totalTests: number;
    passedTests: number;
    successRate: number;
  };
}

export default function TestEnvApiPage() {
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const results = await runEnvApiTests();
      setTestResults(results);

      // Execute final validation if all tests pass
      if (results.overall.passed) {
        await import('../../lib/final-validation-1-4');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const formatDuration = (ms: number) => `${ms.toFixed(2)}ms`;

  const TestResultComponent = ({ test }: { test: TestResult }) => (
    <div
      className={`p-4 border rounded-lg ${test.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
    >
      <div className="flex items-center justify-between">
        <h4 className={`font-medium ${test.passed ? 'text-green-800' : 'text-red-800'}`}>
          {test.name}
          <span className={`ml-2 text-sm ${test.passed ? 'text-green-600' : 'text-red-600'}`}>
            {test.passed ? '✓' : '✗'}
          </span>
        </h4>
        <span className="text-sm text-gray-600">{formatDuration(test.duration)}</span>
      </div>

      {test.error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
          <strong>Error:</strong> {test.error}
        </div>
      )}

      {test.details && Object.keys(test.details).length > 0 && (
        <div className="mt-2 p-2 bg-gray-100 border border-gray-200 rounded text-sm">
          <strong>Details:</strong>
          <pre className="mt-1 text-xs overflow-x-auto">
            {JSON.stringify(test.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  const TestSuiteComponent = ({ suite }: { suite: TestSuite }) => (
    <div className="mb-8">
      <div
        className={`p-4 border-l-4 ${suite.passed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
      >
        <h3 className={`text-lg font-semibold ${suite.passed ? 'text-green-800' : 'text-red-800'}`}>
          {suite.name}
          <span className={`ml-2 ${suite.passed ? 'text-green-600' : 'text-red-600'}`}>
            {suite.passed ? '✓' : '✗'}
          </span>
        </h3>
        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Duration:</strong> {formatDuration(suite.duration)}
          </div>
          <div>
            <strong>Tests:</strong> {suite.tests.length}
          </div>
          <div>
            <strong>Success Rate:</strong> {suite.successRate.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {suite.tests.map((test, index) => (
          <TestResultComponent key={index} test={test} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Environment Configuration & API Client Tests
          </h1>
          <p className="text-gray-600">
            Comprehensive testing of environment management and API client infrastructure
          </p>
        </div>

        {isRunning && (
          <div className="mb-8 p-6 border border-blue-200 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800">Running infrastructure tests...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-6 border border-red-200 bg-red-50 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Test Execution Error</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={runTests}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry Tests
            </button>
          </div>
        )}

        {testResults && (
          <>
            {/* Overall Results */}
            <div
              className={`mb-8 p-6 border-l-4 ${testResults.overall.passed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'} rounded-lg`}
            >
              <h2
                className={`text-xl font-semibold ${testResults.overall.passed ? 'text-green-800' : 'text-red-800'} mb-4`}
              >
                Overall Test Results
                <span
                  className={`ml-2 ${testResults.overall.passed ? 'text-green-600' : 'text-red-600'}`}
                >
                  {testResults.overall.passed ? '✓ PASSED' : '✗ FAILED'}
                </span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-white rounded border">
                  <div className="font-medium text-gray-900">Total Tests</div>
                  <div className="text-lg font-bold text-blue-600">
                    {testResults.overall.totalTests}
                  </div>
                </div>
                <div className="p-3 bg-white rounded border">
                  <div className="font-medium text-gray-900">Passed</div>
                  <div className="text-lg font-bold text-green-600">
                    {testResults.overall.passedTests}
                  </div>
                </div>
                <div className="p-3 bg-white rounded border">
                  <div className="font-medium text-gray-900">Success Rate</div>
                  <div className="text-lg font-bold text-purple-600">
                    {testResults.overall.successRate.toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 bg-white rounded border">
                  <div className="font-medium text-gray-900">Duration</div>
                  <div className="text-lg font-bold text-orange-600">
                    {formatDuration(testResults.overall.duration)}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Suites */}
            <div className="space-y-8">
              <TestSuiteComponent suite={testResults.environmentTests} />
              <TestSuiteComponent suite={testResults.apiTests} />
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={runTests}
                disabled={isRunning}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isRunning ? 'Running...' : 'Re-run Tests'}
              </button>

              {testResults.overall.passed && (
                <div className="flex items-center text-green-600">
                  <span className="mr-2">✓</span>
                  <span className="font-medium">
                    Environment & API infrastructure ready for development
                  </span>
                </div>
              )}
            </div>

            {/* Implementation Summary */}
            <div className="mt-8 p-6 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Implementation Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Environment Configuration</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>✓ Type-safe environment variable access</li>
                    <li>✓ Multi-environment support (dev/staging/prod)</li>
                    <li>✓ Configuration validation with error handling</li>
                    <li>✓ Environment-specific defaults and behaviors</li>
                    <li>✓ Integration with logging infrastructure</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">API Client Foundation</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>✓ Standardized HTTP client with all methods</li>
                    <li>✓ Authentication integration (Bearer/API-Key)</li>
                    <li>✓ Comprehensive error handling & categorization</li>
                    <li>✓ Retry mechanisms with exponential backoff</li>
                    <li>✓ Request/response caching system</li>
                    <li>✓ Interceptors for custom logic</li>
                    <li>✓ Performance monitoring integration</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
