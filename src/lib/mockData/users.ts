/**
 * Mock User Data
 * Comprehensive user profiles and activity data for development and testing
 */

import type { UserActivityLog, UserPermissions, UserProfile } from '@/lib/entities/user';
import { UserType } from '@/types/enums';

export const mockUsers: UserProfile[] = [
  {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@posalpro.com',
    phone: '+1 (555) 123-4567',
    jobTitle: 'Senior Proposal Manager',
    department: 'Business Development',
    role: UserType.PROPOSAL_MANAGER,
    profileCompleteness: 95,
    isActive: true,
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: 'user-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@posalpro.com',
    phone: '+1 (555) 234-5678',
    jobTitle: 'Content Specialist',
    department: 'Marketing',
    role: UserType.CONTENT_MANAGER,
    profileCompleteness: 88,
    isActive: true,
    emailVerified: true,
    phoneVerified: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: 'user-3',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.johnson@posalpro.com',
    phone: '+1 (555) 345-6789',
    jobTitle: 'Chief Technology Officer',
    department: 'Engineering',
    role: UserType.EXECUTIVE,
    profileCompleteness: 100,
    isActive: true,
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-03-14'),
  },
  {
    id: 'user-4',
    firstName: 'Bob',
    lastName: 'Wilson',
    email: 'bob.wilson@posalpro.com',
    phone: '+1 (555) 456-7890',
    jobTitle: 'Technical Subject Matter Expert',
    department: 'Engineering',
    role: UserType.SME,
    profileCompleteness: 82,
    isActive: true,
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-12'),
  },
  {
    id: 'user-5',
    firstName: 'Carol',
    lastName: 'Brown',
    email: 'carol.brown@posalpro.com',
    phone: '+1 (555) 567-8901',
    jobTitle: 'System Administrator',
    department: 'IT',
    role: UserType.SYSTEM_ADMINISTRATOR,
    profileCompleteness: 90,
    isActive: true,
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2024-03-13'),
  },
  {
    id: 'user-6',
    firstName: 'David',
    lastName: 'Davis',
    email: 'david.davis@posalpro.com',
    phone: '+1 (555) 678-9012',
    jobTitle: 'Project Manager',
    department: 'Operations',
    role: UserType.PROPOSAL_MANAGER,
    profileCompleteness: 75,
    isActive: false,
    emailVerified: true,
    phoneVerified: false,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-02-28'),
  },
  {
    id: 'user-7',
    firstName: 'Emma',
    lastName: 'Miller',
    email: 'emma.miller@posalpro.com',
    phone: '+1 (555) 789-0123',
    jobTitle: 'Business Analyst',
    department: 'Business Development',
    role: UserType.SME,
    profileCompleteness: 85,
    isActive: true,
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-11'),
  },
  {
    id: 'user-8',
    firstName: 'Frank',
    lastName: 'Garcia',
    email: 'frank.garcia@posalpro.com',
    phone: '+1 (555) 890-1234',
    jobTitle: 'Marketing Manager',
    department: 'Marketing',
    role: UserType.CONTENT_MANAGER,
    profileCompleteness: 92,
    isActive: true,
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-03-09'),
  },
];

export const mockUserPermissions: Record<string, UserPermissions> = {
  'user-1': {
    userId: 'user-1',
    permissions: ['read', 'write', 'approve', 'manage_team', 'create_proposal'],
    roles: [UserType.PROPOSAL_MANAGER],
    inheritedPermissions: ['read', 'write'],
    effectivePermissions: ['read', 'write', 'approve', 'manage_team', 'create_proposal'],
  },
  'user-2': {
    userId: 'user-2',
    permissions: ['read', 'write', 'manage_content'],
    roles: [UserType.CONTENT_MANAGER],
    inheritedPermissions: ['read'],
    effectivePermissions: ['read', 'write', 'manage_content'],
  },
  'user-3': {
    userId: 'user-3',
    permissions: ['read', 'write', 'approve', 'manage_team', 'admin', 'executive_review'],
    roles: [UserType.EXECUTIVE],
    inheritedPermissions: ['read', 'write'],
    effectivePermissions: ['read', 'write', 'approve', 'manage_team', 'admin', 'executive_review'],
  },
  'user-4': {
    userId: 'user-4',
    permissions: ['read', 'write', 'technical_review'],
    roles: [UserType.SME],
    inheritedPermissions: ['read'],
    effectivePermissions: ['read', 'write', 'technical_review'],
  },
  'user-5': {
    userId: 'user-5',
    permissions: ['read', 'write', 'admin', 'system_config', 'user_management'],
    roles: [UserType.SYSTEM_ADMINISTRATOR],
    inheritedPermissions: ['read', 'write'],
    effectivePermissions: ['read', 'write', 'admin', 'system_config', 'user_management'],
  },
};

export const mockUserActivityLogs: Record<string, UserActivityLog[]> = {
  'user-1': [
    {
      id: 'activity-1-1',
      userId: 'user-1',
      action: 'login',
      timestamp: new Date('2024-03-15T09:00:00Z'),
      details: {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      id: 'activity-1-2',
      userId: 'user-1',
      action: 'create_proposal',
      timestamp: new Date('2024-03-15T10:30:00Z'),
      details: { proposalId: 'proposal-1', title: 'Digital Transformation Initiative' },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      id: 'activity-1-3',
      userId: 'user-1',
      action: 'update_profile',
      timestamp: new Date('2024-03-15T14:15:00Z'),
      details: { fields: ['phone', 'jobTitle'] },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      id: 'activity-1-4',
      userId: 'user-1',
      action: 'view_dashboard',
      timestamp: new Date('2024-03-15T16:45:00Z'),
      details: { duration: 25 },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      id: 'activity-1-5',
      userId: 'user-1',
      action: 'logout',
      timestamp: new Date('2024-03-15T17:30:00Z'),
      details: { sessionDuration: 510 },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
  ],
  'user-2': [
    {
      id: 'activity-2-1',
      userId: 'user-2',
      action: 'login',
      timestamp: new Date('2024-03-14T08:30:00Z'),
      details: {
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    {
      id: 'activity-2-2',
      userId: 'user-2',
      action: 'manage_content',
      timestamp: new Date('2024-03-14T11:00:00Z'),
      details: { contentType: 'template', action: 'update' },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    {
      id: 'activity-2-3',
      userId: 'user-2',
      action: 'view_proposals',
      timestamp: new Date('2024-03-14T13:20:00Z'),
      details: { count: 5, filters: ['status:draft'] },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  ],
};

export const mockDepartments = [
  'Business Development',
  'Marketing',
  'Operations',
  'Engineering',
  'Sales',
  'Human Resources',
  'Finance',
  'Legal',
  'IT',
];

export const mockJobTitles = [
  'Senior Proposal Manager',
  'Proposal Manager',
  'Content Specialist',
  'Content Manager',
  'Project Manager',
  'Business Analyst',
  'Technical Writer',
  'Sales Manager',
  'Marketing Manager',
  'Operations Manager',
  'System Administrator',
  'Chief Technology Officer',
  'Chief Executive Officer',
  'Subject Matter Expert',
  'Technical Lead',
];

/**
 * Generate a random user profile for testing
 */
export const generateRandomUser = (overrides: Partial<UserProfile> = {}): UserProfile => {
  const firstNames = [
    'John',
    'Jane',
    'Alice',
    'Bob',
    'Carol',
    'David',
    'Emma',
    'Frank',
    'Grace',
    'Henry',
  ];
  const lastNames = [
    'Doe',
    'Smith',
    'Johnson',
    'Wilson',
    'Brown',
    'Davis',
    'Miller',
    'Garcia',
    'Martinez',
    'Anderson',
  ];
  const roles = Object.values(UserType);

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const role = roles[Math.floor(Math.random() * roles.length)];
  const department = mockDepartments[Math.floor(Math.random() * mockDepartments.length)];
  const jobTitle = mockJobTitles[Math.floor(Math.random() * mockJobTitles.length)];

  return {
    id: `user-${Math.random().toString(36).substring(2)}`,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@posalpro.com`,
    phone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    jobTitle,
    department,
    role,
    profileCompleteness: Math.floor(Math.random() * 40) + 60, // 60-100%
    isActive: Math.random() > 0.1, // 90% active
    emailVerified: Math.random() > 0.05, // 95% verified
    phoneVerified: Math.random() > 0.3, // 70% verified
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
    ...overrides,
  };
};

/**
 * Generate multiple random users
 */
export const generateRandomUsers = (count: number): UserProfile[] => {
  return Array.from({ length: count }, () => generateRandomUser());
};

/**
 * Get user by ID from mock data
 */
export const getMockUserById = (id: string): UserProfile | undefined => {
  return mockUsers.find(user => user.id === id);
};

/**
 * Get user by email from mock data
 */
export const getMockUserByEmail = (email: string): UserProfile | undefined => {
  return mockUsers.find(user => user.email === email);
};

/**
 * Get users by department from mock data
 */
export const getMockUsersByDepartment = (department: string): UserProfile[] => {
  return mockUsers.filter(user => user.department === department);
};

/**
 * Get users by role from mock data
 */
export const getMockUsersByRole = (role: UserType): UserProfile[] => {
  return mockUsers.filter(user => user.role === role);
};

/**
 * Get user permissions from mock data
 */
export const getMockUserPermissions = (userId: string): UserPermissions | undefined => {
  return mockUserPermissions[userId];
};

/**
 * Get user activity log from mock data
 */
export const getMockUserActivityLog = (userId: string): UserActivityLog[] => {
  return mockUserActivityLogs[userId] || [];
};
