/**
 * PosalPro MVP2 - Recent Proposals Component
 * Displays recent proposal activity and status updates
 * Component Traceability Matrix: US-4.1, US-2.2, H7, H4
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { memo, useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-2.2'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-2.2.1'],
  methods: ['fetchRecentProposals()', 'trackProposalViewed()'],
  hypotheses: ['H7', 'H4'],
  testCases: ['TC-H7-001', 'TC-H4-001'],
};

interface Proposal {
  id: string;
  title: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  customer: string;
  value: number;
  dueDate: string;
  updatedAt: string;
}

const RecentProposals = memo(() => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);

        // Track analytics event
        analytics('recent_proposals_fetch_started', {
          component: 'RecentProposals',
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
        }, 'low');

        // Mock data for demonstration
        const mockProposals: Proposal[] = [
          {
            id: '1',
            title: 'Enterprise Software Solution',
            status: 'under_review',
            customer: 'Acme Corporation',
            value: 250000,
            dueDate: '2025-07-15',
            updatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          },
          {
            id: '2',
            title: 'Cloud Migration Project',
            status: 'approved',
            customer: 'Tech Solutions Inc',
            value: 180000,
            dueDate: '2025-08-01',
            updatedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          },
          {
            id: '3',
            title: 'Security Audit Services',
            status: 'submitted',
            customer: 'Global Services Ltd',
            value: 75000,
            dueDate: '2025-07-30',
            updatedAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
          },
          {
            id: '4',
            title: 'Digital Transformation',
            status: 'draft',
            customer: 'Innovation Labs',
            value: 500000,
            dueDate: '2025-09-15',
            updatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          },
          {
            id: '5',
            title: 'Data Analytics Platform',
            status: 'rejected',
            customer: 'StartupCo',
            value: 120000,
            dueDate: '2025-07-10',
            updatedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          },
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 400));

        setProposals(mockProposals);

        // Track successful fetch
        analytics('recent_proposals_fetch_success', {
          component: 'RecentProposals',
          proposalCount: mockProposals.length,
        }, 'low');
      } catch (error) {
        console.warn('[RecentProposals] Error fetching proposals:', error);

        // Track error
        analytics('recent_proposals_fetch_error', {
          component: 'RecentProposals',
          error: error instanceof Error ? error.message : 'Unknown error',
        }, 'medium');
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'under_review':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'submitted':
        return <ExclamationTriangleIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleViewProposal = (proposalId: string) => {
    analytics('recent_proposal_view_clicked', {
      component: 'RecentProposals',
      proposalId,
    }, 'medium');
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Proposals</h3>
        <Link href="/proposals">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {proposals.length > 0 ? (
          proposals.map(proposal => (
            <div
              key={proposal.id}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">{getStatusIcon(proposal.status)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{proposal.title}</h4>
                  <Badge className={getStatusColor(proposal.status)}>
                    {proposal.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{proposal.customer}</span>
                  <span>{formatCurrency(proposal.value)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>Due: {new Date(proposal.dueDate).toLocaleDateString()}</span>
                  <span>{formatRelativeTime(proposal.updatedAt)}</span>
                </div>
              </div>

              <div className="flex-shrink-0">
                <Link href={`/proposals/${proposal.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    onClick={() => handleViewProposal(proposal.id)}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-sm font-medium text-gray-900 mb-2">No recent proposals</h4>
            <p className="text-sm text-gray-600 mb-4">Create your first proposal to get started</p>
            <Link href="/proposals/create">
              <Button size="sm">Create Proposal</Button>
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
});
RecentProposals.displayName = 'RecentProposals';

export default RecentProposals;
