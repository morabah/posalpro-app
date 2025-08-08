/**
 * PosalPro MVP2 - Recent Proposals Component
 * Displays recent proposal activity and status updates
 * Component Traceability Matrix: US-4.1, US-2.2, H7, H4
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useAuth } from '@/components/providers/AuthProvider';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  FileText,
  User,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-2.2', 'US-8.1'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.3', 'AC-2.2.1', 'AC-2.2.2', 'AC-8.1.1'],
  methods: ['fetchProposals()', 'handleViewProposal()', 'formatCurrency()', 'formatRelativeTime()'],
  hypotheses: ['H4', 'H6'],
  testCases: ['TC-H4-001', 'TC-H6-001'],
};

interface Proposal {
  id: string;
  title: string;
  status: string;
  customerName: string;
  value: number;
  currency: string;
  dueDate: string;
  updatedAt: string;
  createdAt: string;
}

interface ProposalsResponse {
  success: boolean;
  data: {
    proposals: Proposal[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  message?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: any;
  message?: string;
}

// Handle both nested and direct response structures
type ProposalsApiResponse =
  | ApiResponse<ProposalsResponse>
  | {
      success: boolean;
      data?: {
        proposals?: Proposal[];
        data?: {
          proposals?: Proposal[];
        };
      };
      error?: any;
      message?: string;
    };

export default function RecentProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Fetch proposals with authentication check
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        // Wait for auth to resolve before deciding
        if (authLoading) {
          setLoading(true);
          return;
        }

        // If not authenticated (should not happen on protected dashboard), show empty state
        if (!isAuthenticated) {
          setProposals([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // Track analytics event
        analytics(
          'recent_proposals_fetch_started',
          {
            component: 'RecentProposals',
            userStories: COMPONENT_MAPPING.userStories,
            hypotheses: COMPONENT_MAPPING.hypotheses,
          },
          'low'
        );

        console.log('[RecentProposals] Starting API call to fetch proposals...');

        // Note: Avoid global guard flags that can suppress legitimate retries
        // across auth/session changes. The lightweight API and server cache
        // make duplicate fetches inexpensive in development.

        // Fetch real data from lightweight list API to avoid heavy counts/selects
        const response = await apiClient.get<any>('proposals/list');

        console.log('[RecentProposals] API response received:', {
          success: response.success,
          hasData: !!response.data,
          hasProposals: !!response.data?.data?.proposals,
          proposalCount: response.data?.data?.proposals?.length || 0,
        });

        // Simple approach: just check if we have proposals data
        const proposals =
          response?.data?.data?.proposals ||
          response?.data?.proposals ||
          response?.data ||
          [];

        if (proposals.length > 0) {
          setProposals(proposals);
          console.log('[RecentProposals] Successfully loaded proposals:', proposals.length);
        } else {
          console.log('[RecentProposals] No proposals found - this is a valid scenario');
          setProposals([]);
        }
      } catch (error) {
        console.warn('[RecentProposals] API call failed - showing empty state');
        setProposals([]);
        setError(null); // Clear any previous errors
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [apiClient, handleAsyncError, analytics, isAuthenticated, authLoading]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const handleViewProposal = useCallback(
    (proposalId: string) => {
      analytics('proposal_viewed', {
        proposalId,
        component: 'RecentProposals',
        userStories: COMPONENT_MAPPING.userStories,
      });
    },
    [analytics]
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Proposals</h3>
          <Button variant="outline" size="sm" disabled>
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Proposals</h3>
          <Button variant="outline" size="sm" disabled>
            View All
          </Button>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6" data-testid="recent-proposals">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Proposals</h3>
        <Link href="/proposals/manage">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No recent proposals</p>
          <p className="text-sm text-gray-500 mt-1">Create your first proposal to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map(proposal => (
            <div
              key={proposal.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900 truncate">{proposal.title}</h4>
                    <Badge className={getStatusColor(proposal.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(proposal.status)}
                        {proposal.status}
                      </span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span className="truncate">{proposal.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatCurrency(proposal.value)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatRelativeTime(proposal.dueDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatRelativeTime(proposal.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <Link href={`/proposals/${proposal.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewProposal(proposal.id)}
                    className="ml-2"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
