/**
 * PosalPro MVP2 - Admin Feature Schemas
 * Centralized Zod schemas for admin entities and operations
 * Based on CORE_REQUIREMENTS.md and ADMIN_MIGRATION_ASSESSMENT.md
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2, AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */

import { z } from 'zod';

// User Management Schemas
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  department: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'DELETED']),
  lastLogin: z.date().nullable(),
  createdAt: z.date(),
  permissions: z.array(z.string()),
});

export const UserCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().min(1, 'Department is required'),
});

export const UserUpdateSchema = z.object({
  name: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'DELETED']).optional(),
});

export const UsersQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(), // Can be any status string for filtering
  department: z.string().optional(),
});

// Role Management Schemas
export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  level: z.number().min(1).max(10),
  userCount: z.number(),
  accessLevel: z.enum(['Full', 'High', 'Medium', 'Limited', 'Low']),
  isSystem: z.boolean().optional(),
  permissions: z.array(z.string()),
  permissionsList: z.array(z.string()),
  lastModified: z.date(),
  parent: z.object({
    id: z.string(),
    name: z.string(),
    level: z.number(),
  }).optional(),
  children: z.array(z.object({
    id: z.string(),
    name: z.string(),
    level: z.number(),
  })).optional(),
  performanceExpectations: z.record(z.number()).optional(),
  activeUsers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    assignedAt: z.date(),
  })),
});

export const RoleCreateSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().min(1, 'Description is required'),
  level: z.number().min(1).max(10),
  parentId: z.string().optional(),
  permissions: z.array(z.string()),
  performanceExpectations: z.record(z.number()).optional(),
});

export const RoleUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  level: z.number().min(1).max(10).optional(),
  parentId: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  performanceExpectations: z.record(z.number()).optional(),
});

export const RolesQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  accessLevel: z.string().optional(),
});

// Permission Management Schemas
export const PermissionSchema = z.object({
  id: z.string(),
  resource: z.string(),
  action: z.string(),
  scope: z.enum(['ALL', 'TEAM', 'OWN']),
  displayName: z.string(),
  description: z.string(),
  constraints: z.record(z.unknown()).optional(),
  roles: z.array(z.object({
    id: z.string(),
    name: z.string(),
    level: z.number(),
    grantedAt: z.date(),
  })),
  users: z.array(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    grantedAt: z.date(),
    expiresAt: z.date().optional(),
    isActive: z.boolean(),
  })),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PermissionCreateSchema = z.object({
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
  scope: z.string().optional().default('ALL'),
  constraints: z.record(z.unknown()).optional(),
});

export const PermissionUpdateSchema = z.object({
  resource: z.string().optional(),
  action: z.string().optional(),
  scope: z.string().optional(),
  constraints: z.record(z.unknown()).optional(),
});

export const PermissionsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  scope: z.string().optional(),
});

// System Metrics Schemas
export const SystemMetricsSchema = z.object({
  apiStatus: z.string(),
  databaseStatus: z.string(),
  responseTime: z.number(),
  uptime: z.number(),
  storageUsed: z.number(),
  storageTotal: z.number(),
  storagePercentage: z.number(),
  totalUsers: z.number(),
  activeUsers: z.number(),
  activeUserPercentage: z.number(),
  totalProposals: z.number(),
  totalProducts: z.number(),
  totalContent: z.number(),
  lastBackup: z.date(),
  lastSync: z.date().nullable(),
  recentAuditLogs: z.array(z.object({
    id: z.string(),
    timestamp: z.date(),
    user: z.string(),
    action: z.string(),
    type: z.string(),
    severity: z.string(),
    details: z.string(),
    ipAddress: z.string(),
  })),
  avgResponseTime: z.number(),
  errorRate: z.number(),
  throughput: z.number(),
  timestamp: z.string(),
});

// Pagination and Response Schemas
export const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const UsersListResponseSchema = z.object({
  users: z.array(UserSchema),
  pagination: PaginationSchema,
  timestamp: z.string(),
});

export const RolesListResponseSchema = z.object({
  roles: z.array(RoleSchema),
  pagination: PaginationSchema,
  timestamp: z.string(),
});

export const PermissionsListResponseSchema = z.object({
  permissions: z.array(PermissionSchema),
  pagination: PaginationSchema,
  timestamp: z.string(),
});

// Audit Log Schemas
export const AuditLogSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  user: z.string(),
  action: z.string(),
  type: z.enum(['Security', 'Config', 'Data', 'Error', 'Backup']),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  details: z.string(),
  ipAddress: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export const AuditLogsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  type: z.string().optional(),
  severity: z.string().optional(),
  user: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const AuditLogsResponseSchema = z.object({
  logs: z.array(AuditLogSchema),
  pagination: PaginationSchema,
  timestamp: z.string(),
});

// Database Operation Schemas
export const DatabaseStatusSchema = z.object({
  isOnline: z.boolean(),
  latency: z.number().nullable(),
  lastChecked: z.date(),
  connectionType: z.enum(['local', 'cloud', 'hybrid']),
  health: z.enum(['healthy', 'degraded', 'offline']),
});

export const DatabaseSyncRequestSchema = z.object({
  direction: z.enum(['localToCloud', 'cloudToLocal', 'bidirectional']),
  includeConflictDetection: z.boolean().optional().default(true),
  generateReport: z.boolean().optional().default(true),
  tables: z.array(z.string()).optional(),
});

// Type exports for use in components and hooks
export type User = z.infer<typeof UserSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UsersQuery = z.infer<typeof UsersQuerySchema>;

export type Role = z.infer<typeof RoleSchema>;
export type RoleCreate = z.infer<typeof RoleCreateSchema>;
export type RoleUpdate = z.infer<typeof RoleUpdateSchema>;
export type RolesQuery = z.infer<typeof RolesQuerySchema>;

export type Permission = z.infer<typeof PermissionSchema>;
export type PermissionCreate = z.infer<typeof PermissionCreateSchema>;
export type PermissionUpdate = z.infer<typeof PermissionUpdateSchema>;
export type PermissionsQuery = z.infer<typeof PermissionsQuerySchema>;

export type SystemMetrics = z.infer<typeof SystemMetricsSchema>;
export type PaginationInfo = z.infer<typeof PaginationSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type AuditLogsQuery = z.infer<typeof AuditLogsQuerySchema>;
export type AuditLogsResponse = z.infer<typeof AuditLogsResponseSchema>;
export type DatabaseStatus = z.infer<typeof DatabaseStatusSchema>;
export type DatabaseSyncRequest = z.infer<typeof DatabaseSyncRequestSchema>;

// Response types
export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;
export type RolesListResponse = z.infer<typeof RolesListResponseSchema>;
export type PermissionsListResponse = z.infer<typeof PermissionsListResponseSchema>;
