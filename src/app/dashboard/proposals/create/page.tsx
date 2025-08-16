'use client';

import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
const ProposalWizard = dynamic(
  () => import('@/components/proposals/ProposalWizard').then(m => m.ProposalWizard),
  { ssr: false }
);
// import { ProposalWizardData } from '@/types/proposal';

/**
 * Proposal Creation Page
 *
 * This page provides the interface for creating new proposals using the ProposalWizard component.
 * It handles the 6-step proposal creation workflow with proper navigation and error handling.
 */
export default function ProposalCreatePage() {
  const router = useRouter();

  const handleComplete = (proposalData: { proposalId: string }) => {
    // Navigate to the newly created proposal
    router.push(`/proposals/${proposalData.proposalId}`);
  };

  const handleCancel = () => {
    // Navigate back to proposals list
    router.push('/proposals');
  };

  return (
    <ClientLayoutWrapper>
      <QueryProvider>
        <AuthProvider>
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Proposal</h1>
                <p className="text-gray-600">
                  Follow the guided workflow to create a comprehensive proposal for your client.
                </p>
              </div>

              <ProposalWizard onComplete={handleComplete} onCancel={handleCancel} />
            </div>
          </div>
        </AuthProvider>
      </QueryProvider>
    </ClientLayoutWrapper>
  );
}
