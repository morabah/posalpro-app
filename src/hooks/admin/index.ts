/**
 * PosalPro MVP2 - Admin Hooks Coordinator
 * Centralized exports for admin data management hooks
 * Based on COMPONENT_STRUCTURE.md specifications
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2, AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */

// Individual hook exports
export { usePermissions } from './usePermissions';
export { useRoles } from './useRoles';
export { useSystemMetrics } from './useSystemMetrics';
export { useUsers } from './useUsers';

// Local imports for combined hook usage
import { usePermissions as _usePermissions } from './usePermissions';
import { useRoles as _useRoles } from './useRoles';
import { useSystemMetrics as _useSystemMetrics } from './useSystemMetrics';
import { useUsers as _useUsers } from './useUsers';

// Type exports
export type {
  PaginationInfo,
  SystemMetrics,
  SystemPermission,
  SystemRole,
  SystemUser,
  UseMetricsResult,
  UsePermissionsResult,
  UseRolesResult,
  UseUsersResult,
} from './types';

// Optional: Combined hook for components needing multiple admin hooks
export function useAdminData() {
  // Use direct imports to comply with ESM and lint rules

  return {
    users: _useUsers(),
    roles: _useRoles(),
    permissions: _usePermissions(),
    metrics: _useSystemMetrics(),
  };
}

// Legacy export for backward compatibility
export { usePermissions as useAdminPermissions } from './usePermissions';
export { useRoles as useAdminRoles } from './useRoles';
export { useSystemMetrics as useAdminMetrics } from './useSystemMetrics';
export { useUsers as useAdminUsers } from './useUsers';
