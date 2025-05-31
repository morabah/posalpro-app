/**
 * Environment Configuration & API Client Test Dashboard
 * Server-side testing interface for infrastructure validation
 */

import React from 'react';
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
        <pre className="mt-1 text-xs overflow-x-auto">{JSON.stringify(test.details, null, 2)}</pre>
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

export default async function TestEnvApiPage() {
  let testResults: TestResults | null = null;
  let error: string | null = null;

  try {
    // Run tests on the server side where environment variables are available
    testResults = await runEnvApiTests();

    // Execute final validation if all tests pass
    if (testResults.overall.passed) {
      await import('../../lib/final-validation-1-4');
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error occurred';
  }

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
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> These tests run on the server side to safely access environment
              variables. The page is automatically refreshed when accessed.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-6 border border-red-200 bg-red-50 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Test Execution Error</h3>
            <p className="text-red-700">{error}</p>
            <div className="mt-4">
              <p className="text-sm text-red-600">
                To retry, refresh the page or restart the development server.
              </p>
            </div>
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
                  <div className="font-medium text-gray-900">Total Duration</div>
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

            {/* Success Message */}
            {testResults.overall.passed && (
              <div className="mt-8 p-6 border border-green-200 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">🎉 All Tests Passed!</h3>
                <p className="text-green-700">
                  Environment configuration and API client infrastructure are working correctly.
                  Phase 1.4 implementation is ready for development.
                </p>
              </div>
            )}
          </>
        )}

        {/* Technical Information */}
        <div className="mt-12 p-6 border border-gray-200 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Technical Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Environment Tests</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Environment variable validation</li>
                <li>Configuration manager initialization</li>
                <li>Multi-environment support verification</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">API Client Tests</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Client initialization and configuration</li>
                <li>Authentication handling</li>
                <li>Error handling and retry mechanisms</li>
                <li>Caching and performance features</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
