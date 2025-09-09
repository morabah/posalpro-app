/**
 * PosalPro MVP2 - Service Status Feature Query Keys
 * Centralized React Query keys for service status monitoring
 * Based on CORE_REQUIREMENTS.md patterns
 */

export const qk = {
  serviceStatus: {
    all: ['serviceStatus'] as const,
    status: (params?: Record<string, unknown>) => ['serviceStatus', 'status', params] as const,
    config: () => ['serviceStatus', 'config'] as const,
    history: (serviceName?: string) => ['serviceStatus', 'history', serviceName] as const,
  },
} as const;

