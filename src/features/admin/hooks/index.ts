/**
 * PosalPro MVP2 - Admin Feature Hooks Index
 * Centralized exports for all admin feature hooks
 * Based on CORE_REQUIREMENTS.md and ADMIN_MIGRATION_ASSESSMENT.md
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2, AC-8.2.1, AC-8.2.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */

// User management hooks
export * from './useUsers';

// System metrics hooks
export * from './useSystemMetrics';

// Role management hooks
export * from './useRoles';

// Permission management hooks
export * from './usePermissions';

// TODO: Add audit logs hooks
// export * from './useAuditLogs';

// Database operations hooks
export * from './useDatabaseOperations';

// Backward compatibility exports
export { useDatabaseSync as useAdminDatabaseSync } from './useDatabaseOperations';
export { useAdminDatabaseStatus as useAdminDatabaseConnectivity } from './useDatabaseOperations';
