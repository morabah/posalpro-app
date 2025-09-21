// Route Wrapper (Migration Template)
// Use centralized wrapper to ensure auth, validation, idempotency, logging, and ProblemDetails.
// Re-export to avoid duplication/drift.
export { createRoute } from '@/lib/api/route';
