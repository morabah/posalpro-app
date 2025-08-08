'use client';

import dynamic from 'next/dynamic';

const QuickActions = dynamic(() => import('../QuickActions'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-48" />,
});

export default function QuickActionsClient() {
  return <QuickActions />;
}
