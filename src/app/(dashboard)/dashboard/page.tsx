import DashboardInteractionTracker from '@/components/analytics/DashboardInteractionTracker';
import DashboardViewTracker from '@/components/analytics/DashboardViewTracker';
import { DashboardManagementBridge } from '@/components/bridges/DashboardManagementBridge';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SimpleErrorBoundary } from '@/components/providers/SimpleErrorBoundary';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// PDF Export Button
const PDFExportButton = dynamic(() => import('@/components/dashboard/PDFExportButton'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-32" />,
});

// Executive Dashboard - High-end visualizations for managers and owners
const ExecutiveDashboard = dynamic(() => import('@/components/dashboard/ExecutiveDashboard'), {
  loading: () => (
    <div className="animate-pulse bg-gradient-to-br from-blue-900 to-indigo-900 rounded-lg h-96" />
  ),
});

// Enhanced Dashboard with business-priority layout and better charts
const EnhancedDashboard = dynamic(() => import('@/components/dashboard/EnhancedDashboard'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-96" />,
});

const QuickActions = dynamic(() => import('@/components/dashboard/client/QuickActionsClient'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-48" />,
});

const RecentProposals = dynamic(
  () => import('@/components/dashboard/client/RecentProposalsClient'),
  {
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64" />,
  }
);

// Keep original charts as secondary view
const DashboardCharts = dynamic(
  () => import('@/components/dashboard/client/DashboardChartsClient'),
  {
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64" />,
  }
);

/**
 * Dashboard Page - CORE_REQUIREMENTS.md Compliant
 *
 * COMPONENT TRACEABILITY MATRIX:
 * - User Stories: US-1.1 (Dashboard Overview), US-1.2 (Quick Actions), US-1.3 (Analytics)
 * - Acceptance Criteria: AC-1.1.1, AC-1.1.2, AC-1.2.1, AC-1.3.1
 * - Hypotheses: H1 (Dashboard Efficiency), H3 (User Engagement), H4 (Data Insights)
 *
 * COMPLIANCE STATUS:
 * ✅ Bridge Architecture Integration
 * ✅ Error Boundaries with SimpleErrorBoundary
 * ✅ Lazy Loading with dynamic imports
 * ✅ Accessibility with ARIA labels and semantic HTML
 * ✅ Performance with Suspense fallbacks
 * ✅ SSR/CSR hydration consistency
 */
export default function DashboardPage() {
  return (
    <DashboardManagementBridge>
      <main aria-labelledby="page-title" className="space-y-6 p-6" id="dashboard-content">
        <DashboardViewTracker />
        <DashboardInteractionTracker />
        <div className="pb-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Breadcrumbs />
              <h1 id="page-title" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Suspense
                fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-10 w-32" />}
              >
                <PDFExportButton
                  targetId="dashboard-content"
                  filename="posalpro-dashboard"
                  variant="outline"
                  size="md"
                />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Executive Dashboard - High-End Visualizations */}
        <section aria-labelledby="executive-dashboard-heading" className="mb-8">
          <h2 id="executive-dashboard-heading" className="sr-only">
            Executive Dashboard
          </h2>
          <SimpleErrorBoundary>
            <Suspense
              fallback={
                <div className="animate-pulse bg-gradient-to-br from-blue-900 to-indigo-900 rounded-lg h-96"></div>
              }
            >
              <ExecutiveDashboard />
            </Suspense>
          </SimpleErrorBoundary>
        </section>

        {/* Enhanced Business-Priority Dashboard - Collapsible */}
        <section aria-labelledby="enhanced-dashboard-heading">
          <details className="group rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
            <summary className="cursor-pointer list-none select-none px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t-lg">
              <span
                id="enhanced-dashboard-heading"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                Enhanced Analytics
              </span>
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <span className="group-open:inline hidden">Collapse</span>
                <span className="group-open:hidden inline">Expand</span>
                <span aria-hidden className="transition-transform group-open:rotate-180">
                  ▾
                </span>
              </span>
            </summary>
            <div className="p-4">
              <SimpleErrorBoundary>
                <Suspense
                  fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-96"></div>}
                >
                  <EnhancedDashboard />
                </Suspense>
              </SimpleErrorBoundary>
            </div>
          </details>
        </section>

        {/* Additional Analytics (Collapsible) */}
        <section aria-labelledby="detailed-analytics-heading">
          <details className="group rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
            <summary className="cursor-pointer list-none select-none px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t-lg">
              <span
                id="detailed-analytics-heading"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                Detailed Analytics
              </span>
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <span className="group-open:inline hidden">Collapse</span>
                <span className="group-open:hidden inline">Expand</span>
                <span aria-hidden className="transition-transform group-open:rotate-180">
                  ▾
                </span>
              </span>
            </summary>
            <div className="p-4">
              <SimpleErrorBoundary>
                <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-64" />}>
                  <DashboardCharts />
                </Suspense>
              </SimpleErrorBoundary>
            </div>
          </details>
        </section>

        {/* Two-column layout: content + right rail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section
            aria-labelledby="recent-heading"
            className="lg:col-span-8 min-w-0"
            data-testid="recent-proposals-section"
          >
            <details
              open
              className="group rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800"
            >
              <summary
                className="cursor-pointer list-none select-none px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t-lg"
                aria-controls="recent-proposals-panel"
                data-testid="recent-proposals-toggle"
              >
                <span
                  id="recent-heading"
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                  Recent Proposals
                </span>
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="group-open:inline hidden">Collapse</span>
                  <span className="group-open:hidden inline">Expand</span>
                  <span aria-hidden className="transition-transform group-open:rotate-180">
                    ▾
                  </span>
                </span>
              </summary>
              <div id="recent-proposals-panel" className="p-4" data-testid="recent-proposals">
                <SimpleErrorBoundary>
                  <Suspense
                    fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-64" />}
                  >
                    <RecentProposals />
                  </Suspense>
                </SimpleErrorBoundary>
              </div>
            </details>
          </section>

          <section
            aria-labelledby="quick-actions-heading"
            className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start"
            data-testid="quick-actions-section"
          >
            <details
              open
              className="group rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <summary
                className="cursor-pointer list-none select-none px-4 py-3 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t-lg"
                aria-controls="quick-actions-panel"
                data-testid="quick-actions-toggle"
              >
                <span
                  id="quick-actions-heading"
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                  Quick Actions
                </span>
                <span aria-hidden className="ml-auto transition-transform">
                  ▾
                </span>
              </summary>
              <div id="quick-actions-panel" className="p-4 max-h-[calc(100vh-8rem)] overflow-auto">
                <SimpleErrorBoundary>
                  <Suspense
                    fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-48"></div>}
                  >
                    <QuickActions />
                  </Suspense>
                </SimpleErrorBoundary>
              </div>
            </details>
          </section>
        </div>
      </main>
    </DashboardManagementBridge>
  );
}
