/**
 * PosalPro MVP2 - Dashboard Widget Registry
 * Centralized widget configuration and role-based filtering system
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 */

import type { DashboardWidget, RoleWidgetMap, WidgetRegistry } from '@/lib/dashboard/types';
import { UserType } from '@/types';
import { lazy } from 'react';

// Lazy load existing widgets
const ProposalOverview = lazy(() =>
  import('@/components/dashboard/widgets/ProposalOverview').then(module => ({
    default: module.ProposalOverview,
  }))
);

const RecentActivity = lazy(() =>
  import('@/components/dashboard/widgets/RecentActivity').then(module => ({
    default: module.RecentActivity,
  }))
);

// Simple component function for placeholders
const createPlaceholderComponent = (title: string) => {
  return function PlaceholderComponent() {
    return null; // Will be replaced with actual widgets in Phase 2
  };
};

// Widget configuration registry
export const WIDGET_REGISTRY: WidgetRegistry = {
  'proposal-overview': {
    id: 'proposal-overview',
    component: ProposalOverview,
    title: 'Proposal Overview',
    description: 'Comprehensive proposal statistics and status tracking',
    roles: [UserType.PROPOSAL_MANAGER, UserType.EXECUTIVE, UserType.SYSTEM_ADMINISTRATOR],
    permissions: ['proposals.read'],
    size: 'large',
    position: { row: 0, col: 0 },
    refreshInterval: 300000, // 5 minutes
    analytics: {
      userStory: ['US-4.1', 'US-4.3'],
      hypothesis: ['H7', 'H4'],
      metrics: ['proposal_completion_rate', 'on_time_delivery', 'win_rate'],
    },
  },

  'recent-activity': {
    id: 'recent-activity',
    component: RecentActivity,
    title: 'Recent Activity',
    description: 'Activity feed with notifications and recent updates',
    roles: [
      UserType.PROPOSAL_MANAGER,
      UserType.CONTENT_MANAGER,
      UserType.SME,
      UserType.EXECUTIVE,
      UserType.SYSTEM_ADMINISTRATOR,
    ],
    permissions: ['activities.read'],
    size: 'medium',
    position: { row: 0, col: 9 },
    refreshInterval: 60000, // 1 minute
    analytics: {
      userStory: ['US-4.3'],
      hypothesis: ['H4'],
      metrics: ['activity_engagement', 'notification_response_rate'],
    },
  },

  'team-collaboration': {
    id: 'team-collaboration',
    component: createPlaceholderComponent('Team Collaboration'),
    title: 'Team Collaboration',
    description: 'Team status, coordination, and collaboration metrics',
    roles: [
      UserType.PROPOSAL_MANAGER,
      UserType.SME,
      UserType.EXECUTIVE,
      UserType.SYSTEM_ADMINISTRATOR,
    ],
    permissions: ['team.read'],
    size: 'medium',
    position: { row: 1, col: 0 },
    refreshInterval: 180000, // 3 minutes
    analytics: {
      userStory: ['US-2.3'],
      hypothesis: ['H4'],
      metrics: ['team_coordination_score', 'collaboration_efficiency'],
    },
  },

  'deadline-tracker': {
    id: 'deadline-tracker',
    component: createPlaceholderComponent('Deadline Tracker'),
    title: 'Deadline Tracker',
    description: 'Upcoming deadlines and critical timeline management',
    roles: [UserType.PROPOSAL_MANAGER, UserType.EXECUTIVE, UserType.SYSTEM_ADMINISTRATOR],
    permissions: ['deadlines.read'],
    size: 'medium',
    position: { row: 1, col: 6 },
    refreshInterval: 300000, // 5 minutes
    analytics: {
      userStory: ['US-4.1'],
      hypothesis: ['H7'],
      metrics: ['deadline_adherence', 'timeline_accuracy'],
    },
  },

  'performance-metrics': {
    id: 'performance-metrics',
    component: createPlaceholderComponent('Performance Metrics'),
    title: 'Performance Metrics',
    description: 'Individual and team performance analytics',
    roles: [UserType.PROPOSAL_MANAGER, UserType.EXECUTIVE, UserType.SYSTEM_ADMINISTRATOR],
    permissions: ['metrics.read'],
    size: 'large',
    position: { row: 2, col: 0 },
    refreshInterval: 600000, // 10 minutes
    analytics: {
      userStory: ['US-4.1', 'US-4.3'],
      hypothesis: ['H7', 'H4', 'H8'],
      metrics: ['user_productivity', 'quality_score', 'efficiency_rating'],
    },
  },

  'quick-actions': {
    id: 'quick-actions',
    component: createPlaceholderComponent('Quick Actions'),
    title: 'Quick Actions',
    description: 'Role-based quick access to key functions',
    roles: [
      UserType.PROPOSAL_MANAGER,
      UserType.CONTENT_MANAGER,
      UserType.SME,
      UserType.SYSTEM_ADMINISTRATOR,
    ],
    permissions: ['actions.execute'],
    size: 'small',
    position: { row: 2, col: 9 },
    refreshInterval: 0, // No auto-refresh needed
    analytics: {
      userStory: ['US-1.1', 'US-2.1', 'US-3.1', 'US-4.1'],
      hypothesis: ['H1', 'H3', 'H6', 'H7'],
      metrics: ['quick_action_usage', 'feature_adoption'],
    },
  },

  // SME-specific widgets
  'sme-assignments': {
    id: 'sme-assignments',
    component: createPlaceholderComponent('SME Assignments'),
    title: 'SME Assignments',
    description: 'Current assignments and contribution requests',
    roles: [UserType.SME, UserType.SYSTEM_ADMINISTRATOR],
    permissions: ['sme.assignments.read'],
    size: 'medium',
    position: { row: 0, col: 0 },
    refreshInterval: 300000,
    analytics: {
      userStory: ['US-3.1'],
      hypothesis: ['H6'],
      metrics: ['assignment_completion_rate', 'response_time'],
    },
  },

  'validation-status': {
    id: 'validation-status',
    component: createPlaceholderComponent('Validation Status'),
    title: 'Validation Status',
    description: 'Technical validation results and system status',
    roles: [UserType.SME, UserType.PROPOSAL_MANAGER, UserType.SYSTEM_ADMINISTRATOR],
    permissions: ['validation.read'],
    size: 'medium',
    position: { row: 0, col: 6 },
    refreshInterval: 180000,
    analytics: {
      userStory: ['US-3.1'],
      hypothesis: ['H8'],
      metrics: ['validation_accuracy', 'error_reduction'],
    },
  },

  // Executive-specific widgets
  'executive-summary': {
    id: 'executive-summary',
    component: createPlaceholderComponent('Executive Summary'),
    title: 'Executive Summary',
    description: 'High-level business metrics and KPIs',
    roles: [UserType.EXECUTIVE, UserType.SYSTEM_ADMINISTRATOR],
    permissions: ['executive.read'],
    size: 'full',
    position: { row: 0, col: 0 },
    refreshInterval: 900000, // 15 minutes
    analytics: {
      userStory: ['US-4.1', 'US-4.3'],
      hypothesis: ['H7', 'H4'],
      metrics: ['business_kpi', 'revenue_pipeline'],
    },
  },
};

// Role-based widget mapping for default dashboard configurations
export const ROLE_WIDGET_MAP: RoleWidgetMap = {
  [UserType.PROPOSAL_MANAGER]: [
    'proposal-overview',
    'recent-activity',
    'team-collaboration',
    'deadline-tracker',
    'performance-metrics',
    'quick-actions',
  ],
  [UserType.CONTENT_MANAGER]: ['recent-activity', 'team-collaboration', 'quick-actions'],
  [UserType.SME]: [
    'sme-assignments',
    'recent-activity',
    'team-collaboration',
    'validation-status',
    'quick-actions',
  ],
  [UserType.EXECUTIVE]: [
    'executive-summary',
    'proposal-overview',
    'performance-metrics',
    'deadline-tracker',
  ],
  [UserType.SYSTEM_ADMINISTRATOR]: [
    'proposal-overview',
    'recent-activity',
    'team-collaboration',
    'deadline-tracker',
    'performance-metrics',
    'validation-status',
    'executive-summary',
    'quick-actions',
  ],
};

/**
 * Get widgets configured for a specific user role
 */
export function getWidgetsForRole(userRole: UserType): DashboardWidget[] {
  const widgetIds = ROLE_WIDGET_MAP[userRole] || [];
  return widgetIds.map(id => WIDGET_REGISTRY[id]).filter(widget => widget !== undefined);
}

/**
 * Get a specific widget by ID
 */
export function getWidget(widgetId: string): DashboardWidget | undefined {
  return WIDGET_REGISTRY[widgetId];
}

/**
 * Get all available widgets
 */
export function getAllWidgets(): DashboardWidget[] {
  return Object.values(WIDGET_REGISTRY);
}

/**
 * Filter widgets by user permissions
 */
export function filterWidgetsByPermissions(
  widgets: DashboardWidget[],
  userPermissions: string[]
): DashboardWidget[] {
  return widgets.filter(widget => {
    // If widget has no permission requirements, it's accessible to all
    if (widget.permissions.length === 0) {
      return true;
    }

    // Check if user has at least one required permission
    return widget.permissions.some(permission => userPermissions.includes(permission));
  });
}

/**
 * Get role-specific widget configuration with permission filtering
 */
export function getDashboardConfiguration(
  userRole: UserType,
  userPermissions: string[] = []
): DashboardWidget[] {
  const roleWidgets = getWidgetsForRole(userRole);
  return filterWidgetsByPermissions(roleWidgets, userPermissions);
}

/**
 * Validate widget configuration
 */
export function validateWidgetConfiguration(widget: DashboardWidget): boolean {
  // Basic validation checks
  if (!widget.id || !widget.component || !widget.title) {
    return false;
  }

  // Check if position is valid
  if (widget.position.row < 0 || widget.position.col < 0) {
    return false;
  }

  // Check if size is valid
  if (!['small', 'medium', 'large', 'full'].includes(widget.size)) {
    return false;
  }

  // Check if roles are valid
  if (widget.roles.length === 0) {
    return false;
  }

  return true;
}

/**
 * Get widgets that need refresh based on their refresh intervals
 */
export function getWidgetsNeedingRefresh(
  widgets: DashboardWidget[],
  lastRefreshTimes: Record<string, number>
): string[] {
  const now = Date.now();

  return widgets
    .filter(widget => {
      if (!widget.refreshInterval || widget.refreshInterval === 0) {
        return false;
      }

      const lastRefresh = lastRefreshTimes[widget.id] || 0;
      return now - lastRefresh >= widget.refreshInterval;
    })
    .map(widget => widget.id);
}

/**
 * Sort widgets by their position for layout rendering
 */
export function sortWidgetsByPosition(widgets: DashboardWidget[]): DashboardWidget[] {
  return widgets.sort((a, b) => {
    if (a.position.row !== b.position.row) {
      return a.position.row - b.position.row;
    }
    return a.position.col - b.position.col;
  });
}

// Analytics tracking for widget registry operations
export const WIDGET_REGISTRY_ANALYTICS = {
  userStories: ['US-2.3', 'US-4.1', 'US-4.3'],
  acceptanceCriteria: [
    'AC-2.3.1', // Role-based access control
    'AC-4.1.1', // Dashboard timeline visualization
    'AC-4.3.1', // Priority visualization
  ],
  methods: [
    'getWidgetsForRole()',
    'filterWidgetsByPermissions()',
    'getDashboardConfiguration()',
    'validateWidgetConfiguration()',
  ],
  hypotheses: ['H4', 'H7', 'H8'],
  testCases: ['TC-WIDGET-001', 'TC-ROLE-001', 'TC-PERMISSION-001'],
};
