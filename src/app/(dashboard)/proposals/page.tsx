/**
 * Proposals Page - Modern Architecture
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 */

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import ProposalList from '@/components/proposals/ProposalList';
import { logDebug } from '@/lib/logger';

export default function ProposalsPage() {
  logDebug('Proposals page render', {
    component: 'ProposalsPage',
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
            ]}
            data-testid="proposals-breadcrumbs"
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
