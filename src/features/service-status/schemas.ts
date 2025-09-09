/**
 * PosalPro MVP2 - Service Status Feature Schemas
 * Centralized Zod schemas for service status monitoring
 * Based on CORE_REQUIREMENTS.md patterns
 *
 * Component Traceability Matrix:
 * - User Stories: US-8.1, US-8.2
 * - Acceptance Criteria: AC-8.1.1, AC-8.1.2
 * - Hypotheses: H8
 * - Test Cases: TC-H8-001
 */

import { z } from 'zod';

// Individual service status schema
export const ServiceStatusSchema = z.object({
  name: z.string(),
  status: z.enum(['online', 'offline', 'degraded', 'maintenance']),
  latency: z.number().nullable().optional(),
  uptime: z.number().nullable().optional(),
  version: z.string().optional(),
  lastChecked: z.string(),
  details: z.record(z.unknown()).optional(),
  error: z.string().optional(),
});

// Service status response schema
export const ServiceStatusResponseSchema = z.object({
  services: z.array(ServiceStatusSchema),
  overallStatus: z.enum(['healthy', 'degraded', 'critical', 'maintenance']),
  timestamp: z.string(),
  responseTime: z.number(),
});

// Service status query schema (for filtering)
export const ServiceStatusQuerySchema = z.object({
  includeDetails: z.boolean().optional().default(false),
  serviceTypes: z.array(z.string()).optional(),
  refresh: z.boolean().optional().default(false),
});

// Service status configuration schema
export const ServiceStatusConfigSchema = z.object({
  enabledServices: z.array(z.string()),
  checkInterval: z.number().min(5000).max(300000), // 5 seconds to 5 minutes
  timeout: z.number().min(1000).max(30000), // 1 second to 30 seconds
  retryAttempts: z.number().min(0).max(5),
  enableNotifications: z.boolean().optional().default(false),
});

// Type exports
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;
export type ServiceStatusResponse = z.infer<typeof ServiceStatusResponseSchema>;
export type ServiceStatusQuery = z.infer<typeof ServiceStatusQuerySchema>;
export type ServiceStatusConfig = z.infer<typeof ServiceStatusConfigSchema>;

