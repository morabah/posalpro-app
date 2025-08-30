'use client';

/**
 * Proposal Approval Page - Modern Architecture
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 */

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ApprovalQueue } from '@/components/proposals/ApprovalQueue';
import { logDebug } from '@/lib/logger';
import type { QueueMetrics } from '@/components/proposals/ApprovalQueue';
import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

interface ApprovalItem {
  id: string;
  title?: string;
  status?: string;
  priority?: string;
}

// Use QueueMetrics from ApprovalQueue to keep types consistent

export default function ProposalApprovePage() {
  const { data: session } = useSession();

  logDebug('Proposal approve page render', {
    component: 'ProposalApprovePage',
    operation: 'render',
    userStory: 'US-3.2',
    hypothesis: 'H4',
  });

  const handleItemSelect = useCallback((item: ApprovalItem) => {
    logDebug('Item selected', {
      component: 'ProposalApprovePage',
      operation: 'itemSelect',
      itemId: item.id,
    });
  }, []);

  const handleBulkAction = useCallback((action: string, items: ApprovalItem[]) => {
    logDebug('Bulk action', {
      component: 'ProposalApprovePage',
      operation: 'bulkAction',
      action,
      itemCount: items.length,
    });
  }, []);

  const handleQueueOptimization = useCallback((metrics: QueueMetrics) => {
    logDebug('Queue optimization', {
      component: 'ProposalApprovePage',
      operation: 'queueOptimization',
      metrics,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Proposals', href: '/proposals' },
              { label: 'Approve', href: '/proposals/approve' },
            ]}
            data-testid="proposals-approve-breadcrumbs"
          />

          {/* Main Content */}
          <div className="mt-6">
            <ApprovalQueue
              currentUser={session?.user?.id || 'unknown'}
              onItemSelect={handleItemSelect}
              onBulkAction={handleBulkAction}
              onQueueOptimization={handleQueueOptimization}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
