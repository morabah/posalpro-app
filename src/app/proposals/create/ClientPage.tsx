'use client';

import React, { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';

const ProposalWizard = dynamic(
  () => import('@/components/proposals/ProposalWizard').then(mod => ({ default: mod.ProposalWizard })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading Proposal Wizard...</p>
          <p className="text-sm text-gray-500 mt-1">Optimizing for best performance</p>
        </div>
      </div>
    ),
  }
);

const PerformanceDashboard = dynamic(() => import('@/components/performance/PerformanceDashboard'), {
  loading: () => <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>,
});

export default function ClientPage() {
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const searchParams = useSearchParams();
  const editProposalId = searchParams.get('edit');

  useEffect(() => {
    const loadStartTime = performance.now();
    // Non-standard memory API is available only in Chromium-based browsers
    type ChromiumPerformance = Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
    const perf = performance as ChromiumPerformance;
    const navEntry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | PerformanceEntry
      | undefined;
    analytics(
      'proposal_create_page_loaded',
      {
        userStories: ['US-4.1', 'US-6.1', 'US-6.2'],
        hypotheses: ['H7', 'H8', 'H9'],
        loadStartTime,
        browserPerformance: {
          navigationTiming: navEntry ?? null,
          memoryUsage: perf.memory
            ? {
                usedJSHeapSize: perf.memory.usedJSHeapSize,
                totalJSHeapSize: perf.memory.totalJSHeapSize,
                jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
              }
            : null,
        },
      },
      'high'
    );
    // Preload critical component
    import('@/components/proposals/ProposalWizard');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6">
          <Suspense fallback={<div className="h-8 bg-gray-100 rounded animate-pulse"></div>}>
            <PerformanceDashboard className="mb-6" showAdvancedMetrics enableAutoRefresh refreshInterval={30000} />
          </Suspense>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {editProposalId ? 'Edit Proposal' : 'Create New Proposal'}
            </h1>
            <p className="text-gray-600 mt-2">
              {editProposalId ? 'Update your proposal with our guided wizard' : 'Build comprehensive proposals with our guided wizard'}
            </p>
          </header>

          <Suspense
            fallback={
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600 font-medium">Preparing Proposal Creation Wizard</p>
                    <p className="text-sm text-gray-500 mt-2">Loading optimized components for the best experience...</p>
                    <div className="mt-6 w-64 mx-auto">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '45%' }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Loading wizard components...</p>
                    </div>
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Performance Tip:</strong> Components are loaded dynamically to ensure fast initial page load
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            <ProposalWizard editProposalId={editProposalId || undefined} />
          </Suspense>

          {process.env.NODE_ENV === 'development' && (
            <footer className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Performance Optimization:</strong> This page uses dynamic imports to reduce initial bundle size
                </div>
                <div className="text-xs">Bundle: Optimized | Lazy Loading: Active | SSR: Disabled for performance</div>
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
