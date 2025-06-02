/**
 * Dashboard Types & Interfaces
 * Comprehensive type definitions for role-based dashboard system
 */

import { UserType } from '@/types';

// Widget Configuration
export interface DashboardWidget {
  id: string;
  component: React.ComponentType<WidgetProps>;
  title: string;
  description: string;
  roles: UserType[];
  permissions: string[];
  size: 'small' | 'medium' | 'large' | 'full';
  position: { row: number; col: number };
  refreshInterval?: number;
  analytics: {
    userStory: string[];
    hypothesis: string[];
    metrics: string[];
  };
}

export interface WidgetProps {
  widget: DashboardWidget;
  data?: any;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onInteraction?: (action: string, metadata?: any) => void;
}

// Dashboard Data Types
export interface ProposalSummary {
  id: string;
  title: string;
  status: 'draft' | 'in-review' | 'approved' | 'submitted' | 'won' | 'lost';
  progress: number;
  deadline: Date;
  team: TeamMember[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  lastActivity: Date;
}

export interface ProposalActivity {
  id: string;
  proposalId: string;
  proposalTitle: string;
  action: string;
  user: string;
  timestamp: Date;
  type: 'created' | 'updated' | 'commented' | 'approved' | 'submitted';
}

export interface ProposalMetrics {
  total: number;
  active: number;
  completed: number;
  onTime: number;
  overdue: number;
  winRate: number;
  avgCompletionTime: number;
}

export interface ActivityFeedItem {
  id: string;
  type: 'proposal' | 'content' | 'team' | 'system';
  title: string;
  description: string;
  user: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
  link?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserType;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastActive: Date;
  currentProposals: number;
  expertise: string[];
}

export interface Deadline {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'proposal' | 'review' | 'submission' | 'meeting';
  assignedTo: string[];
  progress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
}

export interface PerformanceMetrics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  proposalsCompleted: number;
  avgCompletionTime: number;
  qualityScore: number;
  collaborationScore: number;
  efficiency: number;
  trends: {
    metric: string;
    value: number;
    change: number;
    direction: 'up' | 'down' | 'stable';
  }[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// Dashboard State Types
export interface DashboardState {
  layout: DashboardLayout;
  widgets: Record<string, WidgetState>;
  data: DashboardData;
  performance: PerformanceState;
  notifications: Notification[];
  settings: DashboardSettings;
}

export interface DashboardLayout {
  grid: GridPosition[];
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'auto';
  density: 'compact' | 'comfortable' | 'spacious';
}

export interface GridPosition {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetState {
  visible: boolean;
  minimized: boolean;
  lastRefresh: Date;
  refreshInterval: number;
  data?: any;
  loading: boolean;
  error?: string;
}

export interface DashboardData {
  proposals: {
    active: ProposalSummary[];
    recent: ProposalActivity[];
    metrics: ProposalMetrics;
  };
  activities: ActivityFeedItem[];
  team: TeamMember[];
  deadlines: Deadline[];
  performance: PerformanceMetrics;
  notifications: Notification[];
}

export interface PerformanceState {
  loadTime: number;
  lastUpdate: Date;
  apiResponseTimes: Record<string, number>;
  renderTimes: Record<string, number>;
  memoryUsage: number;
}

export interface DashboardSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  notifications: {
    desktop: boolean;
    email: boolean;
    types: string[];
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
  };
  privacy: {
    analytics: boolean;
    activityTracking: boolean;
  };
}

// Analytics Types
export interface DashboardAnalytics {
  widgetInteractions: WidgetUsage;
  navigationPatterns: UserFlow;
  performanceMetrics: PagePerformance;
  roleBasedUsage: RoleAnalytics;
  hypothesisValidation: HypothesisTracking;
}

export interface WidgetUsage {
  widgetId: string;
  interactions: number;
  timeSpent: number;
  refreshCount: number;
  errorCount: number;
  satisfactionScore?: number;
}

export interface UserFlow {
  path: string[];
  duration: number;
  bounceRate: number;
  completionRate: number;
  dropOffPoints: string[];
}

export interface PagePerformance {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
}

export interface RoleAnalytics {
  role: UserType;
  usage: {
    sessionsPerDay: number;
    avgSessionDuration: number;
    featuresUsed: string[];
    efficiencyScore: number;
  };
  preferences: {
    preferredWidgets: string[];
    layoutChanges: number;
    customizations: number;
  };
}

export interface HypothesisTracking {
  hypothesis: string;
  metrics: {
    baseline: number;
    current: number;
    target: number;
    improvement: number;
  };
  significance: number;
  sampleSize: number;
  testDuration: number;
}

// Component Traceability Matrix
export const DASHBOARD_COMPONENT_MAPPING = {
  userStories: ['US-2.2', 'US-4.1', 'US-7.1'],
  acceptanceCriteria: ['AC-2.2.1', 'AC-4.1.1', 'AC-7.1.1'],
  methods: ['renderDashboard()', 'updateWidget()', 'trackInteraction()'],
  hypotheses: ['H4', 'H7', 'H8'],
  testCases: ['TC-H4-003', 'TC-H7-001', 'TC-H8-002'],
};

// Widget Registry Types
export interface WidgetRegistry {
  [key: string]: DashboardWidget;
}

export type RoleWidgetMap = Record<UserType, string[]>;
