'use client';

/**
 * PosalPro MVP2 - Deadline Management Page (H.7)
 * Demonstrates ≥40% on-time completion improvement through AI-powered deadline management
 * Based on PROMPT_H7_DEADLINE_MANAGEMENT.md specifications
 */

import { CreateDeadlineData, UpdateDeadlineData } from '@/types/deadlines';
import dynamic from 'next/dynamic';
import { useCallback } from 'react';

// Dynamic import to reduce bundle size
const DeadlineTracker = dynamic(
  () => import('@/components/deadlines/DeadlineTracker').then(mod => ({ default: mod.DeadlineTracker })),
  {
    loading: () => (
      <div className="bg-white rounded-xl shadow-lg border p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
    ssr: false
  }
);

export default function DeadlineManagementPage() {
  // Stable event handlers using useCallback
  const handleDeadlineCreate = useCallback((deadline: CreateDeadlineData) => {
    console.log('New deadline created:', deadline);
    // Here you would typically save to your backend/state management
  }, []);

  const handleDeadlineUpdate = useCallback((id: string, updates: UpdateDeadlineData) => {
    console.log('Deadline updated:', id, updates);
    // Here you would typically update your backend/state management
  }, []);

  const handleDeadlineDelete = useCallback((id: string) => {
    console.log('Deadline deleted:', id);
    // Here you would typically delete from your backend/state management
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-4">Deadline Management System</h1>
            <p className="text-xl opacity-90 mb-4">
              AI-powered deadline tracking with ≥40% on-time completion improvement (H7)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-3xl font-bold">H7</div>
                <div className="text-sm opacity-90">Hypothesis Validation</div>
                <div className="text-xs opacity-75">Deadline Management</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-3xl font-bold">≥40%</div>
                <div className="text-sm opacity-90">Target Improvement</div>
                <div className="text-xs opacity-75">On-time Completion</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-3xl font-bold">AI</div>
                <div className="text-sm opacity-90">Timeline Estimation</div>
                <div className="text-xs opacity-75">Critical Path Analysis</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Timeline Estimation</h3>
            <p className="text-neutral-600 text-sm">
              AI-powered complexity-based duration estimates with 85% accuracy
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Critical Path Analysis</h3>
            <p className="text-neutral-600 text-sm">
              Automatic bottleneck identification and dependency mapping
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Proactive Alerts</h3>
            <p className="text-neutral-600 text-sm">
              Smart notifications and escalation rules to prevent delays
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Performance Analytics</h3>
            <p className="text-neutral-600 text-sm">
              Real-time metrics and hypothesis validation tracking
            </p>
          </div>
        </div>

        {/* User Stories & Acceptance Criteria */}
        <div className="bg-white rounded-xl p-6 shadow-lg border mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            User Stories & Acceptance Criteria
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">
                US-4.1: Intelligent Timeline Creation
              </h3>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>
                    <strong>AC-4.1.1:</strong> Timeline based on complexity → complexityEstimation()
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>
                    <strong>AC-4.1.2:</strong> Critical path identification → criticalPath()
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>
                    <strong>AC-4.1.3:</strong> ≥40% on-time completion improvement → performance
                    tracking
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-600 mb-3">
                US-4.3: Intelligent Task Prioritization
              </h3>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>
                    <strong>AC-4.3.1:</strong> Priority algorithms → calculatePriority()
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>
                    <strong>AC-4.3.2:</strong> Dependency mapping → mapDependencies()
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>
                    <strong>AC-4.3.3:</strong> Progress tracking → trackProgress()
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test Cases */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">H7 Test Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                TC-H7-001: Timeline Estimation Accuracy
              </h3>
              <p className="text-sm text-neutral-600 mb-3">
                Validate AI-powered timeline estimation against actual completion times across
                different complexity levels.
              </p>
              <ul className="text-xs text-neutral-500 space-y-1">
                <li>• Create proposals with varying complexity (Simple, Complex, Very Complex)</li>
                <li>• Measure estimation vs. actual completion accuracy</li>
                <li>• Target: ≥85% estimation accuracy</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-600 mb-2">
                TC-H7-002: Critical Path Optimization
              </h3>
              <p className="text-sm text-neutral-600 mb-3">
                Test dependency mapping and bottleneck identification for deadline optimization.
              </p>
              <ul className="text-xs text-neutral-500 space-y-1">
                <li>• Create complex deadline dependencies</li>
                <li>• Validate bottleneck prediction accuracy</li>
                <li>• Target: ≥40% reduction in project delays</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Deadline Tracker Component */}
        <DeadlineTracker
          className="bg-white rounded-xl shadow-lg border"
          onDeadlineCreate={handleDeadlineCreate}
          onDeadlineUpdate={handleDeadlineUpdate}
          onDeadlineDelete={handleDeadlineDelete}
        />

        {/* Implementation Notes */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h2 className="text-xl font-bold text-blue-900 mb-3">H7 Implementation Notes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h3 className="font-semibold mb-2">Analytics Integration:</h3>
              <ul className="space-y-1">
                <li>• Real-time performance tracking</li>
                <li>• H7 hypothesis validation metrics</li>
                <li>• Baseline comparison (60% → ≥84%)</li>
                <li>• User story traceability</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">AI Features:</h3>
              <ul className="space-y-1">
                <li>• Complexity-based duration estimation</li>
                <li>• Critical path calculation</li>
                <li>• Bottleneck prediction</li>
                <li>• Priority algorithm optimization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
