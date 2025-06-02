/**
 * PosalPro MVP2 - Enhanced Dashboard Screen (H2.5)
 * Implementation based on DASHBOARD_SCREEN.md wireframe specifications
 * Features: Role-based widgets, real-time data, performance optimization, analytics integration
 */

'use client';

import { ProposalOverview } from '@/components/dashboard/widgets/ProposalOverview';
import { RecentActivity } from '@/components/dashboard/widgets/RecentActivity';
import { Button } from '@/components/ui/forms/Button';
import { useDashboardAnalytics } from '@/hooks/dashboard/useDashboardAnalytics';
import { getRoleSpecificMockData } from '@/lib/dashboard/mockData';
import { UserType } from '@/types';
import {
  BarChart3Icon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  LogOutIcon,
  MenuIcon,
  RefreshCwIcon,
  SettingsIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

// Widget Loading Component
const WidgetSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-neutral-200 rounded-lg w-32 animate-pulse"></div>
        <div className="h-8 w-8 bg-neutral-200 rounded-lg animate-pulse"></div>
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-neutral-100 rounded-lg animate-pulse"></div>
        <div className="h-4 bg-neutral-100 rounded-lg w-3/4 animate-pulse"></div>
        <div className="h-4 bg-neutral-100 rounded-lg w-1/2 animate-pulse"></div>
      </div>
      <div className="mt-6 flex space-x-2">
        <div className="h-8 bg-neutral-100 rounded-lg w-20 animate-pulse"></div>
        <div className="h-8 bg-neutral-100 rounded-lg w-16 animate-pulse"></div>
      </div>
    </div>
  </div>
);

// QuickActions Widget Component
const QuickActions = ({ userRole, onInteraction }: { userRole: UserType; onInteraction: any }) => {
  const getQuickActions = (role: UserType) => {
    const baseActions = [
      { id: 'profile', label: 'Edit Profile', icon: UserIcon, color: 'blue' },
      { id: 'settings', label: 'Settings', icon: SettingsIcon, color: 'gray' },
    ];

    switch (role) {
      case UserType.PROPOSAL_MANAGER:
        return [
          { id: 'create-proposal', label: 'New Proposal', icon: UserIcon, color: 'green' },
          { id: 'review-proposals', label: 'Review Queue', icon: UserIcon, color: 'orange' },
          ...baseActions,
        ];
      case UserType.SME:
        return [
          { id: 'contribute', label: 'Contribute', icon: UserIcon, color: 'purple' },
          { id: 'expertise', label: 'Manage Expertise', icon: UserIcon, color: 'blue' },
          ...baseActions,
        ];
      case UserType.EXECUTIVE:
        return [
          { id: 'approve', label: 'Approve Queue', icon: UserIcon, color: 'red' },
          { id: 'analytics', label: 'View Analytics', icon: UserIcon, color: 'indigo' },
          ...baseActions,
        ];
      default:
        return baseActions;
    }
  };

  const actions = getQuickActions(userRole);

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => {
              onInteraction('quick_action_clicked', { actionId: action.id });
              console.log('Quick action:', action.id);
            }}
            className="p-3 text-left border rounded-lg hover:bg-neutral-50 transition-colors duration-200"
          >
            <action.icon className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-sm font-medium text-neutral-900">{action.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// TeamCollaboration Widget Component
const TeamCollaboration = ({ teamData, onInteraction }: { teamData: any; onInteraction: any }) => (
  <div className="bg-white p-6 rounded-lg shadow border">
    <h3 className="text-lg font-semibold text-neutral-900 mb-4">Team Collaboration</h3>
    <div className="space-y-3">
      {teamData?.slice(0, 4).map((member: any) => (
        <div key={member.id} className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${
              member.status === 'online'
                ? 'bg-green-500'
                : member.status === 'away'
                ? 'bg-yellow-500'
                : 'bg-neutral-400'
            }`}
          ></div>
          <div className="flex-1">
            <div className="text-sm font-medium text-neutral-900">{member.name}</div>
            <div className="text-xs text-neutral-600">{member.role.replace('_', ' ')}</div>
          </div>
          <div className="text-xs text-neutral-500">{member.currentProposals} proposals</div>
        </div>
      )) || <div className="text-neutral-500 text-sm">Loading team data...</div>}
    </div>
    <button
      onClick={() => onInteraction('view_team_details')}
      className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
    >
      View All Team Members →
    </button>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Convert NextAuth user to UserType
  const getUserType = (roles?: string[]): UserType => {
    const primaryRole = roles?.[0];
    switch (primaryRole) {
      case 'Proposal Manager':
        return UserType.PROPOSAL_MANAGER;
      case 'Subject Matter Expert (SME)':
        return UserType.SME;
      case 'Executive':
        return UserType.EXECUTIVE;
      case 'Content Manager':
        return UserType.CONTENT_MANAGER;
      case 'System Administrator':
        return UserType.SYSTEM_ADMINISTRATOR;
      default:
        return UserType.PROPOSAL_MANAGER;
    }
  };

  // Analytics integration
  const analytics = useDashboardAnalytics(
    session?.user?.email,
    getUserType(session?.user?.roles),
    `session-${Date.now()}` // Simple session ID
  );

  // Load dashboard data
  const loadDashboardData = useMemo(() => {
    if (!session?.user?.roles?.[0]) return null;

    const userType = getUserType(session.user.roles);
    const roleData = getRoleSpecificMockData(userType);
    return {
      proposals: {
        metrics: roleData.proposals.metrics,
        activeProposals: roleData.proposals.active,
        userRole: userType,
      },
      activities: {
        activities: roleData.activities,
        unreadCount: roleData.activities.filter(a => !a.actionRequired).length,
      },
      team: roleData.team,
      deadlines: roleData.deadlines,
      notifications: roleData.notifications,
    };
  }, [session?.user?.roles]);

  // Auto-refresh data
  useEffect(() => {
    if (loadDashboardData) {
      setDashboardData(loadDashboardData);
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [loadDashboardData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (loadDashboardData) {
        setDashboardData(loadDashboardData);
        setLastRefresh(new Date());
        analytics.trackEvent('dashboard_auto_refresh');
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadDashboardData, analytics]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/dashboard');
    }
  }, [status, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  // Handle interactions
  const handleWidgetInteraction = (widgetId: string, action: string, metadata?: any) => {
    analytics.trackWidgetInteraction(widgetId, action, metadata);
  };

  const handleRefresh = () => {
    setLoading(true);
    analytics.trackEvent('manual_refresh');

    // Simulate refresh delay
    setTimeout(() => {
      if (loadDashboardData) {
        setDashboardData(loadDashboardData);
        setLoading(false);
        setLastRefresh(new Date());
      }
    }, 500);
  };

  const handleLogout = () => {
    analytics.trackEvent('logout_initiated', { source: 'dashboard' });
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                {sidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                PosalPro
              </h1>
              <span className="text-sm text-neutral-500 hidden sm:block px-2 py-1 bg-neutral-100 rounded-full">
                Dashboard
              </span>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Auto-refresh indicator */}
              <div className="hidden sm:flex items-center space-x-2 text-xs text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-full border">
                <RefreshCwIcon
                  className={`w-4 h-4 ${
                    autoRefresh ? 'animate-spin text-green-500' : 'text-neutral-400'
                  }`}
                />
                <span>Last: {lastRefresh.toLocaleTimeString()}</span>
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
                <BellIcon className="w-5 h-5" />
                {dashboardData?.notifications?.filter((n: any) => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-lg animate-pulse">
                    {dashboardData.notifications.filter((n: any) => !n.read).length}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div className="flex items-center space-x-3 bg-white rounded-lg px-3 py-2 border border-neutral-200 shadow-sm">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-semibold text-neutral-900">
                    {session?.user?.email}
                  </div>
                  <div className="text-xs text-primary-600 font-medium">
                    {session?.user?.roles?.[0]?.replace('_', ' ')}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {session?.user?.email.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-md text-neutral-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Sign Out"
                  >
                    <LogOutIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 border border-primary-100">
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">
              Welcome back, {session?.user?.email.split('@')[0]}! 👋
            </h2>
            <p className="text-neutral-600 text-lg">
              Here&apos;s your {session?.user?.roles?.[0]?.replace('_', ' ').toLowerCase()}{' '}
              dashboard overview
            </p>
          </div>
        </div>

        {/* Dashboard Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>

            <button
              onClick={() => {
                setAutoRefresh(!autoRefresh);
                analytics.trackEvent('auto_refresh_toggled', { enabled: !autoRefresh });
              }}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md ${
                autoRefresh
                  ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                  : 'bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200'
              }`}
            >
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center space-x-2 text-sm text-neutral-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live data</span>
          </div>
        </div>

        {/* Dashboard Widgets */}
        <div className="space-y-8">
          {/* Top Row - Main Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Suspense fallback={<WidgetSkeleton />}>
              <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <ProposalOverview
                  widget={{} as any}
                  data={dashboardData?.proposals}
                  loading={loading}
                  onRefresh={handleRefresh}
                  onInteraction={(action, metadata) =>
                    handleWidgetInteraction('proposal-overview', action, metadata)
                  }
                />
              </div>
            </Suspense>

            <Suspense fallback={<WidgetSkeleton />}>
              <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <RecentActivity
                  widget={{} as any}
                  data={dashboardData?.activities}
                  loading={loading}
                  onRefresh={handleRefresh}
                  onInteraction={(action, metadata) =>
                    handleWidgetInteraction('recent-activity', action, metadata)
                  }
                />
              </div>
            </Suspense>
          </div>

          {/* Bottom Row - Secondary Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Suspense fallback={<WidgetSkeleton />}>
              <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <QuickActions
                  userRole={getUserType(session?.user?.roles)}
                  onInteraction={(action: string, metadata?: any) =>
                    handleWidgetInteraction('quick-actions', action, metadata)
                  }
                />
              </div>
            </Suspense>

            <Suspense fallback={<WidgetSkeleton />}>
              <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <TeamCollaboration
                  teamData={dashboardData?.team}
                  onInteraction={(action: string, metadata?: any) =>
                    handleWidgetInteraction('team-collaboration', action, metadata)
                  }
                />
              </div>
            </Suspense>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Active Projects</p>
                  <p className="text-3xl font-bold">12</p>
                </div>
                <div className="bg-blue-400/30 rounded-lg p-3">
                  <BarChart3Icon className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold">87%</p>
                </div>
                <div className="bg-green-400/30 rounded-lg p-3">
                  <CheckCircleIcon className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending Review</p>
                  <p className="text-3xl font-bold">5</p>
                </div>
                <div className="bg-yellow-400/30 rounded-lg p-3">
                  <ClockIcon className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Team Members</p>
                  <p className="text-3xl font-bold">24</p>
                </div>
                <div className="bg-purple-400/30 rounded-lg p-3">
                  <UserIcon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Debug (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-12 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <h4 className="text-lg font-semibold text-neutral-900">Development Debug Panel</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <p className="text-sm font-medium text-neutral-700 mb-1">Session Duration</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(analytics.getSessionStats().sessionDuration / 1000)}s
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <p className="text-sm font-medium text-neutral-700 mb-1">Interactions</p>
                <p className="text-2xl font-bold text-green-600">
                  {analytics.getSessionStats().interactionCount}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <p className="text-sm font-medium text-neutral-700 mb-1">Last Refresh</p>
                <p className="text-sm font-mono text-neutral-600">
                  {lastRefresh.toLocaleTimeString()}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <p className="text-sm font-medium text-neutral-700 mb-1">Auto-refresh</p>
                <p
                  className={`text-sm font-semibold ${
                    autoRefresh ? 'text-green-600' : 'text-neutral-500'
                  }`}
                >
                  {autoRefresh ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
