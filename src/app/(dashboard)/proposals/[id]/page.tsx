'use client';

/**
 * PosalPro MVP2 - Proposal Detail Page with Bridge Integration
 * ✅ BRIDGE PATTERN IMPLEMENTATION: Migrated from React Query to Bridge patterns
 *
 * CORE_REQUIREMENTS.md Compliance:
 * - Uses bridge patterns for API, State, and Event management
 * - Implements proper error handling with ErrorHandlingService
 * - Uses structured logging with @/lib/logger
 * - Follows established bridge patterns from DashboardManagementBridge
 * - Uses empty dependency arrays for mount-only effects
 * - Defers bridge calls to prevent setState during render
 */

import { ProposalDetailManagementBridge } from '@/components/bridges/ProposalDetailManagementBridge';
import { WizardSummary } from '@/components/proposals/WizardSummary';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useProposalDetailBridge } from '@/hooks/proposals/useProposalDetailBridge';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
  PaperClipIcon,
  PencilIcon,
  TagIcon,
  UserIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

// ✅ COMPONENT TRACEABILITY MATRIX
const COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2', 'US-3.3'],
  acceptanceCriteria: ['AC-3.1.1', 'AC-3.2.1', 'AC-3.3.1'],
  methods: ['getProposalDetail()', 'enrichProposal()', 'calculateProposalValue()'],
  hypotheses: ['H4', 'H6', 'H8'],
  testCases: ['TC-H4-001', 'TC-H6-001', 'TC-H8-001'],
};

// ✅ TYPE DEFINITIONS (following gold standard patterns)
interface WizardStep2 {
  customerInfo?: {
    name: string;
    industry: string;
    contactPerson: string;
  };
  projectDetails?: {
    description: string;
    objectives: string[];
    constraints: string[];
  };
}

interface ContentSelection {
  contentId: string;
  title: string;
  type: string;
  customizations: Array<{
    field: string;
    value: string;
    type: 'text' | 'number' | 'boolean';
  }>;
}

interface ValidationIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
  severity: 'low' | 'medium' | 'high';
}

interface ComplianceCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'pending';
  description: string;
}

interface StepCompletionTime {
  step: number;
  stepName: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface ProposalDetail {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customerId?: string;
  customerName?: string;
  customerIndustry?: string;
  customerTier?: string;
  estimatedValue?: number;
  priority?: string;
  dueDate?: string;
  validUntil?: string;
  value?: number;
  currency?: string;
  projectType?: string;
  createdByEmail?: string;
  teamSize?: number;
  totalSections?: number;
  daysUntilDeadline?: number | null;
  sections?: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    order: number;
  }>;
  assignedTo?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  approvals?: Array<{
    id: string;
    currentStage: string | null;
    status: string;
    startedAt: string;
    completedAt: string | null;
  }>;
  approvalStages?: number;
  metadata?: {
    wizardData?: {
      step1?: {
        client?: {
          name?: string;
          industry?: string;
          contactPerson?: string;
          contactPhone?: string;
        };
        details?: {
          title?: string;
          dueDate?: string;
          estimatedValue?: number;
          priority?: string;
        };
        value?: number;
      };
      step2?: WizardStep2;
      step3?: {
        selectedContent?: ContentSelection[];
      };
      step4?: {
        products?: Array<{
          id: string;
          name: string;
          quantity?: number;
          unitPrice?: number;
          totalPrice?: number;
          category?: string;
          included?: boolean;
        }>;
        totalValue?: number;
      };
      step5?: {
        sections?: Array<{ title?: string; description?: string }>;
      };
      step6?: {
        finalValidation?: {
          isValid: boolean;
          issues: ValidationIssue[];
        };
      };
    };
  };
  wizardData?: {
    step1?: {
      client?: {
        name?: string;
        industry?: string;
        contactPerson?: string;
        contactPhone?: string;
      };
      details?: {
        title?: string;
        dueDate?: string;
        estimatedValue?: number;
        priority?: string;
      };
      value?: number;
    };
    step2?: WizardStep2;
    step3?: {
      selectedContent?: ContentSelection[];
    };
    step4?: {
      products?: Array<{
        id: string;
        name: string;
        quantity?: number;
        unitPrice?: number;
        totalPrice?: number;
        category?: string;
        included?: boolean;
      }>;
      totalValue?: number;
    };
    step5?: {
      sections?: Array<{ title?: string; description?: string }>;
    };
    step6?: {
      finalValidation?: {
        isValid: boolean;
        issues: ValidationIssue[];
      };
    };
  } | null;
  teamAssignments?: {
    teamLead?: string;
    salesRepresentative?: string;
    subjectMatterExperts?: Record<string, string>;
    executiveReviewers?: string[];
  } | null;
  contentSelections?: Array<{
    contentId: string;
    section: string;
    customizations: Array<{
      field: string;
      value: string;
      type: 'text' | 'number' | 'boolean';
    }>;
    assignedTo: string;
  }> | null;
  validationData?: {
    isValid?: boolean;
    completeness?: number;
    issues?: ValidationIssue[];
    complianceChecks?: ComplianceCheck[];
  } | null;
  analyticsData?: {
    stepCompletionTimes?: StepCompletionTime[];
    wizardCompletionRate?: number;
    complexityScore?: number;
    teamSize?: number;
    contentSuggestionsUsed?: number;
    validationIssuesFound?: number;
  } | null;
  crossStepValidation?: {
    teamCompatibility?: boolean;
    contentAlignment?: boolean;
    budgetCompliance?: boolean;
    timelineRealistic?: boolean;
  } | null;
}

// ✅ UTILITY FUNCTIONS: Following gold standard patterns
const isLikelyProposalId = (id: string): boolean => {
  return /^[a-zA-Z0-9-_]{3,50}$/.test(id);
};

const normalizePriority = (priority: string | undefined): string => {
  if (!priority) return 'medium';
  const normalized = priority.toLowerCase().trim();
  if (['low', 'medium', 'high', 'critical'].includes(normalized)) {
    return normalized;
  }
  return 'medium';
};

const calculateProposalValue = (
  proposal: ProposalDetail
): { value: number; source: 'wizard' | 'database' } => {
  // Try wizard data first
  const wizardValue = proposal.wizardData?.step1?.value;
  if (typeof wizardValue === 'number' && wizardValue > 0) {
    return { value: wizardValue, source: 'wizard' };
  }

  // Fall back to database value
  const dbValue = proposal.value || proposal.estimatedValue || 0;
  return { value: dbValue, source: 'database' };
};

const enrichProposal = (raw: ProposalDetail): ProposalDetail => {
  const wd = raw.wizardData;
  const md = raw.metadata;

  // Step 1
  const step1 = {
    client: {
      name: wd?.step1?.client?.name ?? raw?.customerName ?? md?.wizardData?.step1?.client?.name,
      industry:
        wd?.step1?.client?.industry ??
        raw?.customerIndustry ??
        md?.wizardData?.step1?.client?.industry,
      contactPerson:
        wd?.step1?.client?.contactPerson ?? md?.wizardData?.step1?.client?.contactPerson,
      contactPhone: wd?.step1?.client?.contactPhone ?? md?.wizardData?.step1?.client?.contactPhone,
    },
    details: {
      title: wd?.step1?.details?.title ?? raw?.title ?? md?.wizardData?.step1?.details?.title,
      dueDate:
        wd?.step1?.details?.dueDate ?? raw?.dueDate ?? md?.wizardData?.step1?.details?.dueDate,
      estimatedValue:
        wd?.step1?.details?.estimatedValue ??
        raw?.value ??
        md?.wizardData?.step1?.details?.estimatedValue,
      priority:
        normalizePriority(wd?.step1?.details?.priority) ||
        normalizePriority(raw?.priority) ||
        normalizePriority(md?.wizardData?.step1?.details?.priority),
    },
    value: wd?.step1?.value ?? raw?.value ?? 0,
  };

  // Step 3
  const step3 = {
    selectedContent:
      wd?.step3?.selectedContent?.map((c: ContentSelection) => ({
        contentId: c.contentId,
        title: c.title,
        type: c.type,
        customizations: c.customizations || [],
      })) || [],
  };

  // Step 4
  const step4 = {
    products:
      wd?.step4?.products?.map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalPrice: p.totalPrice,
        category: p.category,
        included: p.included,
      })) || [],
    totalValue: wd?.step4?.totalValue || 0,
  };

  // Step 5
  const step5 = {
    sections:
      wd?.step5?.sections?.map(s => ({
        title: s.title,
        description: s.description,
      })) || [],
  };

  return {
    ...raw,
    wizardData: {
      step1,
      step2: wd?.step2,
      step3,
      step4,
      step5,
      step6: wd?.step6,
    },
    contentSelections:
      raw?.contentSelections?.map(cs => ({
        contentId: cs.contentId,
        section: cs.section,
        customizations: cs.customizations,
        assignedTo: cs.assignedTo,
      })) || [],
  };
};

// ✅ BRIDGE-INTEGRATED COMPONENT: Following bridge patterns
function ProposalDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { trackOptimized } = useOptimizedAnalytics();

  // ✅ STATE MANAGEMENT: Minimal client state (following CORE_REQUIREMENTS.md)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'tasks' | 'files'>('messages');

  const proposalId = params?.id as string | null;

  // ✅ BRIDGE HOOK: Main data fetching (following bridge patterns)
  const {
    proposal,
    analytics: proposalAnalytics,
    isLoading,
    isRefreshing,
    isUpdating,
    hasErrors,
    error,
    refetch,
    updateProposal,
    deleteProposal,
    approveProposal,
    rejectProposal,
    assignTeam,
    refreshAnalytics,
    lastUpdated,
  } = useProposalDetailBridge(proposalId, {
    enableCache: true,
    autoRefresh: false,
    onError: error => {
      ErrorHandlingService.getInstance().processError(
        error,
        'Failed to fetch proposal details',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ProposalDetailPage',
          operation: 'data_fetch',
          proposalId,
        }
      );
    },
  });

  // ✅ MEMOIZED CALLBACKS: Following performance optimization patterns
  const handleBack = useCallback(() => {
    trackOptimized('proposal_detail_back_clicked', {
      proposalId,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });
    router.push('/proposals/manage');
  }, [router, proposalId, trackOptimized]);

  const handleEdit = useCallback(() => {
    trackOptimized('proposal_detail_edit_clicked', {
      proposalId,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });
    router.push(`/proposals/create?edit=${proposalId}`);
  }, [router, proposalId, trackOptimized]);

  const handleRetry = useCallback(() => {
    trackOptimized('proposal_detail_retry_clicked', {
      proposalId,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });
    refetch();
  }, [refetch, proposalId, trackOptimized]);

  const handleApprove = useCallback(async () => {
    trackOptimized('proposal_detail_approve_clicked', {
      proposalId,
      userStory: 'US-3.3',
      hypothesis: 'H8',
    });

    const success = await approveProposal({
      approvedBy: 'current_user',
      approvedAt: new Date().toISOString(),
    });

    if (success) {
      trackOptimized('proposal_approved_success', {
        proposalId,
        userStory: 'US-3.3',
        hypothesis: 'H8',
      });
    }
  }, [approveProposal, proposalId, trackOptimized]);

  const handleReject = useCallback(async () => {
    trackOptimized('proposal_detail_reject_clicked', {
      proposalId,
      userStory: 'US-3.3',
      hypothesis: 'H8',
    });

    const success = await rejectProposal('Rejected by user');

    if (success) {
      trackOptimized('proposal_rejected_success', {
        proposalId,
        userStory: 'US-3.3',
        hypothesis: 'H8',
      });
    }
  }, [rejectProposal, proposalId, trackOptimized]);

  const handleDelete = useCallback(async () => {
    trackOptimized('proposal_detail_delete_clicked', {
      proposalId,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    const success = await deleteProposal();

    if (success) {
      trackOptimized('proposal_deleted_success', {
        proposalId,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
      router.push('/proposals/manage');
    }
  }, [deleteProposal, proposalId, trackOptimized, router]);

  // ✅ MEMOIZED VALUES: Performance optimization
  const statusColor = useMemo(() => {
    if (!proposal) return 'bg-gray-100 text-gray-800';
    const status = proposal.status.toLowerCase();
    switch (status) {
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
  }, [proposal?.status]);

  const priorityColor = useMemo(() => {
    if (!proposal) return 'bg-gray-100 text-gray-800';
    const priority = (proposal.priority || 'medium').toLowerCase();
    switch (priority) {
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
  }, [proposal?.priority]);

  const proposalValue = useMemo(() => {
    return proposal
      ? calculateProposalValue(proposal as ProposalDetail)
      : { value: 0, source: 'database' as const };
  }, [proposal]);

  const progressPercent = useMemo(() => {
    if (!proposal) return 0;
    const completeness =
      typeof (proposal as { validationData?: { completeness?: number } }).validationData
        ?.completeness === 'number'
        ? (proposal as { validationData?: { completeness?: number } }).validationData!.completeness
        : undefined;
    if (typeof completeness === 'number') {
      const value = completeness <= 1 ? completeness * 100 : completeness;
      return Math.max(0, Math.min(100, Math.round(value)));
    }
    const wizardRate =
      typeof (proposal as { analyticsData?: { wizardCompletionRate?: number } }).analyticsData
        ?.wizardCompletionRate === 'number'
        ? (proposal as { analyticsData?: { wizardCompletionRate?: number } }).analyticsData!
            .wizardCompletionRate
        : undefined;
    if (typeof wizardRate === 'number') {
      const value = wizardRate <= 1 ? wizardRate * 100 : wizardRate;
      return Math.max(0, Math.min(100, Math.round(value)));
    }
    return 0;
  }, [proposal]);

  // ✅ UTILITY FUNCTIONS: Following gold standard patterns
  const formatCurrency = useCallback((amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // ✅ LOADING STATE: Following gold standard patterns
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposal details...</p>
        </div>
      </div>
    );
  }

  // ✅ ERROR STATE: Following gold standard patterns with retry mechanism
  if (hasErrors || !proposal) {
    const errorMessage = error?.message || 'Failed to load proposal details';

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-2xl">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h1>
          <p className="text-gray-600 mb-4">{errorMessage}</p>

          <div className="space-x-4">
            <Button onClick={handleRetry} className="inline-flex items-center">
              <PencilIcon className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={handleBack} variant="outline" className="inline-flex items-center">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Proposals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ COMPONENT HELPERS: Following gold standard patterns
  interface MetricCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    progress?: number;
  }

  const MetricCard = ({ title, value, icon, progress }: MetricCardProps) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">{title}</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">{value}</div>
        </div>
        {icon}
      </div>
      {typeof progress === 'number' && progress >= 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right break-words">{value}</span>
    </div>
  );

  // ✅ MAIN RENDER: Following gold standard UI patterns
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with KPI Metrics */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 rounded-xl mb-8">
          <div className="flex items-center justify-between py-6 px-4 sm:px-6 lg:px-8">
            {/* Navigation & Status */}
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleBack} className="inline-flex items-center">
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Back to Proposals
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{proposal.title}</h1>
                <p className="text-gray-600 mt-1">Proposal ID: {proposal.id}</p>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <Badge className={statusColor}>{proposal.status.replace('_', ' ')}</Badge>
                <Badge className={priorityColor}>{proposal.priority || 'Medium'}</Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button onClick={handleEdit} className="inline-flex items-center">
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={handleApprove}
                variant="outline"
                className="inline-flex items-center text-green-600 border-green-600 hover:bg-green-50"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={handleReject}
                variant="outline"
                className="inline-flex items-center text-red-600 border-red-600 hover:bg-red-50"
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="inline-flex items-center text-red-600 border-red-600 hover:bg-red-50"
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-6 lg:px-8 pb-6">
            <MetricCard
              title="Proposal Value"
              value={formatCurrency(proposalValue.value, proposal.currency || 'USD')}
              icon={<TagIcon className="h-6 w-6 text-blue-600" />}
            />
            <MetricCard
              title="Progress"
              value={`${progressPercent}%`}
              icon={<ClockIcon className="h-6 w-6 text-green-600" />}
              progress={progressPercent}
            />
            <MetricCard
              title="Team Size"
              value={proposal.teamSize || proposal.assignedTo?.length || 0}
              icon={<UserIcon className="h-6 w-6 text-purple-600" />}
            />
            <MetricCard
              title="Sections"
              value={proposal.totalSections || proposal.sections?.length || 0}
              icon={<PaperClipIcon className="h-6 w-6 text-orange-600" />}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proposal Details Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Proposal Details</h2>
              <div className="space-y-4">
                <InfoRow label="Title" value={proposal.title} />
                <InfoRow label="Status" value={proposal.status.replace('_', ' ')} />
                <InfoRow label="Priority" value={proposal.priority || 'Medium'} />
                <InfoRow label="Created" value={formatDate(proposal.createdAt)} />
                <InfoRow label="Last Updated" value={formatDate(proposal.updatedAt)} />
                <InfoRow label="Due Date" value={formatDate(proposal.dueDate || null)} />
                <InfoRow label="Valid Until" value={formatDate(proposal.validUntil || null)} />
                <InfoRow label="Project Type" value={proposal.projectType || 'Not specified'} />
                <InfoRow label="Created By" value={proposal.createdByEmail || 'Unknown'} />
              </div>
            </Card>

            {/* Customer Information Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-4">
                <InfoRow label="Customer Name" value={proposal.customerName || 'Not specified'} />
                <InfoRow label="Industry" value={proposal.customerIndustry || 'Not specified'} />
                <InfoRow label="Customer Tier" value={proposal.customerTier || 'Not specified'} />
                <InfoRow label="Customer ID" value={proposal.customerId || 'Not specified'} />
              </div>
            </Card>

            {/* Team Assignments Card */}
            {proposal.assignedTo && proposal.assignedTo.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Assignments</h2>
                <div className="space-y-3">
                  {proposal.assignedTo.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Wizard Summary */}
            {proposal.wizardData && (
              <WizardSummary
                wizardData={proposal.wizardData}
                contentSelections={proposal.contentSelections || []}
              />
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button onClick={handleEdit} className="w-full justify-start">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Proposal
                </Button>
                <Button
                  onClick={handleApprove}
                  variant="outline"
                  className="w-full justify-start text-green-600 border-green-600 hover:bg-green-50"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </Card>

            {/* Analytics Card */}
            {proposalAnalytics && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h2>
                <div className="space-y-4">
                  <InfoRow
                    label="Completion Rate"
                    value={`${(proposalAnalytics as { completionRate?: number })?.completionRate || 0}%`}
                  />
                  <InfoRow
                    label="Complexity Score"
                    value={
                      (proposalAnalytics as { complexityScore?: number })?.complexityScore || 0
                    }
                  />
                  <InfoRow
                    label="Validation Issues"
                    value={proposalAnalytics.validationIssuesFound || 0}
                  />
                  <InfoRow
                    label="Last Updated"
                    value={lastUpdated ? formatDate(lastUpdated.toISOString()) : 'Never'}
                  />
                </div>
              </Card>
            )}

            {/* Validation Status Card */}
            {proposal.validationData && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Validation Status</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall Status</span>
                    <Badge
                      className={
                        proposal.validationData.isValid
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {proposal.validationData.isValid ? 'Valid' : 'Invalid'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completeness</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(proposal.validationData as { completeness?: number })?.completeness || 0}%
                    </span>
                  </div>
                  {(proposal.validationData.issues as Array<{ id: string; message: string }>) &&
                    (proposal.validationData.issues as Array<{ id: string; message: string }>)
                      .length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Issues Found:</p>
                        <div className="space-y-1">
                          {(
                            proposal.validationData.issues as Array<{ id: string; message: string }>
                          )
                            .slice(0, 3)
                            .map((issue: { id: string; message: string }, index: number) => (
                              <div key={index} className="text-xs text-red-600">
                                • {issue.message}
                              </div>
                            ))}
                          {(
                            proposal.validationData.issues as Array<{ id: string; message: string }>
                          ).length > 3 && (
                            <div className="text-xs text-gray-500">
                              +
                              {(
                                proposal.validationData.issues as Array<{
                                  id: string;
                                  message: string;
                                }>
                              ).length - 3}{' '}
                              more issues
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ BRIDGE WRAPPER: Following bridge patterns
export default function ProposalDetailPage() {
  return (
    <ProposalDetailManagementBridge>
      <ProposalDetailPageContent />
    </ProposalDetailManagementBridge>
  );
}
