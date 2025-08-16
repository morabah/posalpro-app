import dynamic from 'next/dynamic';
import { Suspense } from 'react';

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

export default function DashboardPage() {
  return (
    <main aria-labelledby="page-title" className="space-y-6 p-6">
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 backdrop-blur bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h1 id="page-title" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          {/* Right-side actions reserved for future enhancements (e.g., date range) */}
        </div>
      </div>

      {/* Enhanced Business-Priority Dashboard */}
      <section aria-labelledby="enhanced-dashboard-heading">
        <h2 id="enhanced-dashboard-heading" className="sr-only">
          Enhanced Business Dashboard
        </h2>
        <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-96"></div>}>
          <EnhancedDashboard />
        </Suspense>
      </section>

      {/* Additional Analytics (Collapsible) */}
      <section aria-labelledby="detailed-analytics-heading">
        <details className="group rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
          <summary className="cursor-pointer list-none select-none px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t-lg">
            <span id="detailed-analytics-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Detailed Analytics
            </span>
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <span className="group-open:inline hidden">Collapse</span>
              <span className="group-open:hidden inline">Expand</span>
              <span aria-hidden className="transition-transform group-open:rotate-180">▾</span>
            </span>
          </summary>
          <div className="p-4">
            <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-64" />}>
              <DashboardCharts />
            </Suspense>
          </div>
        </details>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:flex lg:flex-row">
        <section
          aria-labelledby="recent-heading"
          className="lg:flex-1 min-w-0"
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
              <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-64" />}>
                <RecentProposals />
              </Suspense>
            </div>
          </details>
        </section>

        <section
          aria-labelledby="quick-actions-heading"
          className="lg:basis-[440px] lg:min-w-[320px] lg:max-w-[720px] lg:sticky lg:top-24 lg:self-start overflow-visible"
          data-testid="quick-actions-section"
        >
          <details
            open
            className="group rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 resize-x lg:resize-x overflow-auto"
            style={{ resize: 'horizontal' }}
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
              <Suspense
                fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-48"></div>}
              >
                <QuickActions />
              </Suspense>
            </div>
          </details>
        </section>
      </div>

      {/* Debug component removed to prevent server-side unauthorized API calls */}
    </main>
  );
}
