/**
 * PosalPro MVP2 - Admin Feature Utilities
 * Utility functions for admin feature operations
 * Based on CORE_REQUIREMENTS.md and ADMIN_MIGRATION_ASSESSMENT.md
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2, AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */

import type { User, Role, Permission, SystemMetrics, DatabaseStatus } from '../schemas';

/**
 * User status utilities
 */
export const userStatusUtils = {
  /**
   * Get user status color for UI display
   */
  getStatusColor: (status: User['status']): string => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-50';
      case 'INACTIVE':
        return 'text-gray-600 bg-gray-50';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50';
      case 'DELETED':
        return 'text-red-600 bg-red-50';
      case 'SUSPENDED':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  },

  /**
   * Get user status badge variant
   */
  getStatusBadgeVariant: (status: User['status']): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'DELETED':
      case 'SUSPENDED':
        return 'error';
      default:
        return 'default';
    }
  },

  /**
   * Check if user status allows login
   */
  canLogin: (status: User['status']): boolean => {
    return status === 'ACTIVE';
  },

  /**
   * Get status display label
   */
  getStatusLabel: (status: User['status']): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  },
} as const;

/**
 * Role utilities
 */
export const roleUtils = {
  /**
   * Get role access level color
   */
  getAccessLevelColor: (level: Role['level']): string => {
    if (level >= 9) return 'text-red-600';
    if (level >= 7) return 'text-orange-600';
    if (level >= 5) return 'text-blue-600';
    if (level >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  },

  /**
   * Get access level label
   */
  getAccessLevelLabel: (accessLevel: Role['accessLevel']): string => {
    return accessLevel;
  },

  /**
   * Check if role is system role
   */
  isSystemRole: (role: Role): boolean => {
    return role.isSystem === true;
  },

  /**
   * Get role hierarchy level
   */
  getHierarchyLevel: (role: Role): number => {
    return role.level;
  },

  /**
   * Sort roles by hierarchy level
   */
  sortByHierarchy: (roles: Role[]): Role[] => {
    return [...roles].sort((a, b) => b.level - a.level);
  },
} as const;

/**
 * Permission utilities
 */
export const permissionUtils = {
  /**
   * Get permission scope color
   */
  getScopeColor: (scope: Permission['scope']): string => {
    switch (scope) {
      case 'ALL':
        return 'text-red-600 bg-red-50';
      case 'TEAM':
        return 'text-blue-600 bg-blue-50';
      case 'OWN':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  },

  /**
   * Format permission string for display
   */
  formatPermission: (resource: string, action: string): string => {
    return `${resource}:${action}`;
  },

  /**
   * Parse permission string
   */
  parsePermission: (permission: string): { resource: string; action: string } => {
    const [resource, action] = permission.split(':');
    return { resource: resource || '', action: action || '' };
  },

  /**
   * Group permissions by resource
   */
  groupByResource: (permissions: Permission[]): Record<string, Permission[]> => {
    return permissions.reduce((groups, permission) => {
      const resource = permission.resource;
      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(permission);
      return groups;
    }, {} as Record<string, Permission[]>);
  },

  /**
   * Filter permissions by scope
   */
  filterByScope: (permissions: Permission[], scope: Permission['scope']): Permission[] => {
    return permissions.filter(permission => permission.scope === scope);
  },
} as const;

/**
 * System metrics utilities
 */
export const systemMetricsUtils = {
  /**
   * Get system health color
   */
  getHealthColor: (status: SystemMetrics['apiStatus'] | SystemMetrics['databaseStatus']): string => {
    const statusStr = status.toLowerCase();
    if (statusStr.includes('operational') || statusStr.includes('healthy')) {
      return 'text-green-600';
    }
    if (statusStr.includes('degraded') || statusStr.includes('warning')) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  },

  /**
   * Format storage size
   */
  formatStorageSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },

  /**
   * Calculate storage percentage
   */
  calculateStoragePercentage: (used: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  },

  /**
   * Get performance indicator color
   */
  getPerformanceColor: (responseTime: number): string => {
    if (responseTime < 200) return 'text-green-600';
    if (responseTime < 500) return 'text-yellow-600';
    return 'text-red-600';
  },

  /**
   * Format uptime duration
   */
  formatUptime: (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  },
} as const;

/**
 * Database utilities
 */
export const databaseUtils = {
  /**
   * Get database health color
   */
  getHealthColor: (status: DatabaseStatus['health']): string => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'offline':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  },

  /**
   * Format latency for display
   */
  formatLatency: (latency: number | null): string => {
    if (latency === null) return 'N/A';
    if (latency < 1000) return `${latency}ms`;
    return `${(latency / 1000).toFixed(1)}s`;
  },

  /**
   * Get connection type label
   */
  getConnectionTypeLabel: (type: DatabaseStatus['connectionType']): string => {
    switch (type) {
      case 'local':
        return 'Local';
      case 'cloud':
        return 'Cloud';
      case 'hybrid':
        return 'Hybrid';
      default:
        return 'Unknown';
    }
  },

  /**
   * Check if database is online
   */
  isOnline: (status: DatabaseStatus): boolean => {
    return status.isOnline && status.health !== 'offline';
  },
} as const;

/**
 * Search and filter utilities
 */
export const searchUtils = {
  /**
   * Filter users by search term
   */
  filterUsers: (users: User[], searchTerm: string): User[] => {
    if (!searchTerm.trim()) return users;

    const term = searchTerm.toLowerCase();
    return users.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.department.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term)
    );
  },

  /**
   * Filter roles by search term
   */
  filterRoles: (roles: Role[], searchTerm: string): Role[] => {
    if (!searchTerm.trim()) return roles;

    const term = searchTerm.toLowerCase();
    return roles.filter(role =>
      role.name.toLowerCase().includes(term) ||
      role.description.toLowerCase().includes(term)
    );
  },

  /**
   * Filter permissions by search term
   */
  filterPermissions: (permissions: Permission[], searchTerm: string): Permission[] => {
    if (!searchTerm.trim()) return permissions;

    const term = searchTerm.toLowerCase();
    return permissions.filter(permission =>
      permission.resource.toLowerCase().includes(term) ||
      permission.action.toLowerCase().includes(term) ||
      permission.displayName.toLowerCase().includes(term)
    );
  },
} as const;

/**
 * Validation utilities
 */
export const validationUtils = {
  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   */
  validatePassword: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate role name
   */
  isValidRoleName: (name: string): boolean => {
    return name.trim().length >= 2 && name.trim().length <= 50;
  },

  /**
   * Validate permission format
   */
  isValidPermission: (permission: string): boolean => {
    const parts = permission.split(':');
    return parts.length === 2 && parts[0].trim().length > 0 && parts[1].trim().length > 0;
  },
} as const;

// Export all utilities as a single object for convenience
export const adminUtils = {
  userStatus: userStatusUtils,
  role: roleUtils,
  permission: permissionUtils,
  systemMetrics: systemMetricsUtils,
  database: databaseUtils,
  search: searchUtils,
  validation: validationUtils,
} as const;
