import DashboardStats from '@/components/dashboard/DashboardStats';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentProposals from '@/components/dashboard/RecentProposals';
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>}>
        <DashboardStats />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div data-testid="recent-proposals">
          <Suspense
            fallback={
              <div className="animate-pulse bg-gray-200 rounded-lg h-64" />
            }
          >
            <RecentProposals />
          </Suspense>
        </div>

        <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-48"></div>}>
          <QuickActions />
        </Suspense>
      </div>

      {/* Debug component removed to prevent server-side unauthorized API calls */}
    </div>
  );
}
