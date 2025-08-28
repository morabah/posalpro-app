'use client';

/**
 * PosalPro MVP2 - Modern Proposal Wizard Page
 * Built from scratch using modern patterns
 * Follows PROPOSAL_MIGRATION_ASSESSMENT.md guidelines
 */

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProposalWizard } from '@/components/proposals/ProposalWizard';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface WizardCompletionData {
  proposalId?: string;
  [key: string]: unknown;
}

export default function ProposalWizardPage() {
  const analytics = useOptimizedAnalytics();
  const router = useRouter();

  const handleComplete = useCallback(
    (data: string | WizardCompletionData) => {
      const proposalId = typeof data === 'string' ? data : (data as WizardCompletionData).proposalId || 'unknown';
      logDebug('Proposal wizard completed', {
        component: 'ProposalWizardPage',
        operation: 'handleComplete',
        proposalId,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      analytics.trackOptimized('proposal_created', {
        proposalId,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      // Redirect to proposal detail page using ProposalDetailView_p component
      logDebug('Redirecting to proposal detail', {
        component: 'ProposalWizardPage',
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
    analytics.trackOptimized('proposal_wizard_cancelled', {
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    // Redirect back to proposals list
    router.push('/proposals');
  }, [analytics, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Proposals', href: '/proposals' },
              { label: 'Create Proposal', href: '/proposals/wizard' },
            ]}
          />
        </div>
      </div>

      {/* Wizard */}
      <ProposalWizard onComplete={handleComplete} onCancel={handleCancel} />
    </div>
  );
}
