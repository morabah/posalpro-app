/**
 * Proposal Management Page - Modern Architecture
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 */

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import ProposalList from '@/components/proposals/ProposalList';
import { logDebug } from '@/lib/logger';

// ====================
// Main Page Component
// ====================

export default function ProposalManagePage() {
  logDebug('Proposal manage page render', {
    component: 'ProposalManagePage',
    operation: 'render',
    userStory: 'US-3.2',
    hypothesis: 'H4',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Proposals', href: '/proposals' },
              { label: 'Manage', href: '/proposals/manage' },
            ]}
            data-testid="proposals-manage-breadcrumbs"
          />

          {/* Main Content */}
          <div className="mt-6">
            <ProposalList />
          </div>
        </div>
      </div>
    </div>
  );
}
