'use client';

import dynamic from 'next/dynamic';

const DashboardStats = dynamic(() => import('../DashboardStats'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-32" />,
});

export default function DashboardStatsClient() {
  return <DashboardStats />;
}
