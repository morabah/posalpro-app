import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load components for better performance
const DashboardStats = dynamic(() => import('@/components/dashboard/DashboardStats'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>,
});

const RecentProposals = dynamic(() => import('@/components/dashboard/RecentProposals'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>,
});

const QuickActions = dynamic(() => import('@/components/dashboard/QuickActions'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-48"></div>,
});

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
        <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>}>
          <RecentProposals />
        </Suspense>

        <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-48"></div>}>
          <QuickActions />
        </Suspense>
      </div>
    </div>
  );
}
