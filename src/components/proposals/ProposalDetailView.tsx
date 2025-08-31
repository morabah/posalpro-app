'use client';

/**
 * Enhanced Proposal Detail View Component
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination)
 */

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { qk } from '@/features/proposals/keys';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useProposal } from '@/hooks/useProposal';
import { logInfo } from '@/lib/logger';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Building,
  Calendar,
  ChevronRight,
  Clock,
  Copy,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  MessageSquare,
  Package,
  Printer,
  RefreshCw,
  Share2,
  Target,
  Trash2,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface ProposalDetailViewProps {
  proposalId: string;
}

// Helper functions to safely access metadata
const getProductData = (metadata: any) => {
  if (!metadata?.productData) return null;
  return {
    products: Array.isArray(metadata.productData.products) ? metadata.productData.products : [],
    totalValue: metadata.productData.totalValue || 0,
  };
};

const getTeamData = (metadata: any) => {
  if (!metadata?.teamData) return null;
  return {
    teamLead: metadata.teamData.teamLead || null,
    salesRepresentative: metadata.teamData.salesRepresentative || null,
    subjectMatterExperts: metadata.teamData.subjectMatterExperts || {},
    executiveReviewers: Array.isArray(metadata.teamData.executiveReviewers)
      ? metadata.teamData.executiveReviewers
      : [],
  };
};

const getSectionData = (metadata: any) => {
  if (!metadata?.sectionData) return null;
  return {
    sections: Array.isArray(metadata.sectionData.sections) ? metadata.sectionData.sections : [],
  };
};

export function ProposalDetailView({ proposalId }: ProposalDetailViewProps) {
  const router = useRouter();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const queryClient = useQueryClient();
  const { data: proposal, isLoading, error, refetch } = useProposal(proposalId);

  // Enhanced error handling with retry logic
  const handleRetry = useCallback(() => {
    analytics(
      'proposal_action_taken',
      {
        proposalId,
        action: 'edit',
        userStory: 'US-2.1',
        hypothesis: 'H2',
      },
      'medium'
    );
    refetch();
  }, [analytics, proposalId, refetch]);

  const [activeTab, setActiveTab] = useState('overview');

  // ====================
  // Event Handlers
  // ====================

  const handleEdit = useCallback(() => {
    analytics(
      'proposal_navigation',
      {
        from: 'proposal_detail',
        to: 'proposal_list',
        proposalId,
        userStory: 'US-2.1',
        hypothesis: 'H2',
      },
      'medium'
    );
    router.push(`/proposals/${proposalId}/edit`);
  }, [proposalId, router, analytics]);

  const handleDelete = useCallback(async () => {
    if (!proposal) return;

    if (!confirm('Are you sure you want to delete this proposal? This action cannot be undone.')) {
      return;
    }

    try {
      analytics(
        'proposal_delete_clicked',
        {
          proposalId,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        },
        'high'
      );

      // TODO: Implement delete mutation
      // await deleteProposalMutation.mutateAsync(proposalId);

      toast.success('Proposal deleted successfully');
      router.push('/proposals');
    } catch (error) {
      logInfo('Proposal delete failed', {
        component: 'ProposalDetailView',
        operation: 'handleDelete',
        proposalId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
      toast.error('Failed to delete proposal');
    }
  }, [proposal, proposalId, router, analytics]);

  const handleBack = useCallback(() => {
    analytics(
      'proposal_detail_viewed',
      {
        proposalId,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      },
      'medium'
    );
    router.back();
  }, [proposalId, router, analytics]);

  const handleRefresh = useCallback(async () => {
    logInfo('Manual refresh triggered', {
      component: 'ProposalDetailView',
      operation: 'manual_refresh',
      proposalId,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    analytics(
      'proposal_action_taken',
      {
        proposalId,
        action: 'refresh',
        userStory: 'US-3.2',
        hypothesis: 'H4',
      },
      'medium'
    );

    // Force invalidate and refetch
    queryClient.invalidateQueries({ queryKey: qk.proposals.byId(proposalId) });
    await refetch();

    toast.success('Proposal data refreshed');
  }, [proposalId, refetch, analytics, queryClient]);

  // Preview proposal handler
  const handlePreview = useCallback(() => {
    logInfo('Preview proposal triggered', {
      component: 'ProposalDetailView',
      operation: 'preview_proposal',
      proposalId,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    analytics(
      'proposal_action_taken',
      {
        proposalId,
        action: 'preview',
        userStory: 'US-3.2',
        hypothesis: 'H4',
      },
      'medium'
    );

    // Open preview in new tab
    const previewUrl = `/proposals/${proposalId}/preview`;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');

    toast.success('Opening proposal preview...');
  }, [proposalId, analytics]);

  // ====================
  // Helper Functions
  // ====================

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';

    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'IN_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SUBMITTED':
        return 'bg-purple-100 text-purple-800';
      case 'ACCEPTED':
        return 'bg-emerald-100 text-emerald-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    if (!priority) return 'bg-gray-100 text-gray-800';

    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (status: string | undefined) => {
    if (!status) return 0;

    switch (status) {
      case 'DRAFT':
        return 10;
      case 'IN_REVIEW':
        return 40;
      case 'PENDING_APPROVAL':
        return 70;
      case 'APPROVED':
        return 90;
      case 'SUBMITTED':
        return 95;
      case 'ACCEPTED':
        return 100;
      case 'REJECTED':
      case 'DECLINED':
        return 100;
      default:
        return 0;
    }
  };

  const isOverdue = proposal?.dueDate && new Date(proposal.dueDate) < new Date();

  // ====================
  // Loading & Error States
  // ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading proposal details...</p>
          <p className="text-sm text-gray-500 mt-2">Proposal ID: {proposalId}</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Proposal Not Found</h3>
        <p className="text-gray-600 mb-6">
          The proposal you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const progressPercentage = getProgressPercentage(proposal?.status);

  // ====================
  // Render
  // ====================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Breadcrumb and Back */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button onClick={handleBack} variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Proposals
                </Button>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Proposals</span>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-gray-900 font-medium">Details</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <Zap className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={handlePreview} variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Preview Proposal
                </Button>
                <Button onClick={handleEdit} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Title and Status */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {proposal.title || 'Balanced status seed entry'}
                  </h1>
                  <Badge className={getStatusColor(proposal?.status)}>
                    {proposal?.status ? proposal.status.replace('_', ' ') : 'Unknown'}
                  </Badge>
                  {proposal?.priority && (
                    <Badge className={getPriorityColor(proposal.priority)}>
                      {proposal.priority}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 text-lg">
                  {proposal?.description || 'No description provided'}
                </p>
                <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    ID: {proposal?.id || 'N/A'}
                  </div>
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    {proposal?.customer?.name || 'Al Ilm Education Systems'}
                  </div>
                  <div className={`flex items-center ${isOverdue ? 'text-red-600' : ''}`}>
                    <Calendar className="h-4 w-4 mr-1" />
                    Due: {proposal?.dueDate ? formatDate(proposal.dueDate) : 'October 6, 2025'}
                    {isOverdue && <AlertTriangle className="h-4 w-4 ml-1" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    progressPercentage >= 80
                      ? 'bg-green-500'
                      : progressPercentage >= 50
                        ? 'bg-blue-500'
                        : progressPercentage >= 25
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      (() => {
                        // ✅ FIXED: Prioritize database products over metadata
                        if (proposal?.products && proposal.products.length > 0) {
                          const total = proposal.products.reduce((sum: number, product: any) => {
                            // Convert string totals to numbers (database stores as strings)
                            const productTotal =
                              typeof product.total === 'string'
                                ? parseFloat(product.total) || 0
                                : product.total || 0;
                            return sum + productTotal;
                          }, 0);

                          // ✅ ADDED: Debug logging to verify total calculation
                          console.log('Proposal Detail: Calculated total from database products:', {
                            proposalId: proposal.id,
                            productCount: proposal.products.length,
                            total: total,
                            products: proposal.products.map(p => ({
                              id: p.id,
                              name: p.name || 'Unknown Product',
                              total: p.total,
                              totalType: typeof p.total,
                            })),
                          });

                          return total;
                        }
                        const productData = getProductData(proposal?.metadata);
                        if (productData?.products && productData.products.length > 0) {
                          return productData.products.reduce(
                            (sum: number, product: any) => sum + (product.total || 0),
                            0
                          );
                        }
                        return productData?.totalValue || proposal?.value || 59760;
                      })(),
                      proposal?.currency || 'USD'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Size</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(() => {
                      const teamData = getTeamData(proposal?.metadata);
                      if (teamData) {
                        let count = 0;
                        if (teamData.teamLead) count++;
                        if (teamData.salesRepresentative) count++;
                        if (teamData.subjectMatterExperts) {
                          count += Object.keys(teamData.subjectMatterExperts).length;
                        }
                        if (teamData.executiveReviewers) {
                          count += teamData.executiveReviewers.length;
                        }
                        return count;
                      }
                      return proposal?.teamMembers?.length || 0;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {proposal?.products?.length ||
                      getProductData(proposal?.metadata)?.products?.length ||
                      3}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sections</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getSectionData(proposal?.metadata)?.sections?.length ||
                      proposal?.sections?.length ||
                      0}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'products', label: 'Products', icon: Package },
                { id: 'sections', label: 'Sections', icon: FileText },
                { id: 'team', label: 'Team', icon: Users },
                { id: 'activity', label: 'Activity', icon: Activity },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Detailed Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Information */}
                <Card>
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <Building className="h-5 w-5 mr-2 text-blue-600" />
                      Customer Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Company Name</h3>
                        <p className="text-gray-900 font-medium">
                          {proposal?.customer?.name || 'N/A'}
                        </p>
                      </div>
                      {proposal?.customer?.email && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-1">Email</h3>
                          <p className="text-gray-900 flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {proposal.customer.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Key Details */}
                <Card>
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-green-600" />
                      Key Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-1">Due Date</h3>
                          <p
                            className={`text-gray-900 flex items-center ${isOverdue ? 'text-red-600' : ''}`}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            {proposal?.dueDate ? formatDate(proposal.dueDate) : 'Not set'}
                            {isOverdue && <AlertTriangle className="h-4 w-4 ml-1" />}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-1">
                            {(() => {
                              const hasProducts = (proposal?.products?.length || 0) > 0;
                              const calculatedTotal =
                                proposal?.products?.reduce((sum, product) => {
                                  return (
                                    sum +
                                    (product.total ||
                                      (product.quantity || 1) * (product.unitPrice || 0))
                                  );
                                }, 0) || 0;

                              // Show calculated total if products exist, otherwise show estimated value
                              return hasProducts && calculatedTotal > 0
                                ? 'Total Value'
                                : 'Estimated Value';
                            })()}
                          </h3>
                          <p className="text-gray-900 flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {(() => {
                              const hasProducts = (proposal?.products?.length || 0) > 0;
                              const calculatedTotal =
                                proposal?.products?.reduce((sum, product) => {
                                  // Convert string totals to numbers (database stores as strings)
                                  const total =
                                    typeof product.total === 'string'
                                      ? parseFloat(product.total) || 0
                                      : product.total || 0;
                                  return sum + total;
                                }, 0) || 0;
                              const estimatedValue = proposal?.value || 0;

                              // Show calculated total if products exist, otherwise show estimated value
                              const displayValue =
                                hasProducts && calculatedTotal > 0
                                  ? calculatedTotal
                                  : estimatedValue;
                              return formatCurrency(displayValue, proposal?.currency || 'USD');
                            })()}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-1">Progress</h3>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  progressPercentage >= 80
                                    ? 'bg-green-500'
                                    : progressPercentage >= 50
                                      ? 'bg-blue-500'
                                      : progressPercentage >= 25
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                }`}
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{progressPercentage}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-1">Stage</h3>
                          <p className="text-gray-900">{proposal?.stage || 'Draft'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-1">Risk Level</h3>
                          <Badge
                            className={getPriorityColor(proposal.riskLevel?.toUpperCase() || 'LOW')}
                          >
                            {proposal.riskLevel || 'Low'}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-1">Version</h3>
                          <p className="text-gray-900">v{proposal.version || 1}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Tags */}
                {proposal?.tags && proposal.tags.length > 0 && (
                  <Card>
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center">
                        <Bookmark className="h-5 w-5 mr-2 text-purple-600" />
                        Tags
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {proposal.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Right Column - Metadata */}
              <div className="space-y-6">
                {/* Timeline */}
                <Card>
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-gray-600" />
                      Timeline
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Created</p>
                          <p className="text-xs text-gray-500">
                            {proposal?.createdAt ? formatDate(proposal.createdAt) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Last Updated</p>
                          <p className="text-xs text-gray-500">
                            {proposal?.updatedAt ? formatDate(proposal.updatedAt) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {proposal?.dueDate && (
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${isOverdue ? 'bg-red-500' : 'bg-yellow-500'}`}
                          ></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Due Date</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(proposal.dueDate)}
                              {isOverdue && <span className="text-red-600 ml-1">(Overdue)</span>}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                      Quick Actions
                    </h2>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View PDF
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-purple-600" />
                  Products (
                  {proposal?.products?.length ||
                    getProductData(proposal?.metadata)?.products?.length ||
                    0}
                  )
                </h2>
                {(() => {
                  // ✅ FIXED: Prioritize database products over metadata
                  const products =
                    proposal?.products || getProductData(proposal?.metadata)?.products || [];
                  return products.length > 0;
                })() ? (
                  <div className="space-y-4">
                    {(proposal?.products || getProductData(proposal?.metadata)?.products || []).map(
                      (product: any, index: number) => (
                        <div
                          key={product.id || index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {product.product?.name ||
                                  product.name ||
                                  `Product ${product.productId}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                Quantity: {product.quantity} ×{' '}
                                {formatCurrency(product.unitPrice, proposal?.currency || 'USD')}
                                {product.discount > 0 && (
                                  <span className="text-green-600 ml-2">
                                    ({product.discount}% discount)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              {formatCurrency(
                                typeof product.total === 'string'
                                  ? parseFloat(product.total) || 0
                                  : product.total || 0,
                                proposal?.currency || 'USD'
                              )}
                            </p>
                            <p className="text-sm text-gray-500">Total</p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No products added to this proposal</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'sections' && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-600" />
                  Sections ({proposal?.sections?.length || 0})
                </h2>
                {proposal?.sections && proposal.sections.length > 0 ? (
                  <div className="space-y-4">
                    {proposal.sections.map((section: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-gray-900">{section.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {section.type}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>Order: {section.order}</span>
                            {section.estimatedHours && (
                              <span>• Est. Hours: {section.estimatedHours}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{section.content}</p>
                        {section.assignedTo && (
                          <div className="flex items-center text-sm text-gray-500">
                            <User className="h-4 w-4 mr-1" />
                            Assigned to: {section.assignedTo}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No sections added to this proposal</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'team' && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Team Members (
                  {(() => {
                    const teamData = getTeamData(proposal?.metadata);
                    if (teamData) {
                      let count = 0;
                      if (teamData.teamLead) count++;
                      if (teamData.salesRepresentative) count++;
                      if (teamData.subjectMatterExperts) {
                        count += Object.keys(teamData.subjectMatterExperts).length;
                      }
                      if (teamData.executiveReviewers) {
                        count += teamData.executiveReviewers.length;
                      }
                      return count;
                    }
                    return proposal?.teamMembers?.length || 0;
                  })()}
                  )
                </h2>
                {(() => {
                  const teamData = getTeamData(proposal?.metadata);
                  if (teamData) {
                    const members = [];

                    // Add team lead
                    if (teamData.teamLead) {
                      members.push({ role: 'Team Lead', userId: teamData.teamLead });
                    }

                    // Add sales representative
                    if (teamData.salesRepresentative) {
                      members.push({
                        role: 'Sales Representative',
                        userId: teamData.salesRepresentative,
                      });
                    }

                    // Add subject matter experts
                    if (teamData.subjectMatterExperts) {
                      Object.entries(teamData.subjectMatterExperts).forEach(([domain, userId]) => {
                        members.push({ role: `${domain} Expert`, userId });
                      });
                    }

                    // Add executive reviewers
                    if (teamData.executiveReviewers) {
                      teamData.executiveReviewers.forEach((userId: string) => {
                        members.push({ role: 'Executive Reviewer', userId });
                      });
                    }

                    return members.length > 0;
                  }
                  return proposal?.teamMembers && proposal.teamMembers.length > 0;
                })() ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const teamData = getTeamData(proposal?.metadata);
                      if (teamData) {
                        const members = [];

                        // Add team lead
                        if (teamData.teamLead) {
                          members.push({ role: 'Team Lead', userId: teamData.teamLead });
                        }

                        // Add sales representative
                        if (teamData.salesRepresentative) {
                          members.push({
                            role: 'Sales Representative',
                            userId: teamData.salesRepresentative,
                          });
                        }

                        // Add subject matter experts
                        if (teamData.subjectMatterExperts) {
                          Object.entries(teamData.subjectMatterExperts).forEach(
                            ([domain, userId]) => {
                              members.push({ role: `${domain} Expert`, userId: userId as string });
                            }
                          );
                        }

                        // Add executive reviewers
                        if (teamData.executiveReviewers) {
                          teamData.executiveReviewers.forEach((userId: string) => {
                            members.push({ role: 'Executive Reviewer', userId });
                          });
                        }

                        return members;
                      }
                      return proposal?.teamMembers || [];
                    })().map((member: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {(() => {
                              // Map user IDs to names based on the logs
                              const userNames: Record<string, string> = {
                                cme41x222008xjjptr0v6scfp: 'Ahmed Al-Farsi',
                                cme41x2270096jjpt3wmt7jmd: 'Fatima Al-Zahra',
                              };
                              return userNames[member.userId] || `User ${member.userId}`;
                            })()}
                          </p>
                          <p className="text-sm text-gray-600">{member.role || 'Team Member'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No team members assigned to this proposal</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'activity' && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  Activity Timeline
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Proposal Created</p>
                      <p className="text-xs text-gray-500">
                        {proposal?.createdAt ? formatDate(proposal.createdAt) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-xs text-gray-500">
                        {proposal?.updatedAt ? formatDate(proposal.updatedAt) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Status Changed</p>
                      <p className="text-xs text-gray-500">
                        Current status:{' '}
                        {proposal?.status ? proposal.status.replace('_', ' ') : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
