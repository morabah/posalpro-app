'use client';

/**
 * PosalPro MVP2 - Modern Proposal Detail Page
 * Built from scratch using modern patterns
 * Follows PROPOSAL_MIGRATION_ASSESSMENT.md guidelines
 */

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProposalDetailView } from '@/components/proposals/ProposalDetailView';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logError } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProposalDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProposalDetailPage({ params }: ProposalDetailPageProps) {
  const analytics = useOptimizedAnalytics();
  const router = useRouter();
  const [proposalId, setProposalId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params;
        setProposalId(resolvedParams.id);

        logDebug('Proposal detail page loaded', {
          component: 'ProposalDetailPage',
          operation: 'page_load',
          proposalId: resolvedParams.id,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        analytics.trackOptimized('proposal_detail_viewed', {
          proposalId: resolvedParams.id,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
      } catch (error) {
        logError('Failed to load proposal detail params', {
          component: 'ProposalDetailPage',
          operation: 'page_load',
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadParams();
  }, [params, analytics]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Proposals', href: '/proposals' },
              { label: `Proposal ${proposalId}`, href: `/proposals/${proposalId}` },
            ]}
          />
        </div>
      </div>

      {/* Content */}
      <ProposalDetailView proposalId={proposalId} />
    </div>
  );
}
