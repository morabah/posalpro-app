// Response Envelope (Migration Template)
// Prefer centralized helpers. Re-export to avoid duplication/drift.
export { ok, okPaginated, error as fail, error, type ApiResponse } from '@/lib/api/response';
