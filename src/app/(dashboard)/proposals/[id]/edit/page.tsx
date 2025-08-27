'use client';

/**
 * PosalPro MVP2 - Edit Proposal Page
 * Built from scratch using modern patterns
 * Follows PROPOSAL_MIGRATION_ASSESSMENT.md guidelines
 * Uses the ProposalWizard component in edit mode
 */

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProposalWizard } from '@/components/proposals/ProposalWizard';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface EditProposalPageProps {
  params: Promise<{ id: string }>;
}

function EditProposalContent({ proposalId }: { proposalId: string }) {
  const analytics = useOptimizedAnalytics();
  const router = useRouter();

  const handleComplete = useCallback(
    async (proposalId: string) => {
      logDebug('Proposal edit completed', {
        component: 'EditProposalPage',
        operation: 'handleComplete',
        proposalId,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      analytics.trackOptimized('proposal_updated', {
        proposalId,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      // Redirect to proposal detail page
      logDebug('Redirecting to proposal detail', {
        component: 'EditProposalPage',
        operation: 'handleComplete',
        proposalId,
        redirectUrl: `/proposals/${proposalId}`,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      router.push(`/proposals/${proposalId}`);
    },
    [analytics, router]
  );

  const handleCancel = useCallback(() => {
    analytics.trackOptimized('proposal_edit_cancelled', {
      proposalId,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    // Redirect back to proposal detail page
    router.push(`/proposals/${proposalId}`);
  }, [analytics, router, proposalId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Proposals', href: '/proposals' },
              { label: 'Edit Proposal', href: '#' },
            ]}
          />
        </div>
      </div>

      {/* Main Content */}
      <ProposalWizard
        editMode={true}
        proposalId={proposalId}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default function EditProposalPage({ params }: EditProposalPageProps) {
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params;
        setProposalId(resolvedParams.id);

        logDebug('Edit proposal page loaded', {
          component: 'EditProposalPage',
          operation: 'page_load',
          proposalId: resolvedParams.id,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
      } catch (error) {
        logDebug('Failed to load edit proposal params', {
          component: 'EditProposalPage',
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
  }, [params]);

  // Show consistent loading state for both server and client
  if (isLoading || !proposalId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Proposal</h1>
              <p className="text-gray-600">Loading proposal data...</p>
            </div>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading proposal data...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <EditProposalContent proposalId={proposalId} />;
}
