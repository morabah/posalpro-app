// Centralized React Query keys for the dashboard feature
// Aligns with CORE_REQUIREMENTS: single source of truth for query keys

import type { DashboardStatsQuery } from './schemas';

export type DashboardSection =
  | 'proposals'
  | 'activities'
  | 'team'
  | 'deadlines'
  | 'performance'
  | 'notifications';

export const dashboardQK = {
  all: ['dashboard'] as const,
  data: (options: unknown = {}) =>
    [...dashboardQK.all, 'data', options] as const,
  section: (section: DashboardSection, options: unknown = {}) =>
    [...dashboardQK.all, 'section', section, options] as const,
  notifications: (userId?: string) => [...dashboardQK.all, 'notifications', userId] as const,
} as const;

export type DashboardQueryKeyFactory = typeof dashboardQK;
