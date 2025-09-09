/**
 * PosalPro MVP2 - Security Utilities
 * CSRF protection, rate limiting, and input validation
 * Updated to use Redis storage for scalability
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import validator from 'validator';
import { CSRFStorage, RateLimitStorage, SecurityStorageFactory } from './security/storage';

// Control characters regex using Unicode property class to satisfy no-control-regex
const CONTROL_CHARS_REGEX = new RegExp('\\p{Cc}', 'gu');

// CSRF Token Management with Redis Storage
class CSRFProtection {
  private static storage: CSRFStorage = SecurityStorageFactory.createCSRFStorage();

  static async generateToken(sessionId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour

    await this.storage.setToken(sessionId, token, expires);
    return token;
  }

  static async validateToken(sessionId: string, token: string): Promise<boolean> {
    return await this.storage.validateToken(sessionId, token);
  }

  static async cleanupExpired(): Promise<void> {
    await this.storage.cleanupExpired();
  }
}

// Rate Limiting with Redis Storage
class RateLimiter {
  private static storage: RateLimitStorage = SecurityStorageFactory.createRateLimitStorage();

  static async isLimited(
    identifier: string,
    maxAttempts: number,
    windowMs: number
  ): Promise<boolean> {
    const now = Date.now();
    const record = await this.storage.getAttempts(identifier);

    if (!record) {
      await this.storage.setAttempts(identifier, 1, now + windowMs);
      return false;
    }

    if (now > record.resetTime) {
      await this.storage.setAttempts(identifier, 1, now + windowMs);
      return false;
    }

    if (record.count < maxAttempts) {
      await this.storage.incrementAttempts(identifier);
      return false;
    }

    return true;
  }

  static async getRemainingAttempts(identifier: string, maxAttempts: number): Promise<number> {
    const record = await this.storage.getAttempts(identifier);
    if (!record) {
      return maxAttempts;
    }
    return Math.max(0, maxAttempts - record.count);
  }

  static async getResetSecondsRemaining(identifier: string, windowMs: number): Promise<number> {
    const record = await this.storage.getAttempts(identifier);
    if (!record) {
      return Math.ceil(windowMs / 1000);
    }
    const seconds = Math.ceil((record.resetTime - Date.now()) / 1000);
    return Math.max(0, seconds);
  }

  static async cleanup(): Promise<void> {
    await this.storage.cleanup();
  }
}

// Input Validation & Sanitization
export class InputValidator {
  static sanitizeEmail(email: string): string {
    return validator.normalizeEmail(email) || '';
  }

  static sanitizeString(input: string, maxLength: number = 255): string {
    if (typeof input !== 'string') return '';

    // Remove null bytes and control characters
    let sanitized = input.replace(CONTROL_CHARS_REGEX, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  static sanitizeHtml(input: string): string {
    // Basic HTML entity encoding
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  static validatePassword(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password',
      'password123',
      '123456',
      'admin',
      'qwerty',
      'letmein',
      'welcome',
      'monkey',
      'dragon',
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static validateEmail(email: string): boolean {
    return validator.isEmail(email) && email.length <= 254;
  }

  static validatePhoneNumber(phone: string): boolean {
    // Basic international phone number validation
    return (
      validator.isMobilePhone(phone, 'any') || validator.isNumeric(phone.replace(/[\s\-()+]/g, ''))
    );
  }
}

// Security Headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com 'report-sample'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https://api.posalpro.com https://cdnjs.cloudflare.com https://unpkg.com; worker-src 'self' blob: https://cdnjs.cloudflare.com https://unpkg.com; frame-ancestors 'none'; report-uri /api/security/csp-report",
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    // Cross-Origin Policies (server utility; prefer same-origin isolation)
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
    // DNS Prefetch Control
    'X-DNS-Prefetch-Control': 'off',
  };
}

// Request Analysis
export function analyzeRequest(request: NextRequest): {
  ip: string;
  userAgent: string;
  sessionId: string;
  suspicious: boolean;
  reasons: string[];
} {
  const ip =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const sessionId = request.cookies.get('next-auth.session-token')?.value || crypto.randomUUID();

  const reasons: string[] = [];

  // Check for suspicious patterns
  if (userAgent === 'unknown' || userAgent.length < 10) {
    reasons.push('Missing or suspicious user agent');
  }

  if (ip === 'unknown') {
    reasons.push('Unknown IP address');
  }

  // Check for common bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /php/i,
  ];

  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    reasons.push('Bot-like user agent');
  }

  return {
    ip,
    userAgent,
    sessionId,
    suspicious: reasons.length > 0,
    reasons,
  };
}

// Export instances
export const csrf = CSRFProtection;
export const rateLimiter = RateLimiter;

// Auto-cleanup (run periodically) - Note: Redis handles TTL automatically
setInterval(
  async () => {
    // Redis automatically handles cleanup via TTL
    // This interval is kept for compatibility but does minimal work
    const { logInfo } = await import('@/lib/logger');
    await logInfo('Security cleanup: Redis TTL handles expiration automatically');
  },
  5 * 60 * 1000
); // Every 5 minutes
