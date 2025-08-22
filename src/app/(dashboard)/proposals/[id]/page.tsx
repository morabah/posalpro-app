'use client';

import { WizardSummary } from '@/components/proposals/WizardSummary';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PencilIcon,
  PlusIcon,
  TagIcon,
  UserIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

interface ProductSelection {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  included: boolean;
}

interface SectionAssignment {
  sectionId: string;
  title: string;
  assignedTo: string[];
  complexity: 'low' | 'medium' | 'high';
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
  teamAssignments: {
    teamLead?: string;
    salesRepresentative?: string;
    subjectMatterExperts?: Record<string, string>;
    executiveReviewers?: string[];
  } | null;
  contentSelections: Array<{
    contentId: string;
    section: string;
    customizations: Array<{
      field: string;
      value: string;
      type: 'text' | 'number' | 'boolean';
    }>;
    assignedTo: string;
  }> | null;
  validationData: {
    isValid?: boolean;
    completeness?: number;
    issues?: ValidationIssue[];
    complianceChecks?: ComplianceCheck[];
  } | null;
  analyticsData: {
    stepCompletionTimes?: StepCompletionTime[];
    wizardCompletionRate?: number;
    complexityScore?: number;
    teamSize?: number;
    contentSuggestionsUsed?: number;
    validationIssuesFound?: number;
  } | null;
  crossStepValidation: {
    teamCompatibility?: boolean;
    contentAlignment?: boolean;
    budgetCompliance?: boolean;
    timelineRealistic?: boolean;
  } | null;
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedProposals, setRelatedProposals] = useState<Array<{ id: string; title: string }>>(
    []
  );
  const [availableProposals, setAvailableProposals] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'tasks' | 'files'>('messages');

  const proposalId = params?.id as string;

  // Lightweight client-side guard to avoid invalid API calls (e.g., '/proposals/admin')
  const isLikelyProposalId = (id: unknown): boolean => {
    if (typeof id !== 'string') return false;
    // Accept typical Prisma cuid/cuid2-like ids (alphanumeric, length >= 20)
    return /^[a-z0-9]{20,}$/i.test(id);
  };

  // Helper: unwrap prisma-style { set: ... }
  const unwrapSet = (v: unknown) => {
    if (v && typeof v === 'object' && v !== null && 'set' in v) {
      return (v as { set: unknown }).set;
    }
    return v;
  };

  // Helper: normalize priority to UI format
  const normalizePriority = (p?: string | null) => {
    if (!p) return 'MEDIUM';
    return p.toLowerCase() === 'high' ? 'HIGH' : p.toLowerCase() === 'low' ? 'LOW' : 'MEDIUM';
  };

  // Helper: calculate correct proposal value based on wizard data
  const calculateProposalValue = (
    proposal: ProposalDetail
  ): { value: number; source: 'step4' | 'step1' | 'database' } => {
    const md = (unwrapSet(proposal?.metadata) as ProposalDetail['metadata']) || {};
    const wd = md?.wizardData || proposal?.wizardData || {};

    // Get step 4 total value (most accurate)
    const step4TotalValue =
      wd.step4?.products?.reduce((sum: number, product) => {
        const quantity = product.quantity || 0;
        const unitPrice = product.unitPrice || 0;
        return product.included !== false ? sum + quantity * unitPrice : sum;
      }, 0) || 0;

    // Get step 1 estimated value
    const step1EstimatedValue = wd.step1?.details?.estimatedValue || wd.step1?.value || 0;

    // Determine which value to use: step 4 total or step 1 estimate
    if (step4TotalValue > 0) {
      return { value: step4TotalValue, source: 'step4' };
    } else if (step1EstimatedValue > 0) {
      return { value: step1EstimatedValue, source: 'step1' };
    } else {
      return { value: proposal.value || 0, source: 'database' };
    }
  };

  // Helper: enrich proposal with wizard data
  const enrichProposal = (raw: ProposalDetail): ProposalDetail => {
    const md = (unwrapSet(raw?.metadata) as ProposalDetail['metadata']) || {};
    const wd = md?.wizardData || raw?.wizardData || {};

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
        contactPhone:
          wd?.step1?.client?.contactPhone ?? md?.wizardData?.step1?.client?.contactPhone,
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

  // ✅ CRITICAL FIX: Single useEffect with proper dependency management
  useEffect(() => {
    let isMounted = true;

    const fetchProposal = async () => {
      // Only fetch if we have a valid proposalId
      if (!proposalId || typeof proposalId !== 'string' || !isLikelyProposalId(proposalId)) {
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

        // dev log removed for compliance

        const response = await apiClient.get<{
          success: boolean;
          data: ProposalDetail;
        }>(`proposals/${proposalId}`);

        if (response.success) {
          // Only update state if component is still mounted
          if (isMounted) {
            const enriched = enrichProposal(response.data);
            setProposal(enriched);
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
        if (isMounted) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to load proposal details';
          setError(errorMessage);
          // Avoid extra list fetches; show no alternatives per CORE_REQUIREMENTS
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

  const computeProgressPercent = (p: ProposalDetail): number => {
    const completeness =
      typeof (p as { validationData?: { completeness?: number } }).validationData?.completeness ===
      'number'
        ? (p as { validationData?: { completeness?: number } }).validationData!.completeness
        : undefined;
    if (typeof completeness === 'number') {
      // Handle 0-1 or 0-100 inputs safely
      const value = completeness <= 1 ? completeness * 100 : completeness;
      return Math.max(0, Math.min(100, Math.round(value)));
    }
    const wizardRate =
      typeof (p as { analyticsData?: { wizardCompletionRate?: number } }).analyticsData
        ?.wizardCompletionRate === 'number'
        ? (p as { analyticsData?: { wizardCompletionRate?: number } }).analyticsData!
            .wizardCompletionRate
        : undefined;
    if (typeof wizardRate === 'number') {
      const value = wizardRate <= 1 ? wizardRate * 100 : wizardRate;
      return Math.max(0, Math.min(100, Math.round(value)));
    }
    return 0;
  };

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
        <div className="text-center max-w-2xl">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || 'The requested proposal could not be loaded.'}
          </p>

          {proposalId === '1' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm mb-2">
                <strong>Tip:</strong> You're trying to access proposal ID "1", but our system uses
                different ID formats. Here are some available proposals you can try:
              </p>
            </div>
          )}

          {availableProposals.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Available Proposals:</h3>
              <div className="space-y-2">
                {availableProposals.map(proposal => (
                  <div
                    key={proposal.id}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <span className="text-sm text-gray-900 truncate">{proposal.title}</span>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/proposals/${proposal.id}`)}
                      className="ml-2"
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-x-4">
            <Button onClick={handleBack} className="inline-flex items-center">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Proposals
            </Button>
            <Button
              onClick={() => router.push('/proposals/manage')}
              variant="outline"
              className="inline-flex items-center"
            >
              View All Proposals
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
                <Badge className={getStatusColor(proposal.status)}>
                  {proposal.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge className={getPriorityColor(proposal.priority || 'medium')}>
                  {(proposal.priority || 'medium').toUpperCase()} Priority
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <Badge className={`sm:hidden ${getStatusColor(proposal.status)}`}>
                {proposal.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge className={`sm:hidden ${getPriorityColor(proposal.priority || 'medium')}`}>
                {(proposal.priority || 'medium').toUpperCase()}
              </Badge>
              <Button onClick={handleEdit} className="inline-flex items-center">
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Proposal
              </Button>
            </div>
          </div>

          {/* KPI Metrics Row */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {(() => {
                const result = proposal
                  ? calculateProposalValue(proposal)
                  : { value: 0, source: 'database' as const };
                const { value: computedValue } = result;
                const progress = computeProgressPercent(proposal);
                return (
                  <>
                    <MetricCard
                      title="Total Value"
                      value={formatCurrency(computedValue, proposal.currency ?? 'USD')}
                      icon={<ClockIcon className="h-5 w-5 text-green-600" />}
                    />
                    <MetricCard
                      title="Team Members"
                      value={proposal.teamSize || 0}
                      icon={<UserIcon className="h-5 w-5 text-blue-600" />}
                    />
                    <MetricCard
                      title="Sections"
                      value={proposal.totalSections || 0}
                      icon={<CheckCircleIcon className="h-5 w-5 text-purple-600" />}
                    />
                    <MetricCard
                      title="Days Remaining"
                      value={
                        proposal.daysUntilDeadline !== null
                          ? `${proposal.daysUntilDeadline}d`
                          : 'N/A'
                      }
                      icon={<ClockIcon className="h-5 w-5 text-orange-600" />}
                    />
                    <MetricCard
                      title="Progress"
                      value={`${progress}%`}
                      icon={<CheckCircleIcon className="h-5 w-5 text-green-600" />}
                      progress={progress}
                    />
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 xl:gap-8">
          {/* Enhanced Information Grid */}
          <div className="col-span-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
              {/* Customer Card */}
              <Card className="p-6 border-l-4 border-l-blue-500 bg-blue-50">
                <div className="flex items-center mb-4">
                  <UserIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-blue-900">Customer Details</h3>
                </div>
                <div className="space-y-3">
                  <InfoRow label="Client" value={proposal.customerName} />
                  <InfoRow label="Industry" value={proposal.customerIndustry || 'Not specified'} />
                  <InfoRow label="Tier" value={proposal.customerTier || 'Not specified'} />
                </div>
              </Card>

              {/* Timeline Card */}
              <Card className="p-6 border-l-4 border-l-green-500 bg-green-50">
                <div className="flex items-center mb-4">
                  <ClockIcon className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Timeline</h3>
                </div>
                <div className="space-y-3">
                  <InfoRow
                    label="Due Date"
                    value={proposal.dueDate ? formatDate(proposal.dueDate) : 'N/A'}
                  />
                  <InfoRow
                    label="Valid Until"
                    value={proposal.validUntil ? formatDate(proposal.validUntil) : 'N/A'}
                  />
                  <InfoRow
                    label="Created"
                    value={proposal.createdAt ? formatDate(proposal.createdAt) : 'N/A'}
                  />
                </div>
                {(() => {
                  const progress = computeProgressPercent(proposal);
                  return (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-green-700 mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </Card>

              {/* Project Details Card */}
              <Card className="p-6 border-l-4 border-l-purple-500 bg-purple-50">
                <div className="flex items-center mb-4">
                  <CheckCircleIcon className="h-6 w-6 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-purple-900">Project Details</h3>
                </div>
                <div className="space-y-3">
                  <InfoRow label="Type" value={proposal.projectType || 'Not specified'} />
                  <InfoRow label="Creator" value={proposal.createdByEmail || 'System'} />
                  <InfoRow label="Status" value={proposal.status} />
                </div>
              </Card>
            </div>
          </div>

          {/* Left column content */}
          <div className="col-span-12 lg:col-span-7 xl:col-span-8 space-y-6">
            {/* ✅ ENHANCED: Wizard Summary */}
            <WizardSummary
              wizardData={proposal.wizardData}
              teamAssignments={proposal.teamAssignments}
              contentSelections={proposal.contentSelections || []}
              validationData={proposal.validationData}
              analyticsData={proposal.analyticsData}
              crossStepValidation={proposal.crossStepValidation}
              assignedTo={proposal.assignedTo} // ✅ ADDED: Pass resolved user data
            />

            {/* Sections */}
            {Array.isArray(proposal.sections) && proposal.sections.length > 0 && (
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
                  Assigned Team ({proposal.teamSize || 0})
                </h2>
                <div className="space-y-3">
                  {Array.isArray(proposal.assignedTo) && proposal.assignedTo.length > 0 ? (
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
                  Approvals ({proposal.approvalStages || 0})
                </h2>
                <div className="space-y-3">
                  {Array.isArray(proposal.approvals) && proposal.approvals.length > 0 ? (
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

          {/* Enhanced Communication Center Sidebar */}
          <div className="col-span-12 lg:col-span-5 xl:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Quick Actions Card */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                    onClick={() => {
                      const sidebar = document.querySelector('.sticky.top-24');
                      if (sidebar) sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Task
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                    onClick={() => {
                      // TODO: Implement assign functionality
                    }}
                  >
                    <UserIcon className="h-4 w-4 mr-1" />
                    Assign
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors"
                    onClick={async () => {
                      try {
                        // Compute valid next status per workflow rules
                        const current = proposal.status;
                        let next = current;
                        if (current === 'DRAFT') next = 'IN_REVIEW';
                        else if (current === 'IN_REVIEW') next = 'PENDING_APPROVAL';
                        else if (current === 'PENDING_APPROVAL') next = 'APPROVED';
                        else next = current;

                        if (next === current) return;

                        await apiClient.put(`proposals/${proposalId}/status`, { status: next });
                        setProposal(prev => (prev ? { ...prev, status: next } : prev));
                      } catch (e) {}
                    }}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
                    onClick={() => router.push('/dashboard/coordination')}
                  >
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Schedule
                  </Button>
                </div>
              </Card>

              {/* Communication Center */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Team Communication
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-600">{proposal.teamSize} online</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs px-2 py-1 bg-red-50 text-red-600 border-red-200"
                      >
                        5 new
                      </Badge>
                    </div>
                  </div>

                  {/* Enhanced Search Bar */}
                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search messages, tasks, files... (⌘K)"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Enhanced Tabbed Interface */}
                  <nav className="flex space-x-1 bg-white rounded-lg p-1 border border-gray-200">
                    <button
                      onClick={() => setActiveTab('messages')}
                      className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded-md shadow-sm transition-all duration-200 ${
                        activeTab === 'messages'
                          ? 'text-white bg-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <ChatBubbleLeftRightIcon className="h-3 w-3" />
                      <span>Messages</span>
                      <Badge
                        variant="outline"
                        className={`ml-1 text-xs ${
                          activeTab === 'messages'
                            ? 'bg-blue-700 text-white border-blue-500'
                            : 'bg-gray-100 text-gray-600 border-gray-300'
                        }`}
                      >
                        12
                      </Badge>
                    </button>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded-md shadow-sm transition-all duration-200 ${
                        activeTab === 'tasks'
                          ? 'text-white bg-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <CheckCircleIcon className="h-3 w-3" />
                      <span>Tasks</span>
                      <Badge
                        variant="outline"
                        className={`ml-1 text-xs ${
                          activeTab === 'tasks'
                            ? 'bg-blue-700 text-white border-blue-500'
                            : 'bg-orange-50 text-orange-600 border-orange-200'
                        }`}
                      >
                        3
                      </Badge>
                    </button>
                    <button
                      onClick={() => setActiveTab('files')}
                      className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded-md shadow-sm transition-all duration-200 ${
                        activeTab === 'files'
                          ? 'text-white bg-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <PaperClipIcon className="h-3 w-3" />
                      <span>Files</span>
                      <Badge
                        variant="outline"
                        className={`ml-1 text-xs ${
                          activeTab === 'files'
                            ? 'bg-blue-700 text-white border-blue-500'
                            : 'bg-gray-100 text-gray-600 border-gray-300'
                        }`}
                      >
                        12
                      </Badge>
                    </button>
                  </nav>
                </div>
                {/* Enhanced Messages View */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Message Group */}
                    <div className="space-y-3">
                      {/* Date Separator */}
                      <div className="flex items-center">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="px-3 text-xs text-gray-500 bg-gray-50">Today</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                      </div>

                      {/* Individual Messages */}
                      <div className="flex space-x-3 group">
                        <div className="relative">
                          <Image
                            className="h-8 w-8 rounded-full"
                            src="/api/placeholder/32/32"
                            alt="User"
                            width={32}
                            height={32}
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">Sarah Chen</span>
                            <span className="text-xs text-gray-500">Product Manager</span>
                            <span className="text-xs text-gray-400">2 min ago</span>
                          </div>
                          <div className="mt-1 text-sm text-gray-700">
                            <p>
                              Just reviewed the latest mockups. The customer feedback integration
                              looks great! 👍
                            </p>
                            {/* Action Items */}
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                              <div className="flex items-center text-xs font-medium text-yellow-800 mb-1">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Action Items
                              </div>
                              <div className="text-xs text-yellow-700">
                                • Review wireframe by EOD
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3 group">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">SY</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">System</span>
                            <span className="text-xs text-gray-500">Automated</span>
                            <span className="text-xs text-gray-400">5 min ago</span>
                          </div>
                          <div className="mt-1 text-sm text-gray-700 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p>
                              📊 <strong>Progress Update:</strong> Proposal completion increased to
                              85%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Message Composer */}
                  <div className="border-t border-gray-200 p-4 bg-white">
                    <div className="flex items-start space-x-3">
                      <Image
                        className="h-8 w-8 rounded-full"
                        src="/api/placeholder/32/32"
                        alt="You"
                        width={32}
                        height={32}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="relative">
                          <textarea
                            rows={2}
                            className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 pr-20 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder={`Type a ${activeTab === 'tasks' ? 'task' : 'message'}... (⌘Enter to send)`}
                            onKeyDown={e => {
                              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                e.preventDefault();
                                const target = e.target as HTMLTextAreaElement;
                                if (target.value.trim()) {
                                  target.value = '';
                                }
                              }
                            }}
                          ></textarea>
                          <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                              <PaperClipIcon className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                              <TagIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>⌘Enter to send</span>
                            <span>•</span>
                            <span>@mention</span>
                            <span>•</span>
                            <span>#tag</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select className="text-xs border border-gray-300 rounded px-2 py-1">
                              <option>Normal</option>
                              <option>High</option>
                              <option>Urgent</option>
                            </select>
                            <Button size="sm" variant="primary">
                              <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
