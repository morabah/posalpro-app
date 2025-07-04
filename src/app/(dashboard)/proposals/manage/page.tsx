/**
 * PosalPro MVP2 - Proposal Management Dashboard
 * Based on PROPOSAL_MANAGEMENT_DASHBOARD.md wireframe specifications
 * Supports component traceability and analytics integration for H7 & H4 hypothesis validation
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/forms/Button';
import {
  ArrowPathIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ExtendedPaginatedResponse,
  ProposalData,
  proposalEntity,
} from '../../../../lib/entities/proposal';
import {
  debugResponseStructure,
  extractArrayFromResponse,
} from '../../../../lib/utils/apiResponseHandler';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.3', 'AC-4.3.1', 'AC-4.3.3'],
  methods: ['trackProposalLifecycle()', 'calculatePriority()', 'trackOnTimeCompletion()'],
  hypotheses: ['H7', 'H4'],
  testCases: ['TC-H7-001', 'TC-H7-002', 'TC-H4-001'],
};

// Proposal status enumeration
enum ProposalStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  SUBMITTED = 'submitted',
  WON = 'won',
  LOST = 'lost',
  CANCELLED = 'cancelled',
}

// Proposal priority enumeration
enum ProposalPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// Proposal interface
interface Proposal {
  id: string;
  title: string;
  client: string;
  status: ProposalStatus;
  priority: ProposalPriority;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  estimatedValue: number;
  teamLead: string;
  assignedTeam: string[];
  progress: number;
  stage: string;
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
  description?: string;
  lastActivity?: string;
}

// Filter state interface
interface FilterState {
  search: string;
  status: string;
  priority: string;
  teamMember: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function ProposalManagementDashboard() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    teamMember: 'all',
    dateRange: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // Fetch proposals from API
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Fetching proposals from API...');
        const response = (await proposalEntity.query({
          page: 1,
          limit: 50, // Get more proposals to show
          sortBy: 'createdAt',
          sortOrder: 'desc',
          includeCustomer: true, // Include customer data to resolve client names
        })) as ExtendedPaginatedResponse<ProposalData>;

        debugResponseStructure(response, 'Proposals API Response');

        if (response.success) {
          // Use utility function to safely extract array from response
          const proposalsData = extractArrayFromResponse(response, undefined, []);

          if (proposalsData.length > 0) {
            console.log('Sample proposal data:', proposalsData[0]);
            console.log(
              '🔍 Customer data in first proposal:',
              (proposalsData[0] as ProposalData & { customer?: any }).customer
            );

            // Transform API data to match the UI interface
            const transformedProposals: Proposal[] = proposalsData.map(
              (apiProposal: ProposalData & { customer?: any }) => ({
                id: apiProposal.id,
                title: apiProposal.title,
                client: apiProposal.customer?.name || apiProposal.customerName || 'Unknown Client',
                status: mapApiStatusToUIStatus(apiProposal.status),
                priority: mapApiPriorityToUIPriority(apiProposal.priority),
                dueDate: new Date(apiProposal.deadline || Date.now()),
                createdAt: new Date(apiProposal.createdAt),
                updatedAt: new Date(apiProposal.updatedAt),
                estimatedValue: apiProposal.estimatedValue || 0,
                teamLead: apiProposal.createdBy || 'Unassigned',
                assignedTeam: apiProposal.assignedTo || [],
                progress: calculateProgress(apiProposal.status),
                stage: getStageFromStatus(apiProposal.status),
                riskLevel: calculateRiskLevel(apiProposal),
                tags: apiProposal.tags || [],
                description: apiProposal.description,
                lastActivity: `Created on ${new Date(apiProposal.createdAt).toLocaleDateString()}`,
              })
            );

            setProposals(transformedProposals);
            console.log('Successfully transformed proposals:', transformedProposals.length);
          } else {
            console.warn('No proposals found in response');
            setProposals([]);
          }
        } else {
          console.warn('API response indicates failure:', response);

          // Check for authentication error
          if (response.authError) {
            setError('Authentication required. Please sign in to view proposals.');
            // Redirect to login after a short delay
            setTimeout(() => {
              router.push('/auth/signin?callbackUrl=/proposals/manage');
            }, 3000);
          } else {
            setError(response.message || 'Failed to load proposals');
          }

          setProposals([]);
        }
      } catch (error) {
        console.error('Failed to fetch proposals:', error);

        // Check if error is related to authentication
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (
          errorMessage.includes('session') ||
          errorMessage.includes('auth') ||
          errorMessage.includes('sign in')
        ) {
          setError('Authentication required. Please sign in to view proposals.');
          // Redirect to login after a short delay
          setTimeout(() => {
            router.push('/auth/signin?callbackUrl=/proposals/manage');
          }, 3000);
        } else {
          setError('Failed to load proposals. Please try refreshing the page.');
        }

        setProposals([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposals();
  }, [router]);

  // Helper functions for data transformation
  const mapApiStatusToUIStatus = (apiStatus: string): ProposalStatus => {
    switch (apiStatus?.toLowerCase()) {
      case 'draft':
        return ProposalStatus.DRAFT;
      case 'in_review':
        return ProposalStatus.IN_REVIEW;
      case 'pending_approval':
        return ProposalStatus.IN_REVIEW;
      case 'approved':
        return ProposalStatus.APPROVED;
      case 'submitted':
        return ProposalStatus.SUBMITTED;
      case 'rejected':
        return ProposalStatus.LOST;
      default:
        return ProposalStatus.DRAFT;
    }
  };

  const mapApiPriorityToUIPriority = (apiPriority: string): ProposalPriority => {
    switch (apiPriority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return ProposalPriority.HIGH;
      case 'medium':
        return ProposalPriority.MEDIUM;
      case 'low':
        return ProposalPriority.LOW;
      default:
        return ProposalPriority.MEDIUM;
    }
  };

  const calculateProgress = (status: string): number => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 10;
      case 'in_review':
        return 50;
      case 'pending_approval':
        return 75;
      case 'approved':
        return 90;
      case 'submitted':
        return 100;
      default:
        return 10;
    }
  };

  const getStageFromStatus = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'Initial Draft';
      case 'in_review':
        return 'Under Review';
      case 'pending_approval':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'submitted':
        return 'Submitted';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const calculateRiskLevel = (proposal: any): 'low' | 'medium' | 'high' => {
    const daysUntilDeadline = Math.ceil(
      (new Date(proposal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDeadline < 7) return 'high';
    if (daysUntilDeadline < 30) return 'medium';
    return 'low';
  };

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...proposals];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        proposal =>
          proposal.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          proposal.client.toLowerCase().includes(filters.search.toLowerCase()) ||
          proposal.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(proposal => proposal.priority === filters.priority);
    }

    // Team member filter
    if (filters.teamMember !== 'all') {
      filtered = filtered.filter(
        proposal =>
          proposal.assignedTeam.includes(filters.teamMember) ||
          proposal.teamLead === filters.teamMember
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filters.dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter(proposal => proposal.updatedAt >= cutoffDate);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'dueDate':
          aValue = a.dueDate;
          bValue = b.dueDate;
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'estimatedValue':
          aValue = a.estimatedValue;
          bValue = b.estimatedValue;
          break;
        default:
          aValue = a.updatedAt;
          bValue = b.updatedAt;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProposals(filtered);
  }, [proposals, filters]);

  // Filter handlers
  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      teamMember: 'all',
      dateRange: 'all',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  }, []);

  // Analytics tracking
  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Proposal Management Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        filters: filters,
        proposalCount: filteredProposals.length,
      });
    },
    [filters, filteredProposals.length]
  );

  // Status badge component
  const StatusBadge = ({ status }: { status: ProposalStatus }) => {
    const getStatusStyle = (status: ProposalStatus) => {
      switch (status) {
        case ProposalStatus.DRAFT:
          return 'bg-gray-100 text-gray-800';
        case ProposalStatus.IN_PROGRESS:
          return 'bg-blue-100 text-blue-800';
        case ProposalStatus.IN_REVIEW:
          return 'bg-yellow-100 text-yellow-800';
        case ProposalStatus.APPROVED:
          return 'bg-green-100 text-green-800';
        case ProposalStatus.SUBMITTED:
          return 'bg-purple-100 text-purple-800';
        case ProposalStatus.WON:
          return 'bg-emerald-100 text-emerald-800';
        case ProposalStatus.LOST:
          return 'bg-red-100 text-red-800';
        case ProposalStatus.CANCELLED:
          return 'bg-gray-100 text-gray-600';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(
          status
        )}`}
      >
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  // Priority indicator component
  const PriorityIndicator = ({ priority }: { priority: ProposalPriority }) => {
    const getPriorityColor = (priority: ProposalPriority) => {
      switch (priority) {
        case ProposalPriority.HIGH:
          return 'text-red-600';
        case ProposalPriority.MEDIUM:
          return 'text-yellow-600';
        case ProposalPriority.LOW:
          return 'text-green-600';
        default:
          return 'text-gray-600';
      }
    };

    return (
      <span className={`text-sm font-medium ${getPriorityColor(priority)}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const total = proposals.length;
    const draft = proposals.filter(p => p.status === ProposalStatus.DRAFT).length;
    const inProgress = proposals.filter(p => p.status === ProposalStatus.IN_PROGRESS).length;
    const review = proposals.filter(p => p.status === ProposalStatus.IN_REVIEW).length;
    const submitted = proposals.filter(p => p.status === ProposalStatus.SUBMITTED).length;
    const won = proposals.filter(p => p.status === ProposalStatus.WON).length;
    const totalValue = proposals.reduce((sum, p) => sum + p.estimatedValue, 0);
    const avgProgress = proposals.reduce((sum, p) => sum + p.progress, 0) / total;

    // Calculate overdue proposals
    const now = new Date();
    const overdue = proposals.filter(
      p =>
        p.dueDate < now &&
        ![
          ProposalStatus.SUBMITTED,
          ProposalStatus.WON,
          ProposalStatus.LOST,
          ProposalStatus.CANCELLED,
        ].includes(p.status)
    ).length;

    return {
      total,
      draft,
      inProgress,
      review,
      submitted,
      won,
      overdue,
      totalValue,
      avgProgress: Math.round(avgProgress),
      winRate: total > 0 ? Math.round((won / total) * 100) : 0,
    };
  }, [proposals]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Proposal Management</h1>
              <p className="text-gray-600">Manage and track all proposals in your pipeline</p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                trackAction('create_proposal_clicked');
                router.push('/proposals/create');
              }}
              className="flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Proposal
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.total}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <ArrowPathIcon className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.inProgress}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.overdue}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Win Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.winRate}%</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">$</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(dashboardMetrics.totalValue / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-4xl">
                {/* Search */}
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search proposals, clients, or tags..."
                    value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <Select
                  value={filters.status}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'review', label: 'Review' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'submitted', label: 'Submitted' },
                    { value: 'won', label: 'Won' },
                    { value: 'lost', label: 'Lost' },
                  ]}
                  onChange={(value: string) => handleFilterChange('status', value)}
                />

                {/* Priority Filter */}
                <Select
                  value={filters.priority}
                  options={[
                    { value: 'all', label: 'All Priority' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' },
                  ]}
                  onChange={(value: string) => handleFilterChange('priority', value)}
                />

                {/* Sort By */}
                <Select
                  value={filters.sortBy}
                  options={[
                    { value: 'updatedAt', label: 'Last Updated' },
                    { value: 'dueDate', label: 'Due Date' },
                    { value: 'priority', label: 'Priority' },
                    { value: 'estimatedValue', label: 'Value' },
                    { value: 'title', label: 'Title' },
                  ]}
                  onChange={(value: string) => handleFilterChange('sortBy', value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="secondary" onClick={clearFilters} size="sm">
                  <FunnelIcon className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <span className="text-sm text-gray-600">
                  {filteredProposals.length} of {proposals.length} proposals
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Proposals List */}
        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <div className="p-6 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </Card>
            ))
          ) : filteredProposals.length === 0 ? (
            // Empty state
            <Card>
              <div className="p-12 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
                <p className="text-gray-600 mb-6">
                  {filters.search || filters.status !== 'all' || filters.priority !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'Get started by creating your first proposal.'}
                </p>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (filters.search || filters.status !== 'all' || filters.priority !== 'all') {
                      clearFilters();
                    } else {
                      router.push('/proposals/create');
                    }
                  }}
                >
                  {filters.search || filters.status !== 'all' || filters.priority !== 'all'
                    ? 'Clear Filters'
                    : 'Create First Proposal'}
                </Button>
              </div>
            </Card>
          ) : (
            // Proposal cards
            filteredProposals.map(proposal => (
              <Card
                key={proposal.id}
                className={`hover:shadow-lg transition-shadow duration-200 ${
                  selectedProposal === proposal.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                          {proposal.title}
                        </h3>
                        <StatusBadge status={proposal.status} />
                        <PriorityIndicator priority={proposal.priority} />
                      </div>
                      <p className="text-gray-600 mb-2">{proposal.client}</p>
                      <p className="text-sm text-gray-500">{proposal.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => trackAction('view_proposal', { proposalId: proposal.id })}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/proposals/create?edit=${proposal.id}`)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Due: {proposal.dueDate.toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <UserGroupIcon className="w-4 h-4 mr-2" />
                      Team: {proposal.assignedTeam.length} members
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4 h-4 mr-2 text-green-600">$</span>
                      Value: ${proposal.estimatedValue.toLocaleString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      Stage: {proposal.stage}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-600">{proposal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          proposal.progress >= 80
                            ? 'bg-green-600'
                            : proposal.progress >= 50
                              ? 'bg-blue-600'
                              : 'bg-yellow-600'
                        }`}
                        style={{ width: `${proposal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Tags and Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {proposal.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {proposal.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{proposal.tags.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Lead: <span className="font-medium">{proposal.teamLead}</span>
                    </div>
                  </div>

                  {/* Last Activity */}
                  {proposal.lastActivity && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Last activity:</span> {proposal.lastActivity}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Updated {proposal.updatedAt.toLocaleDateString()} at{' '}
                        {proposal.updatedAt.toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
