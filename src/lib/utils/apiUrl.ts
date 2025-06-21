import { logger } from '@/utils/logger';/**
 * Dynamic API URL Resolution Utility
 * Resolves API URLs based on current environment and port
 * Prevents hardcoded port issues in development
 */

import { Environment, getCurrentEnvironment } from '../env';

/**
 * Get the current API base URL dynamically
 * Works in both server and client environments
 */
export function getApiBaseUrl(): string {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Client-side: use current window location
    return `${window.location.origin}/api`;
  }

  // Server-side: check environment
  const currentEnv = getCurrentEnvironment();

  if (currentEnv === Environment.PRODUCTION || currentEnv === Environment.STAGING) {
    // Production/staging: use explicit API_BASE_URL or fallback to relative
    return process.env.API_BASE_URL || '/api';
  }

  // Development: use current port or detect from Next.js
  const port = process.env.PORT || getNextJsPort() || '3000';
  return `http://localhost:${port}/api`;
}

/**
 * Get the current NextAuth URL dynamically
 * Used for NextAuth configuration in development
 */
export function getNextAuthUrl(): string {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Client-side: use current window location
    return window.location.origin;
  }

  // Server-side: check environment
  const currentEnv = getCurrentEnvironment();

  if (currentEnv === Environment.PRODUCTION || currentEnv === Environment.STAGING) {
    // Production/staging: use explicit NEXTAUTH_URL
    return process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }

  // Development: use current port
  const port = process.env.PORT || getNextJsPort() || '3000';
  return `http://localhost:${port}`;
}

/**
 * Attempt to detect the current Next.js port from environment
 * This is a best-effort detection for development
 */
function getNextJsPort(): string | null {
  // Check common Next.js port environment variables
  if (process.env.NEXT_PUBLIC_PORT) {
    return process.env.NEXT_PUBLIC_PORT;
  }

  // Try to detect from other sources
  if (process.env.HOST && process.env.HOST.includes(':')) {
    const match = process.env.HOST.match(/:(\d+)$/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Build a full API URL with dynamic base URL resolution
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();

  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Join base URL and endpoint
  return `${baseUrl}/${cleanEndpoint}`;
}

/**
 * Resolve API URL for different environments
 * Provides fallback strategies for reliability
 */
export function resolveApiUrl(endpoint: string): string {
  try {
    return buildApiUrl(endpoint);
  } catch (error) {
    logger.warn('Failed to build dynamic API URL, falling back to relative URL:', error);

    // Fallback to relative URL
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `/api${cleanEndpoint}`;
  }
}

/**
 * Check if API URL is accessible (client-side only)
 * Useful for development port validation
 */
export async function validateApiConnection(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return true; // Skip validation on server-side
  }

  try {
    const response = await fetch(buildApiUrl('health'), {
      method: 'HEAD',
      timeout: 5000,
    } as RequestInit & { timeout: number });

    return response.ok;
  } catch (error) {
    logger.warn('API connection validation failed:', error);
    return false;
  }
}

/**
 * Get environment-aware configuration for API client
 */
export function getApiClientConfig() {
  return {
    baseURL: getApiBaseUrl(),
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
    dynamic: true, // Flag to indicate dynamic URL resolution
  };
}

/**
 * Log current API configuration for debugging
 */
export function logApiConfiguration(): void {
  if (process.env.NODE_ENV === 'development') {
    logger.info('🔧 API Configuration:', {
      baseUrl: getApiBaseUrl(),
      nextAuthUrl: getNextAuthUrl(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT || 'auto-detected',
      timestamp: new Date().toISOString(),
    });
  }
}
