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

// ✅ MIGRATED: Use feature-based React Query hooks instead of useApiClient-based hooks
// Individual hook exports - now using feature-based hooks
export { useAdminPermissions } from '@/features/admin/hooks/usePermissions';
export { useAdminRoles } from '@/features/admin/hooks/useRoles';
export { useAdminSystemMetrics } from '@/features/admin/hooks/useSystemMetrics';
export { useAdminUsers, useAdminUser } from '@/features/admin/hooks/useUsers';

// ✅ ENHANCED: Advanced caching and performance optimization hooks
export { useAdminCache } from '@/features/admin/hooks/useAdminCache';
export { useAdminEnhanced } from '@/features/admin/hooks/useAdminEnhanced';

// Local imports for combined hook usage
import { useAdminPermissions as _usePermissions } from '@/features/admin/hooks/usePermissions';
import { useAdminRoles as _useRoles } from '@/features/admin/hooks/useRoles';
import { useAdminSystemMetrics as _useSystemMetrics } from '@/features/admin/hooks/useSystemMetrics';
import { useAdminUsers as _useUsers } from '@/features/admin/hooks/useUsers';

// ✅ MIGRATED: Type exports from feature-based schemas
export type {
  SystemMetrics,
  User as SystemUser, // Alias for backward compatibility
  Role as SystemRole, // Alias for backward compatibility
  Permission as SystemPermission, // Alias for backward compatibility
  User,
  UserCreate,
  UserUpdate,
  UsersListResponse,
  UsersQuery,
  Role,
  RoleCreate,
  RoleUpdate,
  RolesListResponse,
  RolesQuery,
  Permission,
  PermissionCreate,
  PermissionUpdate,
  PermissionsListResponse,
  PermissionsQuery,
} from '@/features/admin/schemas';

// ✅ MIGRATED: Combined hook for components needing multiple admin hooks
export function useAdminData() {
  // Use direct imports to comply with ESM and lint rules
  return {
    users: _useUsers({ page: '1', limit: '10' }), // Default pagination
    roles: _useRoles(),
    permissions: _usePermissions(),
    metrics: _useSystemMetrics(),
  };
}

// ✅ MIGRATED: Legacy exports for backward compatibility - now using feature-based hooks
export { useAdminPermissions as usePermissions } from '@/features/admin/hooks/usePermissions';
export { useAdminRoles as useRoles } from '@/features/admin/hooks/useRoles';
export { useAdminSystemMetrics as useSystemMetrics } from '@/features/admin/hooks/useSystemMetrics';
export { useAdminUsers as useUsers } from '@/features/admin/hooks/useUsers';
