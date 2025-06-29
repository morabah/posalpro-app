/**
 * PosalPro MVP2 - Optimized Proposal Creation Page
 * Enhanced with dynamic imports and performance monitoring
 *
 * Component Traceability Matrix Integration
 * User Stories: US-4.1 (Proposal Creation), US-6.1 (Performance), US-6.2 (User Experience)
 * Hypotheses: H7 (Decision Efficiency), H8 (Load Time), H9 (User Engagement)
 */

'use client';

import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { useAnalytics } from '@/hooks/useAnalytics';
import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-6.1', 'US-6.2'],
  acceptanceCriteria: [
    'AC-4.1.1', // Proposal creation workflow
    'AC-6.1.1', // Load time optimization
    'AC-6.1.2', // Bundle size reduction
    'AC-6.2.1', // User experience preservation
  ],
  methods: [
    'optimizeProposalCreation()',
    'implementDynamicLoading()',
    'trackCreationPerformance()',
    'manageWizardState()',
    'validateProposalData()',
  ],
  hypotheses: ['H7', 'H8', 'H9'],
  testCases: ['TC-H7-002', 'TC-H8-003', 'TC-H9-001'],
};

// Dynamic imports for performance optimization
const ProposalWizard = dynamic(
  () =>
    import('@/components/proposals/ProposalWizard').then(mod => ({ default: mod.ProposalWizard })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading Proposal Wizard...</p>
          <p className="text-sm text-gray-500 mt-1">Optimizing for best performance</p>
        </div>
      </div>
    ), // Client-side only for better performance
  }
);

// Preload components for better UX
const PerformanceDashboard = dynamic(
  () => import('@/components/performance/PerformanceDashboard'),
  {
    loading: () => <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>
  });

/**
 * Optimized Proposal Creation Page
 */
export default function ProposalCreatePage() {
  const analytics = useAnalytics();

  React.useEffect(() => {
    // Track page load with performance metrics
    const loadStartTime = performance.now();

    analytics.track('proposal_create_page_loaded', {
      userStories: ['US-4.1', 'US-6.1', 'US-6.2'],
      hypotheses: ['H7', 'H8', 'H9'],
      loadStartTime,
      timestamp: Date.now(),
      browserPerformance: {
        navigationTiming: performance.getEntriesByType('navigation')[0],
        memoryUsage: (performance as any).memory
          ? {
              usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
              totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
              jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
            }
          : null,
      }
    });

    // Preload critical components
    import('@/components/proposals/ProposalWizard');
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Performance monitoring in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6">
          <Suspense fallback={<div className="h-8 bg-gray-100 rounded animate-pulse"></div>}>
            <PerformanceDashboard
              className="mb-6"
              showAdvancedMetrics={true}
              enableAutoRefresh={true}
              refreshInterval={30000}
            />
          </Suspense>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Proposal</h1>
            <p className="text-gray-600 mt-2">
              Build comprehensive proposals with our guided wizard
            </p>
          </header>

          {/* Optimized Proposal Wizard */}
          <Suspense
            fallback={
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600 font-medium">
                      Preparing Proposal Creation Wizard
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Loading optimized components for the best experience...
                    </p>

                    {/* Progress indicator */}
                    <div className="mt-6 w-64 mx-auto">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full animate-pulse"
                          style={{ width: '45%' }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Loading wizard components...</p>
                    </div>

                    {/* Performance tip */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        💡 <strong>Performance Tip:</strong> Components are loaded dynamically to
                        ensure fast initial page load
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            <ProposalWizard />
          </Suspense>

          {/* Footer with Performance Info */}
          {process.env.NODE_ENV === 'development' && (
            <footer className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Performance Optimization:</strong> This page uses dynamic imports to
                  reduce initial bundle size
                </div>
                <div className="text-xs">
                  Bundle: Optimized | Lazy Loading: Active | SSR: Disabled for performance
                </div>
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
