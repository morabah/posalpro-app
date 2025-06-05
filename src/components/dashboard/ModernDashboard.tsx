/**
 * PosalPro MVP2 - Modern Dashboard Component
 * Redesigned with sleek, modern UI following DASHBOARD_SCREEN.md wireframe specifications
 * Features: Premium styling, proper spacing, brand colors, modern interactions
 */

'use client';

import { Button } from '@/components/ui/forms/Button';
import { UserType } from '@/types';
import {
  BoltIcon,
  CalendarIcon,
  ChartPieIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  ChartPieIcon as ChartPieIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  FireIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';

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
  user: {
    id: string;
    name: string;
    role: UserType;
  };
  data: DashboardData;
  proposals: ProposalItem[];
  priorityItems: PriorityItem[];
  onQuickAction?: (action: string) => void;
}

export default function ModernDashboard({
  user,
  data,
  proposals,
  priorityItems,
  onQuickAction,
}: ModernDashboardProps) {
  // Status badge styling following design system
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
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.color}`}
      >
        <IconComponent className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <FireIcon className="w-5 h-5 text-red-500" />;
      case 'high':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <ClockIcon className="w-5 h-5 text-amber-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Enhanced Welcome Header with Premium Styling */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Welcome back, {user.name.split(' ')[0]}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-blue-500" />
                Here's what's happening with your proposals today
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ChartPieIcon className="w-3 h-3" />
                  {data.metrics.activeProposals} active proposals
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Quick Actions Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            <BoltIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/proposals/create"
              className="group"
              onClick={() => onQuickAction?.('new-proposal')}
            >
              <div className="relative bg-white rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 p-6 hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center transition-colors duration-200">
                    <PlusIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200 mb-1">
                  New Proposal
                </h3>
                <p className="text-sm text-gray-600">Create a new proposal</p>
              </div>
            </Link>

            <Link
              href="/content/search"
              className="group"
              onClick={() => onQuickAction?.('search')}
            >
              <div className="relative bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 transition-all duration-300 p-6 hover:shadow-xl hover:shadow-emerald-100/50 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 group-hover:bg-emerald-200 rounded-xl flex items-center justify-center transition-colors duration-200">
                    <MagnifyingGlassIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors duration-200" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-emerald-900 transition-colors duration-200 mb-1">
                  Search
                </h3>
                <p className="text-sm text-gray-600">Find content and templates</p>
              </div>
            </Link>

            <Link
              href="/sme/assignments"
              className="group"
              onClick={() => onQuickAction?.('assign-smes')}
            >
              <div className="relative bg-white rounded-2xl border border-gray-200 hover:border-purple-300 transition-all duration-300 p-6 hover:shadow-xl hover:shadow-purple-100/50 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-xl flex items-center justify-center transition-colors duration-200">
                    <UsersIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors duration-200" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-900 transition-colors duration-200 mb-1">
                  Assign SMEs
                </h3>
                <p className="text-sm text-gray-600">Assign subject matter experts</p>
              </div>
            </Link>

            <Link href="/validation" className="group" onClick={() => onQuickAction?.('validate')}>
              <div className="relative bg-white rounded-2xl border border-gray-200 hover:border-amber-300 transition-all duration-300 p-6 hover:shadow-xl hover:shadow-amber-100/50 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-100 group-hover:bg-amber-200 rounded-xl flex items-center justify-center transition-colors duration-200">
                    <ShieldCheckIcon className="w-6 h-6 text-amber-600" />
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors duration-200" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-amber-900 transition-colors duration-200 mb-1">
                  Validate
                </h3>
                <p className="text-sm text-gray-600">Run proposal validation</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Status Overview Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Status Overview</h2>
            <ChartPieIconSolid className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Proposals Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg shadow-gray-200/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Proposals</h3>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ChartPieIcon className="w-5 h-5 text-blue-600" />
                </div>
              </div>

              <div className="flex items-center justify-center py-8">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 144 144">
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      fill="none"
                      stroke="rgb(243 244 246)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      fill="none"
                      stroke="rgb(59 130 246)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(data.metrics.completionRate / 100) * 377} 377`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {Math.round(data.metrics.completionRate)}%
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Complete</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-900 mb-1">
                    {data.metrics.activeProposals}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">Active</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {data.proposals.length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Total</div>
                </div>
              </div>
            </div>

            {/* SMEs Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg shadow-gray-200/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">SMEs</h3>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              <div className="flex items-center justify-center py-8">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 144 144">
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      fill="none"
                      stroke="rgb(243 244 246)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      fill="none"
                      stroke="rgb(16 185 129)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(data.metrics.onTimeDelivery / 100) * 377} 377`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {data.metrics.onTimeDelivery}%
                      </div>
                      <div className="text-sm text-gray-500 font-medium">On Time</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-900 mb-1">
                    {data.metrics.pendingTasks}
                  </div>
                  <div className="text-sm text-emerald-600 font-medium">Pending</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {data.metrics.avgCompletionTime}d
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Avg Time</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Active Proposals */}
          <section>
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg shadow-gray-200/50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-semibold text-gray-900">Active Proposals</h3>
                <Link
                  href="/proposals"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:gap-2 transition-all duration-200"
                >
                  View All
                  <ChevronRightIcon className="w-4 h-4" />
                </Link>
              </div>

              {proposals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-2">No active proposals</p>
                  <Link
                    href="/proposals/create"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Create your first proposal
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {proposals.map(proposal => (
                    <Link
                      key={proposal.id}
                      href={`/proposals/${proposal.id}`}
                      className="block group"
                    >
                      <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:bg-blue-50/30">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                            {proposal.title}
                          </h4>
                          <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CalendarIcon className="w-4 h-4" />
                            Due {proposal.dueDate.toLocaleDateString()}
                          </div>
                          {getStatusBadge(proposal.status)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Priority Items */}
          <section>
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg shadow-gray-200/50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-semibold text-gray-900">Priority Items</h3>
                {priorityItems.length > 0 && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {priorityItems.length} item{priorityItems.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {priorityItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-gray-500 mb-1">All caught up!</p>
                  <p className="text-sm text-gray-400">No priority items at the moment</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {priorityItems.map(item => (
                    <Link key={item.id} href={item.actionUrl} className="block group">
                      <div className="border border-gray-200 rounded-xl p-5 hover:border-orange-300 hover:shadow-md transition-all duration-200 hover:bg-orange-50/30">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-0.5">{getUrgencyIcon(item.urgency)}</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 group-hover:text-orange-900 transition-colors mb-2">
                              {item.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 group-hover:border-orange-300 group-hover:text-orange-700 group-hover:bg-orange-50"
                          >
                            {item.actionLabel}
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
