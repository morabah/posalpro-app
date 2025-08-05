/**
 * PosalPro MVP2 - Admin Data Types
 * Shared interfaces for admin data management hooks
 * Based on COMPONENT_STRUCTURE.md specifications
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2, AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */

// Interfaces for admin data
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'LOCKED' | 'SUSPENDED';
  lastActive: Date;
  createdAt: Date;
  permissions: string[];
}

export interface SystemRole {
  id: string;
  name: string;
  description: string;
  userCount: number;
  accessLevel: 'Full' | 'High' | 'Medium' | 'Limited' | 'Low';
  level: number;
  isSystem: boolean;
  permissions: Record<string, boolean>;
  permissionsList: string[];
  lastModified: Date;
  parent?: { id: string; name: string; level: number };
  children?: Array<{ id: string; name: string; level: number }>;
  performanceExpectations?: Record<string, number>;
  activeUsers: Array<{
    id: string;
    name: string;
    assignedAt: Date;
  }>;
}

export interface SystemPermission {
  id: string;
  resource: string;
  action: string;
  scope: 'ALL' | 'TEAM' | 'OWN';
  displayName: string;
  description: string;
  constraints?: Record<string, any>;
  roles: Array<{
    id: string;
    name: string;
    level: number;
    grantedAt: Date;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    grantedAt: Date;
    expiresAt?: Date;
    isActive: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemMetrics {
  apiStatus: string;
  databaseStatus: string;
  responseTime: number;
  uptime: number;
  storageUsed: number;
  storageTotal: number;
  storagePercentage: number;
  totalUsers: number;
  activeUsers: number;
  activeUserPercentage: number;
  totalProposals: number;
  totalProducts: number;
  totalContent: number;
  lastBackup: Date;
  lastSync: Date | null;
  recentAuditLogs: Array<{
    id: string;
    timestamp: Date;
    user: string;
    action: string;
    type: string;
    severity: string;
    details: string;
    ipAddress: string;
  }>;
  avgResponseTime: number;
  errorRate: number;
  throughput: number;
  timestamp: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Hook result interfaces
export interface UseUsersResult {
  users: SystemUser[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  refetch: () => void;
  createUser: (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    department: string;
  }) => Promise<{ id: string }>;
  updateUser: (
    id: string,
    userData: {
      name?: string;
      department?: string;
      status?: string;
    }
  ) => Promise<unknown>;
  deleteUser: (id: string) => Promise<unknown>;
}

export interface UseRolesResult {
  roles: SystemRole[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  refetch: () => void;
  createRole: (roleData: {
    name: string;
    description: string;
    level: number;
    parentId?: string;
    permissions: string[];
    performanceExpectations?: Record<string, number>;
  }) => Promise<{ id: string }>;
  updateRole: (
    id: string,
    roleData: {
      name?: string;
      description?: string;
      level?: number;
      parentId?: string;
      permissions?: string[];
      performanceExpectations?: Record<string, number>;
    }
  ) => Promise<unknown>;
  deleteRole: (id: string) => Promise<unknown>;
}

export interface UsePermissionsResult {
  permissions: SystemPermission[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  filters: {
    resources: string[];
    actions: string[];
    scopes: string[];
  };
  refetch: () => void;
  createPermission: (permissionData: {
    resource: string;
    action: string;
    scope?: 'ALL' | 'TEAM' | 'OWN';
    constraints?: Record<string, any>;
  }) => Promise<{ id: string }>;
  updatePermission: (
    id: string,
    permissionData: {
      resource?: string;
      action?: string;
      scope?: 'ALL' | 'TEAM' | 'OWN';
      constraints?: Record<string, any>;
    }
  ) => Promise<unknown>;
  deletePermission: (id: string) => Promise<unknown>;
}

export interface UseMetricsResult {
  metrics: SystemMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
