'use client';

/**
 * PosalPro MVP2 - Edit Proposal Page
 * Built from scratch using modern patterns
 * Follows PROPOSAL_MIGRATION_ASSESSMENT.md guidelines
 * Uses the ProposalWizard component in edit mode
 */

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProposalWizard } from '@/components/proposals/ProposalWizard';
import { qk } from '@/features/proposals/keys';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logError } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface EditProposalPageProps {
  params: Promise<{ id: string }>;
}

function EditProposalContent({ proposalId }: { proposalId: string }) {
  const analytics = useOptimizedAnalytics();
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleComplete = useCallback(
    async (data: string | object) => {
      logDebug('DEBUG: EditProposalPage handleComplete called', {
        component: 'EditProposalPage',
        operation: 'handleComplete',
        dataType: typeof data,
        isWizardPayload: typeof data === 'object',
        dataKeys: typeof data === 'object' ? Object.keys(data as any) : null,
        dataLength: typeof data === 'object' ? JSON.stringify(data).length : null,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      if (typeof data === 'object' && data !== null) {
        const wizardPayload = data as any;
        logDebug('DEBUG: Wizard payload received', {
          component: 'EditProposalPage',
          operation: 'handleComplete',
          hasTeamData: !!wizardPayload.teamData?.teamLead,
          hasContentData: !!wizardPayload.contentData?.selectedTemplates?.length,
          hasProductData: !!wizardPayload.productData?.products?.length,
          hasSectionData: !!wizardPayload.sectionData?.sections?.length,
          productCount: wizardPayload.productData?.products?.length || 0,
          totalValue: wizardPayload.productData?.totalValue || 0,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
      }

      // If we received a wizard payload (edit mode), send it to the API
      if (typeof data === 'object' && data !== null) {
        const wizardPayload = data as any;

        logDebug('Sending wizard payload to API', {
          component: 'EditProposalPage',
          operation: 'handleComplete',
          proposalId,
          hasTeamData: !!wizardPayload.teamData?.teamLead,
          hasContentData: !!wizardPayload.contentData?.selectedTemplates?.length,
          hasProductData: !!wizardPayload.productData?.products?.length,
          hasSectionData: !!wizardPayload.sectionData?.sections?.length,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        try {
          const response = await fetch(`/api/proposals/${proposalId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(wizardPayload),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API update failed: ${response.status} - ${JSON.stringify(errorData)}`);
          }

          const result = await response.json();

          logDebug('Proposal updated successfully', {
            component: 'EditProposalPage',
            operation: 'handleComplete',
            proposalId: result.data?.id,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          });

          analytics.trackOptimized('proposal_updated', {
            proposalId: result.data?.id,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          });
        } catch (error) {
          logError('Failed to update proposal', {
            component: 'EditProposalPage',
            operation: 'handleComplete',
            proposalId,
            error: error instanceof Error ? error.message : 'Unknown error',
            userStory: 'US-3.1',
            hypothesis: 'H4',
          });

          // Still redirect even on error so user doesn't get stuck
          router.push(`/proposals/${proposalId}`);
          return;
        }
      } else {
        // If we received just a proposalId (create mode), just redirect
        const receivedProposalId = data as string;

        analytics.trackOptimized('proposal_created', {
          proposalId: receivedProposalId,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
      }

      // ✅ FORCE CACHE INVALIDATION: Ensure detail page gets fresh data
      logDebug('Invalidating proposal cache before redirect', {
        component: 'EditProposalPage',
        operation: 'invalidateCache',
        proposalId,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      // Remove and invalidate the proposal cache
      queryClient.removeQueries({ queryKey: qk.proposals.byId(proposalId) });
      queryClient.invalidateQueries({ queryKey: qk.proposals.all });

      // Redirect to proposal detail page
      logDebug('Redirecting to proposal detail', {
        component: 'EditProposalPage',
        operation: 'handleComplete',
        proposalId,
        redirectUrl: `/proposals/${proposalId}`,
        cacheInvalidated: true,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      router.push(`/proposals/${proposalId}`);
    },
    [analytics, router, proposalId, queryClient]
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
