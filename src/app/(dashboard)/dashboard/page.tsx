/**
 * PosalPro MVP2 - Dashboard Page
 * Enhanced dashboard with dynamic widget system and role-based customization
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 */

'use client';

import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { useDashboardAnalytics } from '@/hooks/dashboard/useDashboardAnalytics';
import { getRoleSpecificMockData } from '@/lib/dashboard/mockData';
import { getDashboardConfiguration } from '@/lib/dashboard/widgetRegistry';
import { UserType } from '@/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Component Traceability Matrix for Enhanced Dashboard
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3', 'US-2.3'],
  acceptanceCriteria: [
    'AC-4.1.1', // Timeline visualization
    'AC-4.1.3', // On-time completion tracking
    'AC-4.3.1', // Priority visualization
    'AC-4.3.3', // Progress tracking
    'AC-2.3.1', // Role-based access
  ],
  methods: [
    'renderDynamicDashboard()',
    'manageWidgetData()',
    'trackUserInteractions()',
    'handleRoleBasedContent()',
    'optimizePerformance()',
  ],
  hypotheses: ['H7', 'H4', 'H8'],
  testCases: ['TC-H7-001', 'TC-H7-002', 'TC-H4-001', 'TC-DASHBOARD-001'],
};

// Mock user data - will be replaced with actual authentication
const MOCK_USER = {
  id: 'user-001',
  name: 'Mohamed Rabah',
  role: UserType.PROPOSAL_MANAGER,
  permissions: [
    'proposals.read',
    'activities.read',
    'team.read',
    'deadlines.read',
    'metrics.read',
    'actions.execute',
  ],
};

interface DashboardMetrics {
  activeProposals: number;
  pendingTasks: number;
  completionRate: number;
  avgCompletionTime: number;
  onTimeDelivery: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeProposals: 12,
    pendingTasks: 8,
    completionRate: 87.5,
    avgCompletionTime: 12.3,
    onTimeDelivery: 94.2,
  });

  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const [widgetLoading, setWidgetLoading] = useState<Record<string, boolean>>({});
  const [widgetErrors, setWidgetErrors] = useState<Record<string, string>>({});
  const [sessionStartTime] = useState(Date.now());
  const hasTrackedInitialLoad = useRef(false);

  const analytics = useDashboardAnalytics(
    MOCK_USER.id,
    MOCK_USER.role,
    `dashboard-${sessionStartTime}`
  );

  // Get dashboard widget configuration for user role
  const dashboardWidgets = useMemo(() => {
    return getDashboardConfiguration(MOCK_USER.role, MOCK_USER.permissions);
  }, []);

  // Load initial widget data
  useEffect(() => {
    const loadWidgetData = async () => {
      try {
        // Get mock data for all widgets
        const mockData = getRoleSpecificMockData(MOCK_USER.role);

        // Map data to widgets
        const widgetDataMap: Record<string, any> = {};
        dashboardWidgets.forEach(widget => {
          switch (widget.id) {
            case 'proposal-overview':
              widgetDataMap[widget.id] = {
                metrics: mockData.proposals.metrics,
                activeProposals: mockData.proposals.active,
                userRole: MOCK_USER.role,
              };
              break;
            case 'recent-activity':
              widgetDataMap[widget.id] = {
                activities: mockData.activities,
                notifications: mockData.notifications,
              };
              break;
            case 'team-collaboration':
              widgetDataMap[widget.id] = {
                teamMembers: mockData.team,
                collaborationMetrics: {
                  activeTeamMembers: mockData.team.filter((t: any) => t.status === 'online').length,
                  avgResponseTime: 2.3,
                  coordinationScore: 8.7,
                },
              };
              break;
            case 'deadline-tracker':
              widgetDataMap[widget.id] = {
                deadlines: mockData.deadlines,
                upcomingCount: mockData.deadlines.filter((d: any) => d.dueDate > new Date()).length,
                overdueCount: mockData.deadlines.filter(
                  (d: any) => d.dueDate < new Date() && d.status !== 'completed'
                ).length,
              };
              break;
            case 'performance-metrics':
              widgetDataMap[widget.id] = {
                performance: mockData.performance,
                trends: [
                  { metric: 'Productivity', value: 85, change: 12, direction: 'up' as const },
                  { metric: 'Quality', value: 92, change: 5, direction: 'up' as const },
                  { metric: 'Efficiency', value: 78, change: -2, direction: 'down' as const },
                ],
              };
              break;
            default:
              widgetDataMap[widget.id] = { placeholder: true };
          }
        });

        setWidgetData(widgetDataMap);

        // Track successful data load
        analytics.trackEvent('dashboard_data_loaded', {
          widgetCount: dashboardWidgets.length,
          loadTime: Date.now() - sessionStartTime,
          userRole: MOCK_USER.role,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        analytics.trackEvent('dashboard_data_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: MOCK_USER.role,
        });
      }
    };

    loadWidgetData();
  }, [dashboardWidgets, analytics, sessionStartTime]);

  // Handle widget refresh
  const handleWidgetRefresh = useCallback(
    async (widgetId: string) => {
      setWidgetLoading(prev => ({ ...prev, [widgetId]: true }));
      setWidgetErrors(prev => ({ ...prev, [widgetId]: '' }));

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Refresh widget data (would be actual API call in production)
        const mockData = getRoleSpecificMockData(MOCK_USER.role);

        // Update specific widget data
        setWidgetData(prev => ({
          ...prev,
          [widgetId]: {
            ...prev[widgetId],
            lastRefresh: new Date(),
          },
        }));

        analytics.trackWidgetInteraction(widgetId, 'refresh_completed', {
          duration: 1000,
          success: true,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Refresh failed';
        setWidgetErrors(prev => ({ ...prev, [widgetId]: errorMessage }));

        analytics.trackWidgetInteraction(widgetId, 'refresh_failed', {
          error: errorMessage,
        });
      } finally {
        setWidgetLoading(prev => ({ ...prev, [widgetId]: false }));
      }
    },
    [analytics]
  );

  // Handle widget interactions
  const handleWidgetInteraction = useCallback(
    (widgetId: string, action: string, metadata?: any) => {
      analytics.trackWidgetInteraction(widgetId, action, metadata);

      // Handle specific widget actions
      switch (action) {
        case 'navigate':
          if (metadata?.url) {
            window.location.href = metadata.url;
          }
          break;
        case 'expand':
        case 'collapse':
          // Handle widget state changes
          break;
        default:
          console.log(`Widget ${widgetId} action: ${action}`, metadata);
      }
    },
    [analytics]
  );

  // Track initial page load
  useEffect(() => {
    if (!hasTrackedInitialLoad.current) {
      analytics.trackDashboardLoaded(Date.now() - sessionStartTime);
      hasTrackedInitialLoad.current = true;
    }
  }, [analytics, sessionStartTime]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header with Breadcrumbs */}
      <div className="mb-8">
        <Breadcrumbs className="mb-4" />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {MOCK_USER.name}</h1>
            <p className="text-gray-600 mt-1">
              {metrics.activeProposals} active proposals • {metrics.pendingTasks} priority items •{' '}
              {dashboardWidgets.length} widgets
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

      {/* Dashboard Shell with Dynamic Widgets */}
      <DashboardShell
        widgets={dashboardWidgets}
        userRole={MOCK_USER.role}
        userId={MOCK_USER.id}
        data={widgetData}
        loading={widgetLoading}
        errors={widgetErrors}
        onWidgetRefresh={handleWidgetRefresh}
        onWidgetInteraction={handleWidgetInteraction}
        className="mb-8"
      />

      {/* Legacy Quick Actions - Will be moved to widget in next iteration */}
      <Card className="mt-8">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Dashboard Widgets:</span> {dashboardWidgets.length}{' '}
              configured
            </div>
            <div>
              <span className="font-medium">Role:</span> {MOCK_USER.role}
            </div>
            <div>
              <span className="font-medium">Permissions:</span> {MOCK_USER.permissions.length}{' '}
              granted
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
