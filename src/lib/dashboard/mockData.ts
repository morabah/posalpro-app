/**
 * Dashboard Mock Data
 * Comprehensive mock data for dashboard widgets with realistic scenarios
 */

import { UserType } from '@/types';
import {
  ActivityFeedItem,
  DashboardData,
  Deadline,
  Notification,
  PerformanceMetrics,
  ProposalActivity,
  ProposalMetrics,
  ProposalSummary,
  TeamMember,
} from './types';

// Mock Proposals
export const mockProposals: ProposalSummary[] = [
  {
    id: 'prop-001',
    title: 'Enterprise Cloud Migration Proposal',
    status: 'in-review',
    progress: 75,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    team: [
      {
        id: 'user-001',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        role: UserType.PROPOSAL_MANAGER,
        status: 'online',
        lastActive: new Date(),
        currentProposals: 3,
        expertise: ['Project Management', 'Cloud Architecture'],
      },
      {
        id: 'user-002',
        name: 'Dr. Michael Chen',
        email: 'michael.chen@company.com',
        role: UserType.SME,
        status: 'online',
        lastActive: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        currentProposals: 2,
        expertise: ['Cloud Security', 'Enterprise Architecture'],
      },
    ],
    priority: 'high',
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 'prop-002',
    title: 'Financial Services Compliance Solution',
    status: 'draft',
    progress: 35,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    team: [
      {
        id: 'user-003',
        name: 'Jennifer Martinez',
        email: 'jennifer.martinez@company.com',
        role: UserType.CONTENT_MANAGER,
        status: 'away',
        lastActive: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        currentProposals: 1,
        expertise: ['Compliance', 'Content Strategy'],
      },
    ],
    priority: 'medium',
    lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    id: 'prop-003',
    title: 'Healthcare Data Analytics Platform',
    status: 'approved',
    progress: 100,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    team: [
      {
        id: 'user-004',
        name: 'Robert Kim',
        email: 'robert.kim@company.com',
        role: UserType.SME,
        status: 'offline',
        lastActive: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        currentProposals: 4,
        expertise: ['Healthcare IT', 'Data Analytics'],
      },
    ],
    priority: 'critical',
    lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
  },
];

// Mock Activities
export const mockActivities: ProposalActivity[] = [
  {
    id: 'act-001',
    proposalId: 'prop-001',
    proposalTitle: 'Enterprise Cloud Migration Proposal',
    action: 'Updated technical specifications section',
    user: 'Dr. Michael Chen',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    type: 'updated',
  },
  {
    id: 'act-002',
    proposalId: 'prop-003',
    proposalTitle: 'Healthcare Data Analytics Platform',
    action: 'Approved final proposal draft',
    user: 'Executive Team',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    type: 'approved',
  },
  {
    id: 'act-003',
    proposalId: 'prop-002',
    proposalTitle: 'Financial Services Compliance Solution',
    action: 'Added compliance requirements documentation',
    user: 'Jennifer Martinez',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    type: 'updated',
  },
];

// Mock Proposal Metrics
export const mockProposalMetrics: ProposalMetrics = {
  total: 12,
  active: 8,
  completed: 4,
  onTime: 10,
  overdue: 2,
  winRate: 0.83,
  avgCompletionTime: 18.5, // days
};

// Mock Activity Feed
export const mockActivityFeed: ActivityFeedItem[] = [
  {
    id: 'feed-001',
    type: 'proposal',
    title: 'New proposal assignment',
    description: 'Healthcare Data Analytics Platform assigned to your team',
    user: 'Sarah Johnson',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    priority: 'high',
    actionRequired: true,
    link: '/proposals/prop-003',
  },
  {
    id: 'feed-002',
    type: 'team',
    title: 'Team member joined',
    description: 'Dr. Michael Chen joined the Cloud Migration project',
    user: 'System',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    priority: 'medium',
    actionRequired: false,
  },
  {
    id: 'feed-003',
    type: 'content',
    title: 'Content library updated',
    description: 'New compliance templates added to the library',
    user: 'Jennifer Martinez',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    priority: 'low',
    actionRequired: false,
    link: '/content/templates',
  },
  {
    id: 'feed-004',
    type: 'system',
    title: 'System maintenance',
    description: 'Scheduled maintenance completed successfully',
    user: 'System Administrator',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    priority: 'low',
    actionRequired: false,
  },
];

// Mock Team Members
export const mockTeamMembers: TeamMember[] = [
  {
    id: 'user-001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: UserType.PROPOSAL_MANAGER,
    status: 'online',
    lastActive: new Date(),
    currentProposals: 3,
    expertise: ['Project Management', 'Cloud Architecture', 'Team Leadership'],
  },
  {
    id: 'user-002',
    name: 'Dr. Michael Chen',
    email: 'michael.chen@company.com',
    role: UserType.SME,
    status: 'online',
    lastActive: new Date(Date.now() - 10 * 60 * 1000),
    currentProposals: 2,
    expertise: ['Cloud Security', 'Enterprise Architecture', 'HIPAA Compliance'],
  },
  {
    id: 'user-003',
    name: 'Jennifer Martinez',
    email: 'jennifer.martinez@company.com',
    role: UserType.CONTENT_MANAGER,
    status: 'away',
    lastActive: new Date(Date.now() - 30 * 60 * 1000),
    currentProposals: 1,
    expertise: ['Compliance', 'Content Strategy', 'Technical Writing'],
  },
  {
    id: 'user-004',
    name: 'Robert Kim',
    email: 'robert.kim@company.com',
    role: UserType.SME,
    status: 'offline',
    lastActive: new Date(Date.now() - 8 * 60 * 60 * 1000),
    currentProposals: 4,
    expertise: ['Healthcare IT', 'Data Analytics', 'Machine Learning'],
  },
  {
    id: 'user-005',
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    role: UserType.EXECUTIVE,
    status: 'online',
    lastActive: new Date(Date.now() - 5 * 60 * 1000),
    currentProposals: 0,
    expertise: ['Strategic Planning', 'Business Development', 'Client Relations'],
  },
];

// Mock Deadlines
export const mockDeadlines: Deadline[] = [
  {
    id: 'deadline-001',
    title: 'Healthcare Platform Proposal Submission',
    description: 'Final submission to client portal',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    priority: 'critical',
    type: 'submission',
    assignedTo: ['user-001', 'user-004'],
    progress: 90,
    status: 'in-progress',
  },
  {
    id: 'deadline-002',
    title: 'Cloud Migration Technical Review',
    description: 'Internal technical review meeting',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    priority: 'high',
    type: 'review',
    assignedTo: ['user-002'],
    progress: 60,
    status: 'in-progress',
  },
  {
    id: 'deadline-003',
    title: 'Compliance Documentation Update',
    description: 'Update financial services compliance templates',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    type: 'proposal',
    assignedTo: ['user-003'],
    progress: 25,
    status: 'pending',
  },
];

// Mock Performance Metrics
export const mockPerformanceMetrics: PerformanceMetrics = {
  userId: 'current-user',
  period: 'monthly',
  proposalsCompleted: 8,
  avgCompletionTime: 16.2,
  qualityScore: 4.7,
  collaborationScore: 4.9,
  efficiency: 0.87,
  trends: [
    {
      metric: 'Completion Rate',
      value: 87,
      change: 12,
      direction: 'up',
    },
    {
      metric: 'Quality Score',
      value: 4.7,
      change: 0.3,
      direction: 'up',
    },
    {
      metric: 'Response Time',
      value: 2.1,
      change: -0.5,
      direction: 'down',
    },
    {
      metric: 'Team Collaboration',
      value: 4.9,
      change: 0.1,
      direction: 'up',
    },
  ],
};

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    title: 'Proposal Review Required',
    message: 'Healthcare Data Analytics Platform is ready for your review',
    type: 'info',
    priority: 'high',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    actionUrl: '/proposals/prop-003/review',
    actionLabel: 'Review Now',
  },
  {
    id: 'notif-002',
    title: 'Deadline Approaching',
    message: 'Cloud Migration proposal due in 2 days',
    type: 'warning',
    priority: 'medium',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    actionUrl: '/proposals/prop-001',
    actionLabel: 'View Proposal',
  },
  {
    id: 'notif-003',
    title: 'Team Update',
    message: 'New SME assigned to your project',
    type: 'success',
    priority: 'low',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: true,
  },
];

// Role-specific mock data generators
export const getRoleSpecificMockData = (role: UserType): DashboardData => {
  const baseData: DashboardData = {
    proposals: {
      active: mockProposals.filter(p => p.status !== 'won' && p.status !== 'lost'),
      recent: mockActivities,
      metrics: mockProposalMetrics,
    },
    activities: mockActivityFeed,
    team: mockTeamMembers,
    deadlines: mockDeadlines,
    performance: mockPerformanceMetrics,
    notifications: mockNotifications,
  };

  // Customize data based on role
  switch (role) {
    case UserType.PROPOSAL_MANAGER:
      return {
        ...baseData,
        activities: mockActivityFeed.slice(0, 10), // More activities for managers
        deadlines: mockDeadlines.filter(d => d.type === 'proposal' || d.type === 'review'),
      };

    case UserType.SME:
      return {
        ...baseData,
        proposals: {
          ...baseData.proposals,
          active: mockProposals.filter(p => p.team.some(member => member.role === UserType.SME)),
        },
        activities: mockActivityFeed.filter(a => a.type === 'proposal'),
        deadlines: mockDeadlines.filter(d => d.type === 'review'),
      };

    case UserType.EXECUTIVE:
      return {
        ...baseData,
        proposals: {
          ...baseData.proposals,
          active: mockProposals.filter(p => p.priority === 'high' || p.priority === 'critical'),
        },
        activities: mockActivityFeed.filter(a => a.priority === 'high' || a.type === 'proposal'),
        deadlines: mockDeadlines.filter(d => d.priority === 'critical'),
      };

    case UserType.CONTENT_MANAGER:
      return {
        ...baseData,
        activities: mockActivityFeed.filter(a => a.type === 'content' || a.type === 'proposal'),
        deadlines: mockDeadlines.filter(d => d.type === 'proposal'),
      };

    case UserType.SYSTEM_ADMINISTRATOR:
      return {
        ...baseData,
        activities: mockActivityFeed, // All activities for admin
        team: mockTeamMembers, // All team members
        deadlines: mockDeadlines, // All deadlines
      };

    default:
      return baseData;
  }
};

// Performance mock data with random variations
export const generateRealtimeMockData = (): Partial<DashboardData> => {
  const now = new Date();

  return {
    proposals: {
      active: mockProposals.map(p => ({
        ...p,
        progress: Math.min(100, p.progress + Math.random() * 5), // Slight progress updates
        lastActivity: new Date(now.getTime() - Math.random() * 60 * 60 * 1000), // Random recent activity
      })),
      recent: [
        {
          id: `act-${Date.now()}`,
          proposalId: mockProposals[Math.floor(Math.random() * mockProposals.length)].id,
          proposalTitle: mockProposals[Math.floor(Math.random() * mockProposals.length)].title,
          action: 'Real-time update received',
          user: mockTeamMembers[Math.floor(Math.random() * mockTeamMembers.length)].name,
          timestamp: now,
          type: 'updated',
        },
        ...mockActivities.slice(0, 4),
      ],
      metrics: {
        ...mockProposalMetrics,
        active: mockProposalMetrics.active + Math.floor(Math.random() * 3 - 1), // ±1 variation
      },
    },
    team: mockTeamMembers.map(member => ({
      ...member,
      status: Math.random() > 0.7 ? 'online' : member.status, // Some members come online
      lastActive: Math.random() > 0.5 ? now : member.lastActive,
    })),
  };
};
