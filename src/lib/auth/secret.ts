// Centralized resolver for NextAuth JWT secret to prevent mismatches
// Single source of truth used across Node and Edge runtimes.

// Important rationale:
// - In Edge runtime (middleware), process.env is not available at runtime.
//   Next.js inlines env values referenced at module evaluation time.
// - If some bundles see NEXTAUTH_SECRET and others don't, tokens cannot be decoded.
// - We therefore compute a single module-level constant once and reuse it everywhere.

const DEV_FALLBACK_SECRET = 'posalpro-dev-fallback-secret-key-min-32-characters-123456';

// Compute once at module load; Next will inline during build so Edge sees same value.
const RESOLVED_SECRET: string = (() => {
  const raw = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || '';

  // In production, require a proper secret (32+ chars). Never fall back.
  if (process.env.NODE_ENV === 'production') {
    if (!raw || raw.trim().length < 32) {
      throw new Error(
        'NEXTAUTH_SECRET is missing or too short in production. Set a 32+ char secret.'
      );
    }
    return raw.trim();
  }

  // In development/test, use env if valid; otherwise use a stable fallback to avoid mismatches
  if (raw && raw.trim().length >= 32) return raw.trim();
  return DEV_FALLBACK_SECRET;
})();

export function getAuthSecret(): string {
  return RESOLVED_SECRET;
}

export const AUTH_DEBUG_ENABLED =
  process.env.AUTH_DEBUG === 'true' || process.env.NEXTAUTH_DEBUG === 'true';
