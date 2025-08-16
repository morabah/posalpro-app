'use client';

// Re-export the canonical hook from the provider to ensure a single source of truth
export { useAuth } from '@/components/providers/AuthProvider';
export type { AuthContextState } from '@/components/providers/AuthProvider';
