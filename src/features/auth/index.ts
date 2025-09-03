/**
 * Auth Feature Module
 * User Story: US-1.1 (Login), US-1.2 (Registration), US-1.3 (Authentication)
 * Hypothesis: H1 (Authentication Experience)
 *
 * ✅ SINGLE FEATURE EXPORT FILE - Follows CORE_REQUIREMENTS.md standards
 * ✅ CENTRALIZED EXPORTS - All auth-related functionality in one place
 * ✅ CLEAN ARCHITECTURE - Separation of concerns with schemas, keys, and utilities
 */

// ====================
// Feature Keys
// ====================

export { qk as authKeys } from './keys';

// ====================
// Feature Schemas
// ====================

export type {
  LoginData,
  RegisterData,
  PasswordResetRequestData,
  PasswordResetConfirmData,
  EmailVerificationData,
} from './schemas';

export {
  LoginSchema,
  RegisterSchema,
  PasswordResetRequestSchema,
  PasswordResetConfirmSchema,
  EmailVerificationSchema,
  ROLE_REDIRECTION_MAP,
  getDefaultRedirect,
} from './schemas';

// ====================
// Feature Utilities
// ====================

// Auth utilities will be added here when implemented
