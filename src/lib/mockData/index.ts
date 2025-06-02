/**
 * PosalPro MVP2 - Mock Data Infrastructure
 * Type-safe mock data generators for development and testing
 * Integrates with validation schemas from H2.2
 */

import type {
  CreateProposalData,
  CreateUserData,
  LoginFormData,
  ProposalMetadata,
  RegistrationFormData,
  UserProfile,
} from '@/lib/validation';
import { Priority, ProposalStatus, UserType } from '@/types';

/**
 * Generate mock user profile data
 */
export const generateMockUser = (overrides: Partial<UserProfile> = {}): UserProfile => {
  const baseUser: UserProfile = {
    id: `user-${Math.random().toString(36).substring(2)}`,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@posalpro.com',
    phone: '+1 (555) 123-4567',
    jobTitle: 'Senior Proposal Manager',
    department: 'Business Development',
    role: UserType.PROPOSAL_MANAGER,
    profileCompleteness: 85,
    isActive: true,
    emailVerified: true,
    phoneVerified: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-15'),
    ...overrides,
  };

  return baseUser;
};

/**
 * Generate mock user creation data
 */
export const generateMockCreateUser = (overrides: Partial<CreateUserData> = {}): CreateUserData => {
  return {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@posalpro.com',
    role: UserType.CONTENT_MANAGER,
    jobTitle: 'Content Specialist',
    department: 'Marketing',
    phone: '+1 (555) 987-6543',
    ...overrides,
  };
};

/**
 * Generate mock login form data
 */
export const generateMockLoginData = (overrides: Partial<LoginFormData> = {}): LoginFormData => {
  return {
    email: 'admin@posalpro.com',
    password: 'PosalPro2024!',
    role: UserType.SYSTEM_ADMINISTRATOR,
    rememberMe: false,
    ...overrides,
  };
};

/**
 * Generate mock registration form data
 */
export const generateMockRegistrationData = (
  overrides: Partial<RegistrationFormData> = {}
): RegistrationFormData => {
  return {
    // Step 1: User Information
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.johnson@posalpro.com',
    phone: '+1 (555) 456-7890',
    jobTitle: 'Project Manager',
    department: 'Operations',

    // Step 2: Role & Access
    role: UserType.PROPOSAL_MANAGER,
    accessJustification:
      'I need access to manage project timelines and coordinate with team members for proposal development.',

    // Step 3: Security Setup
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
    securityQuestion: 'What was the name of your first pet?',
    securityAnswer: 'Fluffy',

    // Step 4: Notification Preferences
    emailNotifications: {
      proposalUpdates: true,
      assignmentChanges: true,
      deadlineReminders: true,
      systemAnnouncements: false,
    },
    smsNotifications: {
      urgentAlerts: false,
      approvalRequests: false,
    },
    notificationFrequency: 'daily',
    termsAccepted: true,
    privacyPolicyAccepted: true,

    ...overrides,
  };
};

/**
 * Generate mock proposal metadata
 */
export const generateMockProposalMetadata = (
  overrides: Partial<ProposalMetadata> = {}
): ProposalMetadata => {
  return {
    title: 'Digital Transformation Initiative for ABC Corporation',
    description:
      'Comprehensive digital transformation proposal including cloud migration, process automation, and staff training programs.',
    clientName: 'ABC Corporation',
    clientContact: {
      name: 'Robert Wilson',
      email: 'robert.wilson@abccorp.com',
      phone: '+1 (555) 234-5678',
      jobTitle: 'CTO',
    },
    projectType: 'consulting',
    estimatedValue: 250000,
    currency: 'USD',
    deadline: new Date('2024-06-30'),
    priority: Priority.HIGH,
    tags: ['digital-transformation', 'cloud-migration', 'automation'],
    ...overrides,
  };
};

/**
 * Generate mock proposal creation data
 */
export const generateMockCreateProposal = (
  overrides: Partial<CreateProposalData> = {}
): CreateProposalData => {
  return {
    metadata: generateMockProposalMetadata(),
    teamAssignments: [
      {
        userId: 'user-1',
        userName: 'John Doe',
        role: 'lead',
        estimatedHours: 40,
        hourlyRate: 150,
        assignedAt: new Date(),
        assignedBy: 'user-manager',
        status: 'assigned',
      },
    ],
    ...overrides,
  };
};

/**
 * Mock data collections for lists and dropdowns
 */
export const mockDataCollections = {
  departments: [
    'Business Development',
    'Marketing',
    'Operations',
    'Engineering',
    'Sales',
    'Human Resources',
    'Finance',
    'Legal',
  ],

  jobTitles: [
    'Proposal Manager',
    'Content Specialist',
    'Project Manager',
    'Business Analyst',
    'Technical Writer',
    'Sales Manager',
    'Marketing Manager',
    'Operations Manager',
  ],

  projectTypes: [
    { value: 'consulting', label: 'Consulting Services' },
    { value: 'development', label: 'Software Development' },
    { value: 'design', label: 'Design Services' },
    { value: 'strategy', label: 'Strategic Planning' },
    { value: 'implementation', label: 'Implementation Services' },
    { value: 'maintenance', label: 'Maintenance & Support' },
  ],

  priorities: [
    { value: Priority.LOW, label: 'Low Priority' },
    { value: Priority.MEDIUM, label: 'Medium Priority' },
    { value: Priority.HIGH, label: 'High Priority' },
    { value: Priority.CRITICAL, label: 'Critical' },
  ],

  userRoles: [
    { value: UserType.SYSTEM_ADMINISTRATOR, label: 'System Administrator' },
    { value: UserType.PROPOSAL_MANAGER, label: 'Proposal Manager' },
    { value: UserType.CONTENT_MANAGER, label: 'Content Manager' },
    { value: UserType.SME, label: 'Subject Matter Expert' },
    { value: UserType.EXECUTIVE, label: 'Executive' },
  ],

  currencies: [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
  ],
};

/**
 * Generate multiple mock users for testing lists
 */
export const generateMockUserList = (count: number = 10): UserProfile[] => {
  const names = [
    { first: 'John', last: 'Doe' },
    { first: 'Jane', last: 'Smith' },
    { first: 'Alice', last: 'Johnson' },
    { first: 'Bob', last: 'Wilson' },
    { first: 'Carol', last: 'Brown' },
    { first: 'David', last: 'Davis' },
    { first: 'Emma', last: 'Miller' },
    { first: 'Frank', last: 'Garcia' },
    { first: 'Grace', last: 'Martinez' },
    { first: 'Henry', last: 'Anderson' },
  ];

  const roles = Object.values(UserType);
  const departments = mockDataCollections.departments;

  return Array.from({ length: count }, (_, index) => {
    const name = names[index % names.length];
    const role = roles[index % roles.length];
    const department = departments[index % departments.length];

    return generateMockUser({
      id: `user-${index + 1}`,
      firstName: name.first,
      lastName: name.last,
      email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}@posalpro.com`,
      role,
      department,
      profileCompleteness: Math.floor(Math.random() * 30) + 70, // 70-100%
    });
  });
};

/**
 * Generate mock proposal list for testing
 */
export const generateMockProposalList = (
  count: number = 5
): Array<ProposalMetadata & { id: string; status: ProposalStatus }> => {
  const clients = [
    'ABC Corporation',
    'XYZ Industries',
    'TechCorp Solutions',
    'Global Enterprises',
    'Innovation Partners',
  ];

  const titles = [
    'Digital Transformation Initiative',
    'Cloud Migration Project',
    'Process Automation Implementation',
    'Staff Training Program',
    'System Integration Services',
  ];

  const statuses = Object.values(ProposalStatus);

  return Array.from({ length: count }, (_, index) => {
    const client = clients[index % clients.length];
    const title = titles[index % titles.length];
    const status = statuses[index % statuses.length];

    return {
      id: `proposal-${index + 1}`,
      status,
      ...generateMockProposalMetadata({
        title: `${title} for ${client}`,
        clientName: client,
        estimatedValue: Math.floor(Math.random() * 500000) + 50000, // $50k - $550k
      }),
    };
  });
};

/**
 * Utility to create mock API responses
 */
export const createMockApiResponse = <T>(data: T, success: boolean = true) => ({
  success,
  data: success ? data : undefined,
  error: success ? undefined : 'Mock API error',
  message: success ? 'Success' : 'An error occurred',
  timestamp: new Date().toISOString(),
});

/**
 * Paginated mock data helper
 */
export const createMockPaginatedResponse = <T>(
  items: T[],
  page: number = 1,
  limit: number = 10
) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = items.slice(startIndex, endIndex);

  return createMockApiResponse({
    items: paginatedItems,
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
      hasNext: endIndex < items.length,
      hasPrev: page > 1,
    },
  });
};
