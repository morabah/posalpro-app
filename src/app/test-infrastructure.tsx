'use client';

import { useEffect, useState } from 'react';
import { runInfrastructureTests, TestSuite } from '@/lib/test-infrastructure';
import { logValidation } from '@/lib/logger';

export default function TestInfrastructurePage() {
  const [testResults, setTestResults] = useState<TestSuite | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const results = await runInfrastructureTests();
      setTestResults(results);

      // Record validation if all tests passed
      if (results.successRate === 100) {
        await logValidation(
          '1.3',
          'success',
          'Logging and performance infrastructure ready',
          'Utility development and testing lessons - all infrastructure components validated',
          'Infrastructure pattern - comprehensive testing suite confirms reliability'
        );
      }
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Auto-run tests on component mount
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Infrastructure Testing Dashboard
          </h1>

          <div className="mb-6">
            <button
              onClick={runTests}
              disabled={isRunning}
              className={`px-4 py-2 rounded-md font-medium ${
                isRunning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRunning ? 'Running Tests...' : 'Run Infrastructure Tests'}
            </button>
          </div>

          {testResults && (
            <div className="space-y-6">
              {/* Test Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800">Total Tests</h3>
                  <p className="text-2xl font-bold text-blue-900">{testResults.totalTests}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-800">Passed</h3>
                  <p className="text-2xl font-bold text-green-900">{testResults.passedTests}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-800">Failed</h3>
                  <p className="text-2xl font-bold text-red-900">{testResults.failedTests}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-purple-800">Success Rate</h3>
                  <p className="text-2xl font-bold text-purple-900">
                    {testResults.successRate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Overall Status */}
              <div
                className={`rounded-lg p-4 ${
                  testResults.successRate === 100
                    ? 'bg-green-100 border border-green-200'
                    : 'bg-yellow-100 border border-yellow-200'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${
                      testResults.successRate === 100 ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                  />
                  <h3
                    className={`text-lg font-semibold ${
                      testResults.successRate === 100 ? 'text-green-800' : 'text-yellow-800'
                    }`}
                  >
                    {testResults.successRate === 100
                      ? '✅ All Infrastructure Tests Passed'
                      : '⚠️ Some Tests Failed'}
                  </h3>
                </div>
                <p
                  className={`mt-2 ${
                    testResults.successRate === 100 ? 'text-green-700' : 'text-yellow-700'
                  }`}
                >
                  {testResults.successRate === 100
                    ? 'Logging, performance monitoring, and validation tracking systems are fully operational.'
                    : 'Some infrastructure components may not be working correctly. Check individual test results below.'}
                </p>
              </div>

              {/* Test Results Details */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
                <div className="space-y-2">
                  {testResults.results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        result.status === 'success'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <span
                          className={`w-2 h-2 rounded-full mr-3 ${
                            result.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <span className="font-medium text-gray-900">{result.testName}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">
                          {result.duration.toFixed(2)}ms
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            result.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.status === 'success' ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Failed Tests Details */}
              {testResults.failedTests > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-red-900 mb-4">Failed Test Details</h2>
                  <div className="space-y-3">
                    {testResults.results
                      .filter(r => r.status === 'failed')
                      .map((result, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h3 className="font-semibold text-red-800">{result.testName}</h3>
                          <p className="text-red-700 mt-1">{result.details}</p>
                          {result.error && (
                            <pre className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded overflow-x-auto">
                              {result.error.stack || result.error.message}
                            </pre>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Performance Summary */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Summary</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Total Duration:</span>
                      <span className="ml-2 font-medium">
                        {testResults.totalDuration.toFixed(2)}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Average per Test:</span>
                      <span className="ml-2 font-medium">
                        {(testResults.totalDuration / testResults.totalTests).toFixed(2)}ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isRunning && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Running infrastructure tests...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
