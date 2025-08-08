'use client';

import dynamic from 'next/dynamic';

const RecentProposals = dynamic(() => import('../RecentProposals'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64" />,
});

export default function RecentProposalsClient() {
  return <RecentProposals />;
}
