'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import {
  CalendarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PencilIcon,
  UserIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProposalDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  projectType: string | null;
  value: number;
  currency: string;
  dueDate: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  approvedAt: string | null;

  // Customer information
  customerId: string;
  customerName: string;
  customerIndustry: string | null;
  customerTier: string | null;
  customerEmail: string | null;

  // Creator information
  createdBy: string;
  createdByEmail: string | null;

  // Related data
  sections: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    order: number;
  }>;

  assignedTo: Array<{
    id: string;
    name: string;
    email: string;
  }>;

  approvals: Array<{
    id: string;
    currentStage: string | null;
    status: string;
    startedAt: string;
    completedAt: string | null;
  }>;

  // Computed fields
  totalSections: number;
  teamSize: number;
  approvalStages: number;
  isOverdue: boolean;
  daysUntilDeadline: number | null;
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const proposalId = params?.id as string;

  // ✅ CRITICAL FIX: Single useEffect with proper dependency management
  useEffect(() => {
    let isMounted = true;

    const fetchProposal = async () => {
      // Only fetch if we have a valid proposalId
      if (!proposalId || typeof proposalId !== 'string') {
        if (isMounted) {
          setError('Invalid proposal ID');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setProposal(null); // Reset previous proposal data

        console.log('[ProposalDetailAPI] Fetching proposal:', proposalId);

        const response = (await apiClient.get(`proposals/${proposalId}`)) as any;

        if (response.success && response.data) {
          // Only update state if component is still mounted
          if (isMounted) {
            setProposal(response.data);
            console.log('[ProposalDetailAPI] Successfully fetched proposal:', proposalId);
          }
        } else {
          throw new StandardError({
            message: 'Failed to fetch proposal details',
            code: ErrorCodes.DATA.QUERY_FAILED,
            metadata: {
              component: 'ProposalDetailPage',
              proposalId,
              response: response || 'No response',
            },
          });
        }
      } catch (err) {
        console.error('[ProposalDetailAPI] Error fetching proposal:', err);

        if (isMounted) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to load proposal details';
          setError(errorMessage);
        }

        // Note: handleAsyncError removed to prevent infinite loops (CORE_REQUIREMENTS.md pattern)
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Fetch proposal data
    fetchProposal();

    return () => {
      isMounted = false;
    };
  }, [proposalId]); // ✅ CRITICAL FIX: Only depend on proposalId, remove apiClient to prevent infinite loops

  const handleBack = () => {
    router.push('/proposals/manage');
  };

  const handleEdit = () => {
    router.push(`/proposals/create?edit=${proposalId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposal details...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The requested proposal could not be loaded.'}
          </p>
          <Button onClick={handleBack} className="inline-flex items-center">
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Back to Proposals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleBack} className="inline-flex items-center">
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Back to Proposals
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
                <p className="text-gray-600 mt-1">Proposal ID: {proposal.id}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Badge className={getStatusColor(proposal.status)}>
                {proposal.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge className={getPriorityColor(proposal.priority)}>
                {proposal.priority.toUpperCase()} Priority
              </Badge>
              <Button onClick={handleEdit} className="inline-flex items-center">
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Proposal
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
              <div className="space-y-4">
                {proposal.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Description</h3>
                    <p className="mt-1 text-gray-900">{proposal.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Project Type</h3>
                    <p className="mt-1 text-gray-900">{proposal.projectType || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Estimated Value</h3>
                    <p className="mt-1 text-gray-900 font-semibold">
                      {formatCurrency(proposal.value, proposal.currency)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Sections */}
            {proposal.sections.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Proposal Sections ({proposal.totalSections})
                </h2>
                <div className="space-y-4">
                  {proposal.sections.map(section => (
                    <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{section.title}</h3>
                        <Badge variant="outline">{section.type}</Badge>
                      </div>
                      <div className="text-gray-700 text-sm">
                        {section.content.length > 300
                          ? `${section.content.substring(0, 300)}...`
                          : section.content}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Team & Approvals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assigned Team */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Assigned Team ({proposal.teamSize})
                </h2>
                <div className="space-y-3">
                  {proposal.assignedTo.length > 0 ? (
                    proposal.assignedTo.map(member => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No team members assigned</p>
                  )}
                </div>
              </Card>

              {/* Approvals */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Approvals ({proposal.approvalStages})
                </h2>
                <div className="space-y-3">
                  {proposal.approvals.length > 0 ? (
                    proposal.approvals.map(approval => (
                      <div key={approval.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {approval.status === 'COMPLETED' ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          ) : approval.status === 'PENDING' ? (
                            <ClockIcon className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {approval.currentStage || 'Initial Stage'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Started {formatDate(approval.startedAt)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {approval.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No approvals configured</p>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Details */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Details</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Due Date</p>
                    <p className="text-sm text-gray-900">
                      {formatDate(proposal.dueDate)}
                      {proposal.isOverdue && (
                        <span className="ml-2 text-red-600 font-medium">(Overdue)</span>
                      )}
                    </p>
                  </div>
                </div>

                {proposal.daysUntilDeadline !== null && (
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Time Remaining</p>
                      <p className="text-sm text-gray-900">
                        {proposal.daysUntilDeadline > 0
                          ? `${proposal.daysUntilDeadline} days`
                          : 'Overdue'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Value</p>
                    <p className="text-sm text-gray-900 font-semibold">
                      {formatCurrency(proposal.value, proposal.currency)}
                    </p>
                  </div>
                </div>

                {proposal.validUntil && (
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Valid Until</p>
                      <p className="text-sm text-gray-900">{formatDate(proposal.validUntil)}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Customer Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Name</p>
                  <p className="text-sm text-gray-900">{proposal.customerName}</p>
                </div>

                {proposal.customerIndustry && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Industry</p>
                    <p className="text-sm text-gray-900">{proposal.customerIndustry}</p>
                  </div>
                )}

                {proposal.customerTier && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Tier</p>
                    <Badge variant="outline" className="text-xs">
                      {proposal.customerTier}
                    </Badge>
                  </div>
                )}

                {proposal.customerEmail && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-900">{proposal.customerEmail}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-sm text-gray-900">{formatDate(proposal.createdAt)}</p>
                  <p className="text-xs text-gray-500">by {proposal.createdBy}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Last Updated</p>
                  <p className="text-sm text-gray-900">{formatDate(proposal.updatedAt)}</p>
                </div>

                {proposal.submittedAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Submitted</p>
                    <p className="text-sm text-gray-900">{formatDate(proposal.submittedAt)}</p>
                  </div>
                )}

                {proposal.approvedAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Approved</p>
                    <p className="text-sm text-gray-900">{formatDate(proposal.approvedAt)}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
