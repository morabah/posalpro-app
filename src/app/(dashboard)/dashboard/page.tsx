/**
 * PosalPro MVP2 - Dashboard Page
 * Main dashboard with enhanced navigation and layout system
 * Updated to work with the dashboard layout system
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Component Traceability Matrix for Dashboard with Navigation
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3', 'US-2.3'],
  acceptanceCriteria: [
    'AC-4.1.1', // Timeline visualization
    'AC-4.1.3', // On-time completion tracking
    'AC-4.3.1', // Priority visualization
    'AC-4.3.3', // Progress tracking
    'AC-2.3.1', // Role-based access
    'Navigation integration',
    'Quick access functionality',
  ],
  methods: [
    'renderDashboardWidgets()',
    'trackQuickActions()',
    'displayRoleBasedContent()',
    'navigateToSections()',
    'trackUserActivity()',
    'optimizeUserExperience()',
  ],
  hypotheses: ['H7', 'H4'],
  testCases: ['TC-H7-001', 'TC-H7-002', 'TC-NAV-001'],
};

// Mock data structures
interface DashboardMetrics {
  activeProposals: number;
  pendingTasks: number;
  completionRate: number;
  avgCompletionTime: number;
  onTimeDelivery: number;
}

interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  description: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeProposals: 12,
    pendingTasks: 8,
    completionRate: 87.5,
    avgCompletionTime: 12.3,
    onTimeDelivery: 94.2,
  });
  const [sessionStartTime] = useState(Date.now());
  const hasTrackedInitialLoad = useRef(false);

  // Quick actions based on wireframe specifications
  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'new-proposal',
        label: 'New Proposal',
        href: '/proposals/create',
        icon: PlusIcon,
        color: 'bg-blue-600 hover:bg-blue-700',
        description: 'Create a new proposal',
      },
      {
        id: 'search-content',
        label: 'Search Content',
        href: '/content/search',
        icon: DocumentTextIcon,
        color: 'bg-green-600 hover:bg-green-700',
        description: 'Find content for proposals',
      },
      {
        id: 'assign-smes',
        label: 'Assign SMEs',
        href: '/sme/assignments',
        icon: UsersIcon,
        color: 'bg-purple-600 hover:bg-purple-700',
        description: 'Assign subject matter experts',
      },
      {
        id: 'run-validation',
        label: 'Run Validation',
        href: '/validation',
        icon: ShieldCheckIcon,
        color: 'bg-orange-600 hover:bg-orange-700',
        description: 'Validate proposal configurations',
      },
    ],
    []
  );

  // Analytics tracking for dashboard interactions
  const trackDashboardAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Dashboard Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        sessionDuration: Date.now() - sessionStartTime,
        component: 'DashboardPage',
        userStory: 'US-4.1',
        hypothesis: 'H7',
      });
    },
    [sessionStartTime]
  );

  // Handle quick action clicks
  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      trackDashboardAction('quick_action_clicked', {
        actionId: action.id,
        actionLabel: action.label,
        destination: action.href,
      });
      router.push(action.href);
    },
    [trackDashboardAction, router]
  );

  // Track page load and metrics
  useEffect(() => {
    if (!hasTrackedInitialLoad.current) {
      trackDashboardAction('dashboard_loaded', {
        activeProposals: metrics.activeProposals,
        pendingTasks: metrics.pendingTasks,
        completionRate: metrics.completionRate,
      });
      hasTrackedInitialLoad.current = true;
    }
  }, [metrics, trackDashboardAction]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header with Breadcrumbs */}
      <div className="mb-8">
        <Breadcrumbs className="mb-4" />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, Mohamed</h1>
            <p className="text-gray-600 mt-1">
              {metrics.activeProposals} active proposals • {metrics.pendingTasks} priority items
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right text-sm text-gray-600">
              <div>On-time delivery: {metrics.onTimeDelivery}%</div>
              <div>Avg completion: {metrics.avgCompletionTime} days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map(action => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className={`${action.color} text-white flex flex-col items-center justify-center py-6 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 h-24`}
                aria-label={action.description}
              >
                <IconComponent className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
              <ChartBarIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="text-lg font-semibold text-green-600">
                  {metrics.completionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${metrics.completionRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">On-time Delivery</span>
                <span className="text-lg font-semibold text-blue-600">
                  {metrics.onTimeDelivery}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${metrics.onTimeDelivery}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Active Workload</h3>
              <ClockIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{metrics.activeProposals}</div>
                  <div className="text-sm text-blue-700">Active Proposals</div>
                </div>
                <DocumentTextIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{metrics.pendingTasks}</div>
                  <div className="text-sm text-orange-700">Pending Tasks</div>
                </div>
                <ClockIcon className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              {
                time: '2 hours ago',
                action: 'Proposal "Enterprise Security" moved to Review',
                type: 'info',
              },
              {
                time: '4 hours ago',
                action: 'SME assignment completed for "Healthcare Solutions"',
                type: 'success',
              },
              {
                time: '6 hours ago',
                action: 'Validation issues found in "Data Analytics Package"',
                type: 'warning',
              },
              { time: '1 day ago', action: 'New proposal "Cloud Migration" created', type: 'info' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 py-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === 'success'
                      ? 'bg-green-500'
                      : activity.type === 'warning'
                      ? 'bg-orange-500'
                      : 'bg-blue-500'
                  }`}
                ></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => trackDashboardAction('view_all_activity')}
            >
              View All Activity
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
