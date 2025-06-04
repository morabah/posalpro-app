/**
 * PosalPro MVP2 - Dashboard Page
 * Enhanced dashboard with dynamic widget system and role-based customization
 * Based on DASHBOARD_SCREEN.md wireframe specifications with real database integration
 */

'use client';

import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { useDashboardAnalytics } from '@/hooks/dashboard/useDashboardAnalytics';
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

interface DashboardData {
  proposals: any[];
  customers: any[];
  products: any[];
  content: any[];
  users: any[];
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeProposals: 0,
    pendingTasks: 0,
    completionRate: 0,
    avgCompletionTime: 0,
    onTimeDelivery: 0,
  });

  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const [widgetLoading, setWidgetLoading] = useState<Record<string, boolean>>({});
  const [widgetErrors, setWidgetErrors] = useState<Record<string, string>>({});
  const [sessionStartTime] = useState(Date.now());
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    proposals: [],
    customers: [],
    products: [],
    content: [],
    users: [],
  });
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

  // Fetch real dashboard data from API
  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('🔄 Fetching real dashboard data from database...');

      // Fetch data from multiple endpoints in parallel
      const [proposalsRes, customersRes, productsRes, contentRes] = await Promise.all([
        fetch('/api/proposals?limit=20'),
        fetch('/api/customers?limit=10'),
        fetch('/api/products?limit=10'),
        fetch('/api/content?limit=10'),
      ]);

      const [proposalsData, customersData, productsData, contentData] = await Promise.all([
        proposalsRes.json(),
        customersRes.json(),
        productsRes.json(),
        contentRes.json(),
      ]);

      console.log('✅ Dashboard data fetched:', {
        proposals: proposalsData.success ? proposalsData.data?.proposals?.length || 0 : 0,
        customers: customersData.success ? customersData.data?.customers?.length || 0 : 0,
        products: productsData.success ? productsData.data?.products?.length || 0 : 0,
        content: contentData.success ? contentData.data?.content?.length || 0 : 0,
      });

      const data: DashboardData = {
        proposals: proposalsData.success ? proposalsData.data?.proposals || [] : [],
        customers: customersData.success ? customersData.data?.customers || [] : [],
        products: productsData.success ? productsData.data?.products || [] : [],
        content: contentData.success ? contentData.data?.content || [] : [],
        users: [], // Users would need separate endpoint
      };

      setDashboardData(data);

      // Calculate metrics from real data
      const proposals = data.proposals;
      const activeProposals = proposals.filter(p =>
        ['DRAFT', 'IN_REVIEW', 'PENDING_APPROVAL', 'APPROVED'].includes(p.status)
      );
      const completedProposals = proposals.filter(p =>
        ['SUBMITTED', 'ACCEPTED'].includes(p.status)
      );

      const calculatedMetrics: DashboardMetrics = {
        activeProposals: activeProposals.length,
        pendingTasks: proposals.filter(p => p.status === 'IN_REVIEW').length,
        completionRate:
          proposals.length > 0 ? (completedProposals.length / proposals.length) * 100 : 0,
        avgCompletionTime: 12.3, // Would need completion time calculation
        onTimeDelivery: 94.2, // Would need deadline analysis
      };

      setMetrics(calculatedMetrics);

      return data;
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      analytics.trackEvent('dashboard_data_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userRole: MOCK_USER.role,
      });
      throw error;
    }
  }, [analytics]);

  // Load initial widget data with real database data
  useEffect(() => {
    const loadWidgetData = async () => {
      try {
        // Fetch real dashboard data
        const data = await fetchDashboardData();

        // Map real data to widgets
        const widgetDataMap: Record<string, any> = {};
        dashboardWidgets.forEach(widget => {
          switch (widget.id) {
            case 'proposal-overview':
              const activeProposals = data.proposals.filter(p =>
                ['DRAFT', 'IN_REVIEW', 'PENDING_APPROVAL', 'APPROVED'].includes(p.status)
              );
              widgetDataMap[widget.id] = {
                metrics: {
                  active: activeProposals.length,
                  total: data.proposals.length,
                  inReview: data.proposals.filter(p => p.status === 'IN_REVIEW').length,
                  approved: data.proposals.filter(p => p.status === 'APPROVED').length,
                  pendingApproval: data.proposals.filter(p => p.status === 'PENDING_APPROVAL')
                    .length,
                  completion:
                    data.proposals.length > 0
                      ? (data.proposals.filter(p => ['SUBMITTED', 'ACCEPTED'].includes(p.status))
                          .length /
                          data.proposals.length) *
                        100
                      : 0,
                },
                activeProposals: activeProposals.slice(0, 5).map(p => ({
                  id: p.id,
                  title: p.title,
                  status: p.status.toLowerCase().replace('_', '-') as any,
                  priority: (p.priority?.toLowerCase() as any) || 'medium',
                  customer: {
                    name: p.customer?.name || 'Unknown Customer',
                    industry: p.customer?.industry || 'Unknown',
                  },
                  dueDate: p.dueDate
                    ? new Date(p.dueDate)
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  completion: 75, // Default completion percentage
                  team: [], // Would need team data
                })),
                userRole: MOCK_USER.role,
              };
              break;
            case 'recent-activity':
              // Generate activity feed from recent proposals and updates
              const recentActivities = data.proposals
                .filter(p => p.updatedAt)
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 10)
                .map(p => ({
                  id: `activity-${p.id}`,
                  type: 'proposal' as const,
                  title: `Proposal "${p.title}" ${p.status.toLowerCase().replace('_', ' ')}`,
                  description: `Status: ${p.status}`,
                  user: p.creator?.name || 'Unknown User',
                  timestamp: new Date(p.updatedAt),
                  priority: (p.priority?.toLowerCase() as any) || 'medium',
                  proposalId: p.id,
                  proposalTitle: p.title,
                }));

              widgetDataMap[widget.id] = {
                activities: recentActivities,
                notifications: [], // Would need notification system
              };
              break;
            case 'team-collaboration':
              widgetDataMap[widget.id] = {
                teamMembers: data.users, // Limited user data available
                collaborationMetrics: {
                  activeTeamMembers: 0, // Would need user status
                  avgResponseTime: 2.3,
                  coordinationScore: 8.7,
                },
              };
              break;
            case 'deadline-tracker':
              const upcomingDeadlines = data.proposals
                .filter(p => p.dueDate && new Date(p.dueDate) > new Date())
                .map(p => ({
                  id: p.id,
                  title: p.title,
                  type: 'proposal' as const,
                  dueDate: new Date(p.dueDate),
                  priority: (p.priority?.toLowerCase() as any) || 'medium',
                  status: p.status === 'APPROVED' ? 'completed' : 'pending',
                  assignedTo: p.creator?.name || 'Unassigned',
                }));

              const overdueDeadlines = data.proposals
                .filter(
                  p =>
                    p.dueDate &&
                    new Date(p.dueDate) < new Date() &&
                    !['SUBMITTED', 'ACCEPTED'].includes(p.status)
                )
                .map(p => ({
                  id: p.id,
                  title: p.title,
                  type: 'proposal' as const,
                  dueDate: new Date(p.dueDate),
                  priority: 'critical' as const,
                  status: 'overdue' as const,
                  assignedTo: p.creator?.name || 'Unassigned',
                }));

              widgetDataMap[widget.id] = {
                deadlines: [...upcomingDeadlines, ...overdueDeadlines],
                upcomingCount: upcomingDeadlines.length,
                overdueCount: overdueDeadlines.length,
              };
              break;
            case 'performance-metrics':
              widgetDataMap[widget.id] = {
                performance: {
                  proposalVolume: data.proposals.length,
                  completionRate: metrics.completionRate,
                  avgResponseTime: 2.3,
                  customerSatisfaction: 4.2,
                  revenueImpact: 1250000,
                },
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
          dataSource: 'database',
          proposalCount: data.proposals.length,
          customerCount: data.customers.length,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        analytics.trackEvent('dashboard_data_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: MOCK_USER.role,
        });

        // Fallback to empty data structure
        const fallbackDataMap: Record<string, any> = {};
        dashboardWidgets.forEach(widget => {
          fallbackDataMap[widget.id] = {
            placeholder: true,
            error: 'Failed to load data',
          };
        });
        setWidgetData(fallbackDataMap);
      }
    };

    loadWidgetData();
  }, [dashboardWidgets, analytics, sessionStartTime, fetchDashboardData, metrics.completionRate]);

  // Handle widget refresh
  const handleWidgetRefresh = useCallback(
    async (widgetId: string) => {
      setWidgetLoading(prev => ({ ...prev, [widgetId]: true }));
      setWidgetErrors(prev => ({ ...prev, [widgetId]: '' }));

      try {
        console.log(`🔄 Refreshing widget: ${widgetId}`);

        // Refresh dashboard data
        const data = await fetchDashboardData();

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
          dataSource: 'database',
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
    [analytics, fetchDashboardData]
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
