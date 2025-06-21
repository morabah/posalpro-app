/**
 * PosalPro MVP2 - Modern Dashboard Component - MOBILE ENHANCED
 * Enhanced with comprehensive mobile responsiveness following DASHBOARD_SCREEN.md specifications
 * Features: Mobile-first responsive design, touch targets 44px+, progressive disclosure
 * Component Traceability Matrix: US-2.2, US-8.1, H9, H10, AC-2.2.1.1
 */

'use client';

import { Button } from '@/components/ui/forms/Button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useResponsive } from '@/hooks/useResponsive';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { UserType } from '@/types';
import {
  BoltIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SparklesIcon,
  UsersIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  ChartPieIcon as ChartPieIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  FireIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useState } from 'react';

interface DashboardData {
  proposals: any[];
  customers: any[];
  products: any[];
  content: any[];
  metrics: {
    activeProposals: number;
    pendingTasks: number;
    completionRate: number;
    avgCompletionTime: number;
    onTimeDelivery: number;
  };
}

interface ProposalItem {
  id: string;
  title: string;
  dueDate: Date;
  status: 'DRAFT' | 'REVIEW' | 'ACTIVE' | 'APPROVED' | 'SUBMITTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface PriorityItem {
  id: string;
  type: 'security' | 'assignment' | 'deadline' | 'approval';
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface ModernDashboardProps {
  user?: {
    id: string;
    name: string;
    role: UserType;
  };
  loading?: boolean;
  error?: string | null;
  data: DashboardData;
  proposals: ProposalItem[];
  priorityItems: PriorityItem[];
  onQuickAction?: (action: string) => void;
  onRetry?: () => void;
}

// Enhanced mobile-first skeleton
const DashboardSkeleton = () => (
  <div className="animate-pulse">
    {/* Mobile-optimized header skeleton */}
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="h-6 sm:h-8 bg-gray-200 rounded w-2/3 sm:w-1/3 mb-2"></div>
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-4/5 sm:w-1/2"></div>
      </div>
    </div>

    {/* Mobile-optimized content skeleton */}
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8 lg:space-y-10">
      {/* Metrics skeleton - responsive grid */}
      <div className="space-y-4 sm:space-y-6">
        <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/2 sm:w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 sm:h-28 lg:h-32 bg-gray-200 rounded-xl sm:rounded-2xl"
            ></div>
          ))}
        </div>
      </div>

      {/* Priority items skeleton */}
      <div className="space-y-4 sm:space-y-6">
        <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/2 sm:w-1/4"></div>
        <div className="space-y-3 sm:space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 sm:h-20 bg-gray-200 rounded-lg sm:rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Component Traceability Matrix for Mobile Enhancement
const COMPONENT_MAPPING = {
  userStories: ['US-2.2', 'US-8.1', 'US-1.1'],
  acceptanceCriteria: ['AC-2.2.1.1', 'AC-8.1.1', 'AC-8.1.2'],
  methods: [
    'enhanceMobileResponsiveness()',
    'optimizeTouchTargets()',
    'implementMobileFirstDesign()',
    'validateAccessibilityCompliance()',
  ],
  hypotheses: ['H9', 'H10'], // Mobile UX optimization
  testCases: ['TC-H9-001', 'TC-H9-002', 'TC-H10-001'],
};

export default function ModernDashboard({
  user,
  loading,
  error,
  data,
  proposals,
  priorityItems,
  onQuickAction,
  onRetry,
}: ModernDashboardProps) {
  const [expandedMetrics, setExpandedMetrics] = useState(false);
  const [expandedProposals, setExpandedProposals] = useState(false);

  // Mobile responsive and analytics integration
  const { isMobile, isTablet, isDesktop, screenWidth } = useResponsive();
  const analytics = useAnalytics();
  const { handleAsyncError } = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();

  // Track mobile dashboard access (H9: Mobile UX optimization)
  const handleMobileInteraction = (action: string, details?: any) => {
    try {
      analytics.track('mobile_dashboard_interaction', {
        userStories: COMPONENT_MAPPING.userStories,
        acceptanceCriteria: COMPONENT_MAPPING.acceptanceCriteria,
        hypotheses: COMPONENT_MAPPING.hypotheses,
        testCases: COMPONENT_MAPPING.testCases,
        action,
        isMobile,
        isTablet,
        isDesktop,
        screenWidth,
        details,
        timestamp: Date.now(),
      });
    } catch (error) {
      handleAsyncError(error, 'Failed to track mobile dashboard interaction', {
        component: 'ModernDashboard',
        operation: 'handleMobileInteraction',
        action,
        errorCode: ErrorCodes.SYSTEM.UNKNOWN,
      });
    }
  };

  // Enhanced quick action handler with mobile analytics
  const handleEnhancedQuickAction = (action: string) => {
    try {
      handleMobileInteraction('quick_action', { action });
      onQuickAction?.(action);
    } catch (error) {
      handleAsyncError(error, 'Failed to execute quick action', {
        component: 'ModernDashboard',
        operation: 'handleEnhancedQuickAction',
        action,
        errorCode: ErrorCodes.BUSINESS.PROCESS_FAILED,
      });
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-red-800">
            Failed to Load Dashboard
          </h2>
          <p className="text-gray-600 mt-2 mb-6 text-sm sm:text-base">{error}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              className="min-h-[44px] px-6 py-3 text-base" // Touch-friendly minimum size
            >
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Enhanced status badge with mobile optimization
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: {
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        label: 'Draft',
        icon: DocumentTextIcon,
      },
      REVIEW: {
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Review',
        icon: ClockIcon,
      },
      ACTIVE: {
        color: 'bg-green-50 text-green-700 border-green-200',
        label: 'Active',
        icon: CheckCircleIcon,
      },
      APPROVED: {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'Approved',
        icon: CheckCircleIconSolid,
      },
      SUBMITTED: {
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        label: 'Submitted',
        icon: CheckCircleIconSolid,
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border ${config.color}`}
      >
        <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="truncate">{config.label}</span>
      </span>
    );
  };

  const getUrgencyIcon = (urgency: string) => {
    const baseClasses = 'w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0';
    switch (urgency) {
      case 'critical':
        return <FireIcon className={`${baseClasses} text-red-500`} />;
      case 'high':
        return <ExclamationTriangleIcon className={`${baseClasses} text-orange-500`} />;
      case 'medium':
        return <ClockIcon className={`${baseClasses} text-amber-500`} />;
      default:
        return <ClockIcon className={`${baseClasses} text-gray-400`} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Mobile-Enhanced Welcome Header with Touch-Friendly Design */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Welcome back, {user?.name.split(' ')[0]}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="truncate">Ready to create amazing proposals</span>
              </p>
            </div>

            {/* Mobile-optimized quick actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={() => handleEnhancedQuickAction('create-proposal')}
                className="min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation"
                style={{ touchAction: 'manipulation' }}
              >
                <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Create Proposal</span>
              </Button>

              <Button
                onClick={() => handleEnhancedQuickAction('search')}
                variant="outline"
                className="min-h-[44px] border-gray-300 text-gray-700 hover:bg-gray-50 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation"
                style={{ touchAction: 'manipulation' }}
              >
                <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Search</span>
                <span className="sm:hidden" aria-label="Search">
                  🔍
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content with Enhanced Mobile Layout */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8 lg:space-y-10">
        {/* Key Metrics - Enhanced Mobile Grid */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Key Metrics</h2>
            <button
              onClick={() => setExpandedMetrics(!expandedMetrics)}
              className="sm:hidden touch-target-enhanced p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
              aria-label={expandedMetrics ? 'Collapse metrics' : 'Expand metrics'}
            >
              <EyeIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile-first responsive grid - always stacks on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {/* Active Proposals Metric */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/60 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg sm:rounded-xl">
                  <ChartPieIconSolid className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">Active</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {data.metrics.activeProposals}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Active Proposals</p>
              </div>
            </div>

            {/* Pending Tasks Metric */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/60 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-amber-50 rounded-lg sm:rounded-xl">
                  <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">Pending</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {data.metrics.pendingTasks}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Tasks Due</p>
              </div>
            </div>

            {/* Show additional metrics on larger screens or when expanded on mobile */}
            <div
              className={`${expandedMetrics ? 'block' : 'hidden'} sm:block bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/60 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-green-50 rounded-lg sm:rounded-xl">
                  <CheckCircleIconSolid className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">Rate</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {Math.round(data.metrics.completionRate)}%
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Completion Rate</p>
              </div>
            </div>

            <div
              className={`${expandedMetrics ? 'block' : 'hidden'} sm:block bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/60 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-purple-50 rounded-lg sm:rounded-xl">
                  <BoltIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">Time</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {data.metrics.avgCompletionTime}d
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Avg. Completion</p>
              </div>
            </div>
          </div>
        </section>

        {/* Priority Items with Mobile Optimization */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              Priority Items ({priorityItems.length})
            </h2>
            <Link
              href="/dashboard/tasks"
              className="min-h-[44px] min-w-[44px] flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
            >
              <span className="hidden sm:inline">View All</span>
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {priorityItems.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/60 p-6 sm:p-8 text-center">
              <CheckCircleIconSolid className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                All caught up!
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                No urgent tasks requiring your attention.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {priorityItems.slice(0, expandedProposals ? priorityItems.length : 3).map(item => (
                <div
                  key={item.id}
                  className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200/60 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getUrgencyIcon(item.urgency)}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                          {item.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={item.actionUrl}
                      className="min-h-[44px] bg-gray-900 hover:bg-gray-800 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <span>{item.actionLabel}</span>
                      <ChevronRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}

              {/* Show more/less toggle for mobile */}
              {priorityItems.length > 3 && (
                <button
                  onClick={() => setExpandedProposals(!expandedProposals)}
                  className="w-full sm:hidden min-h-[44px] bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span>
                    {expandedProposals ? 'Show Less' : `Show ${priorityItems.length - 3} More`}
                  </span>
                  <ChevronRightIcon
                    className={`w-4 h-4 transition-transform ${expandedProposals ? 'rotate-90' : ''}`}
                  />
                </button>
              )}
            </div>
          )}
        </section>

        {/* Recent Proposals with Mobile Enhancement */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              Recent Proposals
            </h2>
            <Link
              href="/proposals"
              className="min-h-[44px] min-w-[44px] flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
            >
              <span className="hidden sm:inline">View All</span>
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {proposals.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/60 p-6 sm:p-8 text-center">
              <DocumentTextIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                No proposals yet
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Create your first proposal to get started.
              </p>
              <Button
                onClick={() => handleEnhancedQuickAction('create-proposal')}
                className="min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm sm:text-base font-medium rounded-lg"
              >
                Create Proposal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {proposals.slice(0, 6).map(proposal => (
                <Link
                  key={proposal.id}
                  href={`/proposals/${proposal.id}`}
                  className="group bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200/60 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {proposal.title}
                      </h3>
                      {getStatusBadge(proposal.status)}
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                      <span>Due {new Date(proposal.dueDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          proposal.priority === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : proposal.priority === 'HIGH'
                              ? 'bg-orange-100 text-orange-700'
                              : proposal.priority === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {proposal.priority}
                      </span>

                      <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions Grid - Enhanced Mobile Optimization */}
        <section className="space-y-4 sm:space-y-6">
          <h2 className="mobile-heading-fluid text-gray-900">Quick Actions</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {[
              {
                title: 'Create Proposal',
                description: 'Start a new proposal from scratch or template',
                icon: PlusIcon,
                color: 'bg-blue-50 text-blue-600',
                href: '/proposals/create',
                action: 'create-proposal',
              },
              {
                title: 'Search Content',
                description: 'Find existing content and resources',
                icon: MagnifyingGlassIcon,
                color: 'bg-green-50 text-green-600',
                href: '/content',
                action: 'search-content',
              },
              {
                title: 'Manage Products',
                description: 'View and configure product catalog',
                icon: UsersIcon,
                color: 'bg-purple-50 text-purple-600',
                href: '/products',
                action: 'manage-products',
              },
            ].map(action => (
              <Link
                key={action.action}
                href={action.href}
                onClick={() => handleEnhancedQuickAction(action.action)}
                className="group mobile-card touch-target-enhanced touch-manipulation mobile-gpu-boost bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200/60 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 touch-feedback"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div
                    className={`inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl ${action.color} touch-target-enhanced`}
                  >
                    <action.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="mobile-text-fluid font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="mobile-text-fluid text-gray-600 line-clamp-2">
                      {action.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-end">
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
