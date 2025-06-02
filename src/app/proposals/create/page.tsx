/**
 * PosalPro MVP2 - Proposal Creation Page
 * Implements PROPOSAL_CREATION_SCREEN.md wireframe with complete wizard workflow
 * Supports H7 (Deadline Management) and H4 (Cross-Department Coordination) validation
 */

import { ProposalWizard } from '@/components/proposals/ProposalWizard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create New Proposal - PosalPro',
  description: 'Create a new proposal with guided wizard and AI assistance',
};

export default function CreateProposalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ProposalWizard />
    </div>
  );
}
