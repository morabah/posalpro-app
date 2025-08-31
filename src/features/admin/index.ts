/**
 * PosalPro MVP2 - Admin Feature Exports
 * Centralized exports for admin feature module
 * Based on CORE_REQUIREMENTS.md and ADMIN_MIGRATION_ASSESSMENT.md
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2, AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */

// Schema exports
export * from './schemas';

// Query key exports
export * from './keys';

// Hook exports (to be added in Phase 3)
export * from './hooks';

// Utility exports (to be added)
export * from './utils';

// Type re-exports for convenience
export type {
  User,
  UserCreate,
  UserUpdate,
  UsersQuery,
  Role,
  RoleCreate,
  RoleUpdate,
  RolesQuery,
  Permission,
  PermissionCreate,
  PermissionUpdate,
  PermissionsQuery,
  SystemMetrics,
  PaginationInfo,
  AuditLog,
  AuditLogsQuery,
  AuditLogsResponse,
  DatabaseStatus,
  DatabaseSyncRequest,
  UsersListResponse,
  RolesListResponse,
  PermissionsListResponse,
} from './schemas';
