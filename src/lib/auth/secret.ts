// Centralized resolver for NextAuth JWT secret to prevent mismatches
// Uses NEXTAUTH_SECRET primarily, falls back to JWT_SECRET, then to a safe default

const FALLBACK_SECRET = 'posalpro-mvp2-secret-key-for-jwt-signing-32-chars-minimum';

export function getAuthSecret(): string {
  const envSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  return (envSecret && envSecret.trim().length > 0 ? envSecret : FALLBACK_SECRET)!;
}

export const AUTH_DEBUG_ENABLED =
  process.env.AUTH_DEBUG === 'true' || process.env.NEXTAUTH_DEBUG === 'true';
