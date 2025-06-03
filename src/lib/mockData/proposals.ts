/**
 * Mock Proposal Data
 * Comprehensive proposal data with workflow and team information for development and testing
 */

import type {
  ProposalAnalytics,
  ProposalApproval,
  ProposalData,
  ProposalVersion,
  TeamAssignment,
} from '@/lib/entities/proposal';
import { ApprovalDecision, Priority, ProposalStatus } from '@/types/enums';

export const mockProposals: ProposalData[] = [
  {
    id: 'proposal-1',
    title: 'Digital Transformation Initiative for ABC Corporation',
    description:
      'Comprehensive digital transformation proposal including cloud migration, process automation, and staff training programs.',
    clientName: 'ABC Corporation',
    clientContact: {
      name: 'Robert Wilson',
      email: 'robert.wilson@abccorp.com',
      phone: '+1 (555) 234-5678',
      jobTitle: 'Chief Technology Officer',
    },
    projectType: 'consulting',
    estimatedValue: 750000,
    currency: 'USD',
    deadline: new Date('2024-08-30'),
    priority: Priority.HIGH,
    tags: ['digital-transformation', 'cloud-migration', 'automation'],
    status: ProposalStatus.IN_REVIEW,
    createdBy: 'user-1',
    assignedTo: ['user-1', 'user-2', 'user-4'],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-15'),
    submittedAt: new Date('2024-03-10'),
    version: 2,
  },
  {
    id: 'proposal-2',
    title: 'E-commerce Platform Development',
    description:
      'Custom e-commerce platform with advanced analytics, inventory management, and customer portal.',
    clientName: 'TechCorp Solutions',
    clientContact: {
      name: 'Sarah Martinez',
      email: 'sarah.martinez@techcorp.com',
      phone: '+1 (555) 345-6789',
      jobTitle: 'Product Manager',
    },
    projectType: 'development',
    estimatedValue: 450000,
    currency: 'USD',
    deadline: new Date('2024-07-15'),
    priority: Priority.CRITICAL,
    tags: ['e-commerce', 'web-development', 'analytics'],
    status: ProposalStatus.APPROVED,
    createdBy: 'user-1',
    assignedTo: ['user-1', 'user-4', 'user-7'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-03-12'),
    submittedAt: new Date('2024-02-28'),
    approvedAt: new Date('2024-03-12'),
    version: 3,
  },
  {
    id: 'proposal-3',
    title: 'Brand Identity and Marketing Strategy',
    description:
      'Complete brand overhaul including logo design, marketing materials, and digital marketing strategy.',
    clientName: 'Innovation Partners',
    clientContact: {
      name: 'Michael Chen',
      email: 'michael.chen@innovationpartners.com',
      phone: '+1 (555) 456-7890',
      jobTitle: 'Marketing Director',
    },
    projectType: 'design',
    estimatedValue: 125000,
    currency: 'USD',
    deadline: new Date('2024-06-30'),
    priority: Priority.MEDIUM,
    tags: ['branding', 'design', 'marketing'],
    status: ProposalStatus.DRAFT,
    createdBy: 'user-2',
    assignedTo: ['user-2', 'user-8'],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-14'),
    version: 1,
  },
  {
    id: 'proposal-4',
    title: 'Enterprise Resource Planning Implementation',
    description:
      'Full ERP system implementation with data migration, customization, and staff training.',
    clientName: 'Global Enterprises',
    clientContact: {
      name: 'Jennifer Adams',
      email: 'jennifer.adams@globalent.com',
      phone: '+1 (555) 567-8901',
      jobTitle: 'Operations Manager',
    },
    projectType: 'implementation',
    estimatedValue: 950000,
    currency: 'USD',
    deadline: new Date('2024-12-31'),
    priority: Priority.HIGH,
    tags: ['erp', 'implementation', 'data-migration'],
    status: ProposalStatus.PENDING_APPROVAL,
    createdBy: 'user-1',
    assignedTo: ['user-1', 'user-3', 'user-4', 'user-7'],
    createdAt: new Date('2024-02-28'),
    updatedAt: new Date('2024-03-13'),
    submittedAt: new Date('2024-03-13'),
    version: 1,
  },
  {
    id: 'proposal-5',
    title: 'IT Infrastructure Maintenance Contract',
    description: '24/7 IT support and maintenance services for critical business systems.',
    clientName: 'XYZ Industries',
    clientContact: {
      name: 'David Thompson',
      email: 'david.thompson@xyzind.com',
      phone: '+1 (555) 678-9012',
      jobTitle: 'IT Manager',
    },
    projectType: 'maintenance',
    estimatedValue: 180000,
    currency: 'USD',
    deadline: new Date('2024-05-15'),
    priority: Priority.LOW,
    tags: ['maintenance', 'support', 'infrastructure'],
    status: ProposalStatus.REJECTED,
    createdBy: 'user-4',
    assignedTo: ['user-4', 'user-5'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-02-20'),
    submittedAt: new Date('2024-02-15'),
    version: 1,
  },
];

export const mockTeamAssignments: Record<string, TeamAssignment[]> = {
  'proposal-1': [
    {
      id: 'assignment-1-1',
      proposalId: 'proposal-1',
      userId: 'user-1',
      userName: 'John Doe',
      role: 'lead',
      estimatedHours: 120,
      hourlyRate: 175,
      assignedAt: new Date('2024-02-15'),
      assignedBy: 'user-3',
      status: 'accepted',
      notes: 'Lead proposal manager for digital transformation project',
    },
    {
      id: 'assignment-1-2',
      proposalId: 'proposal-1',
      userId: 'user-2',
      userName: 'Jane Smith',
      role: 'contributor',
      estimatedHours: 80,
      hourlyRate: 125,
      assignedAt: new Date('2024-02-16'),
      assignedBy: 'user-1',
      status: 'accepted',
      notes: 'Content development and documentation',
    },
    {
      id: 'assignment-1-3',
      proposalId: 'proposal-1',
      userId: 'user-4',
      userName: 'Bob Wilson',
      role: 'reviewer',
      estimatedHours: 40,
      hourlyRate: 150,
      assignedAt: new Date('2024-02-17'),
      assignedBy: 'user-1',
      status: 'assigned',
      notes: 'Technical review and validation',
    },
  ],
  'proposal-2': [
    {
      id: 'assignment-2-1',
      proposalId: 'proposal-2',
      userId: 'user-1',
      userName: 'John Doe',
      role: 'lead',
      estimatedHours: 100,
      hourlyRate: 175,
      assignedAt: new Date('2024-01-20'),
      assignedBy: 'user-3',
      status: 'completed',
    },
    {
      id: 'assignment-2-2',
      proposalId: 'proposal-2',
      userId: 'user-4',
      userName: 'Bob Wilson',
      role: 'contributor',
      estimatedHours: 60,
      hourlyRate: 150,
      assignedAt: new Date('2024-01-21'),
      assignedBy: 'user-1',
      status: 'completed',
    },
  ],
};

export const mockProposalApprovals: Record<string, ProposalApproval[]> = {
  'proposal-1': [
    {
      id: 'approval-1-1',
      proposalId: 'proposal-1',
      approverId: 'user-3',
      approverName: 'Alice Johnson',
      decision: ApprovalDecision.APPROVED,
      comments: 'Technical approach looks solid. Approved for executive review.',
      decidedAt: new Date('2024-03-11'),
      level: 1,
      required: true,
    },
    {
      id: 'approval-1-2',
      proposalId: 'proposal-1',
      approverId: 'user-5',
      approverName: 'Carol Brown',
      decision: ApprovalDecision.PENDING,
      level: 2,
      required: true,
    },
  ],
  'proposal-2': [
    {
      id: 'approval-2-1',
      proposalId: 'proposal-2',
      approverId: 'user-3',
      approverName: 'Alice Johnson',
      decision: ApprovalDecision.APPROVED,
      comments: 'Excellent technical proposal with clear deliverables.',
      decidedAt: new Date('2024-03-01'),
      level: 1,
      required: true,
    },
    {
      id: 'approval-2-2',
      proposalId: 'proposal-2',
      approverId: 'user-5',
      approverName: 'Carol Brown',
      decision: ApprovalDecision.APPROVED,
      comments: 'Budget and timeline are reasonable. Final approval granted.',
      decidedAt: new Date('2024-03-12'),
      level: 2,
      required: true,
    },
  ],
  'proposal-4': [
    {
      id: 'approval-4-1',
      proposalId: 'proposal-4',
      approverId: 'user-3',
      approverName: 'Alice Johnson',
      decision: ApprovalDecision.PENDING,
      level: 1,
      required: true,
    },
  ],
  'proposal-5': [
    {
      id: 'approval-5-1',
      proposalId: 'proposal-5',
      approverId: 'user-3',
      approverName: 'Alice Johnson',
      decision: ApprovalDecision.REJECTED,
      comments: 'Pricing is not competitive. Recommend revising the cost structure.',
      decidedAt: new Date('2024-02-20'),
      level: 1,
      required: true,
    },
  ],
};

export const mockProposalVersions: Record<string, ProposalVersion[]> = {
  'proposal-1': [
    {
      id: 'version-1-1',
      proposalId: 'proposal-1',
      version: 1,
      title: 'Initial Version',
      changesSummary: 'Initial proposal creation with basic scope and timeline',
      createdBy: 'user-1',
      createdAt: new Date('2024-02-15'),
      metadata: {
        title: 'Digital Transformation Initiative for ABC Corporation',
        estimatedValue: 650000,
        deadline: new Date('2024-07-30'),
      },
    },
    {
      id: 'version-1-2',
      proposalId: 'proposal-1',
      version: 2,
      title: 'Scope Expansion',
      changesSummary: 'Added cloud migration services and extended timeline',
      createdBy: 'user-1',
      createdAt: new Date('2024-03-05'),
      metadata: {
        estimatedValue: 750000,
        deadline: new Date('2024-08-30'),
        tags: ['digital-transformation', 'cloud-migration', 'automation'],
      },
    },
  ],
  'proposal-2': [
    {
      id: 'version-2-1',
      proposalId: 'proposal-2',
      version: 1,
      title: 'Initial Version',
      changesSummary: 'Initial e-commerce platform proposal',
      createdBy: 'user-1',
      createdAt: new Date('2024-01-20'),
      metadata: {
        title: 'E-commerce Platform Development',
        estimatedValue: 400000,
      },
    },
    {
      id: 'version-2-2',
      proposalId: 'proposal-2',
      version: 2,
      title: 'Feature Enhancement',
      changesSummary: 'Added advanced analytics and reporting features',
      createdBy: 'user-1',
      createdAt: new Date('2024-02-10'),
      metadata: {
        estimatedValue: 425000,
        tags: ['e-commerce', 'web-development', 'analytics'],
      },
    },
    {
      id: 'version-2-3',
      proposalId: 'proposal-2',
      version: 3,
      title: 'Final Revision',
      changesSummary: 'Updated pricing and delivery timeline based on client feedback',
      createdBy: 'user-1',
      createdAt: new Date('2024-02-25'),
      metadata: {
        estimatedValue: 450000,
        deadline: new Date('2024-07-15'),
      },
    },
  ],
};

export const mockProposalAnalytics: Record<string, ProposalAnalytics> = {
  'proposal-1': {
    proposalId: 'proposal-1',
    viewCount: 47,
    editCount: 12,
    collaboratorCount: 3,
    averageTimeToComplete: 18, // days
    successRate: 85,
    lastActivity: new Date('2024-03-15'),
  },
  'proposal-2': {
    proposalId: 'proposal-2',
    viewCount: 62,
    editCount: 18,
    collaboratorCount: 3,
    averageTimeToComplete: 39, // days
    successRate: 95,
    lastActivity: new Date('2024-03-12'),
  },
  'proposal-3': {
    proposalId: 'proposal-3',
    viewCount: 23,
    editCount: 7,
    collaboratorCount: 2,
    averageTimeToComplete: 14, // days
    successRate: 70,
    lastActivity: new Date('2024-03-14'),
  },
  'proposal-4': {
    proposalId: 'proposal-4',
    viewCount: 35,
    editCount: 9,
    collaboratorCount: 4,
    averageTimeToComplete: 15, // days
    successRate: 80,
    lastActivity: new Date('2024-03-13'),
  },
  'proposal-5': {
    proposalId: 'proposal-5',
    viewCount: 28,
    editCount: 5,
    collaboratorCount: 2,
    averageTimeToComplete: 36, // days
    successRate: 45,
    lastActivity: new Date('2024-02-20'),
  },
};

export const mockClients = [
  'ABC Corporation',
  'TechCorp Solutions',
  'Innovation Partners',
  'Global Enterprises',
  'XYZ Industries',
  'Digital Dynamics',
  'Future Systems Inc',
  'Quantum Technologies',
  'NextGen Solutions',
  'Apex Consulting',
];

export const mockProjectTypes = [
  { value: 'consulting', label: 'Consulting Services' },
  { value: 'development', label: 'Software Development' },
  { value: 'design', label: 'Design Services' },
  { value: 'strategy', label: 'Strategic Planning' },
  { value: 'implementation', label: 'Implementation Services' },
  { value: 'maintenance', label: 'Maintenance & Support' },
];

/**
 * Generate a random proposal for testing
 */
export const generateRandomProposal = (overrides: Partial<ProposalData> = {}): ProposalData => {
  const titles = [
    'Digital Transformation Initiative',
    'Cloud Migration Project',
    'E-commerce Platform Development',
    'Mobile App Development',
    'Data Analytics Implementation',
    'CRM System Integration',
    'Cybersecurity Assessment',
    'Process Automation',
    'Staff Training Program',
    'Brand Identity Redesign',
  ];

  const descriptions = [
    'Comprehensive solution to modernize business operations and improve efficiency.',
    'Strategic implementation of cutting-edge technology to drive business growth.',
    'Custom development project tailored to specific business requirements.',
    'End-to-end solution including planning, development, and deployment.',
    'Professional services to optimize business processes and workflows.',
  ];

  const statuses = Object.values(ProposalStatus);
  const priorities = Object.values(Priority);
  const projectTypes = [
    'consulting',
    'development',
    'design',
    'strategy',
    'implementation',
    'maintenance',
  ];

  const title = titles[Math.floor(Math.random() * titles.length)];
  const client = mockClients[Math.floor(Math.random() * mockClients.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const priority = priorities[Math.floor(Math.random() * priorities.length)];
  const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)] as any;

  return {
    id: `proposal-${Math.random().toString(36).substring(2)}`,
    title: `${title} for ${client}`,
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    clientName: client,
    clientContact: {
      name: 'John Smith',
      email: 'john.smith@client.com',
      phone: '+1 (555) 123-4567',
      jobTitle: 'Project Manager',
    },
    projectType,
    estimatedValue: Math.floor(Math.random() * 900000) + 100000, // $100k - $1M
    currency: 'USD',
    deadline: new Date(Date.now() + (Math.random() * 180 + 30) * 24 * 60 * 60 * 1000), // 30-210 days
    priority,
    tags: ['project', 'development'],
    status,
    createdBy: 'user-1',
    assignedTo: ['user-1'],
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Last 60 days
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
    version: Math.floor(Math.random() * 3) + 1,
    ...overrides,
  };
};

/**
 * Generate multiple random proposals
 */
export const generateRandomProposals = (count: number): ProposalData[] => {
  return Array.from({ length: count }, () => generateRandomProposal());
};

/**
 * Get proposal by ID from mock data
 */
export const getMockProposalById = (id: string): ProposalData | undefined => {
  return mockProposals.find(proposal => proposal.id === id);
};

/**
 * Get proposals by status from mock data
 */
export const getMockProposalsByStatus = (status: ProposalStatus): ProposalData[] => {
  return mockProposals.filter(proposal => proposal.status === status);
};

/**
 * Get proposals by priority from mock data
 */
export const getMockProposalsByPriority = (priority: Priority): ProposalData[] => {
  return mockProposals.filter(proposal => proposal.priority === priority);
};

/**
 * Get team assignments for proposal from mock data
 */
export const getMockTeamAssignments = (proposalId: string): TeamAssignment[] => {
  return mockTeamAssignments[proposalId] || [];
};

/**
 * Get approvals for proposal from mock data
 */
export const getMockProposalApprovals = (proposalId: string): ProposalApproval[] => {
  return mockProposalApprovals[proposalId] || [];
};

/**
 * Get version history for proposal from mock data
 */
export const getMockProposalVersions = (proposalId: string): ProposalVersion[] => {
  return mockProposalVersions[proposalId] || [];
};

/**
 * Get analytics for proposal from mock data
 */
export const getMockProposalAnalytics = (proposalId: string): ProposalAnalytics | undefined => {
  return mockProposalAnalytics[proposalId];
};
