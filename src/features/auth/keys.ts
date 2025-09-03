/**
 * PosalPro MVP2 - Auth Query Keys
 * Centralized React Query keys for authentication-related queries
 * Follows assessment recommendations for consistency and maintainability
 */

export const qk = {
  auth: {
    all: ['auth'] as const,
    session: () => [...qk.auth.all, 'session'] as const,
    user: () => [...qk.auth.all, 'user'] as const,
    permissions: () => [...qk.auth.all, 'permissions'] as const,
    roles: () => [...qk.auth.all, 'roles'] as const,
  },
} as const;
