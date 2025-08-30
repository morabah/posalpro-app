# Dashboard Bridge Artifacts Archive (2025-08-30)

This archive records dashboard bridge-era components that have been deprecated
and removed as part of the migration to the modern feature-based architecture
per CORE_REQUIREMENTS.md and DASHBOARD_MIGRATION_ASSESSMENT.md.

Archived components

- src/components/dashboard/BridgeEnhancedDashboard.tsx
- src/components/dashboard/RecentProposals.tsx
- src/components/dashboard/client/RecentProposalsClient.tsx

Rationale

- Server state moved to React Query hooks (useDashboardData, feature keys)
- UI state persists in Zustand (useDashboardUIStore)
- API routes standardized via createRoute with validation, RBAC and headers
- Dashboard schemas centralized under src/features/dashboard/schemas.ts and
  exposed via OpenAPI

Replacement equivalents

- Enhanced analytics: src/components/dashboard/EnhancedDashboard.tsx
- Recent proposals: src/components/proposals/UnifiedProposalList.tsx
- Analytics charts: src/components/dashboard/UnifiedDashboardStats.tsx

Notes

- References to bridge patterns remain in historical documentation for context
  but are superseded by the components above.
