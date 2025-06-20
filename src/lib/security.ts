/**
 * PosalPro MVP2 - Security Utilities
 * CSRF protection, rate limiting, and input validation
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import validator from 'validator';

// CSRF Token Management
class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>();

  static generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour

    this.tokens.set(sessionId, { token, expires });
    return token;
  }

  static validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);
    if (!stored) return false;

    if (Date.now() > stored.expires) {
      this.tokens.delete(sessionId);
      return false;
    }

    return stored.token === token;
  }

  static cleanupExpired(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

// Rate Limiting
class RateLimiter {
  private static limits = new Map<string, { count: number; resetTime: number }>();

  static isLimited(identifier: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.limits.get(identifier);

    if (!record) {
      this.limits.set(identifier, { count: 1, resetTime: now + windowMs });
      return false;
    }

    if (now > record.resetTime) {
      this.limits.set(identifier, { count: 1, resetTime: now + windowMs });
      return false;
    }

    if (record.count < maxAttempts) {
      record.count++;
      return false;
    }

    return true;
  }

  static getRemainingAttempts(identifier: string, maxAttempts: number): number {
    const record = this.limits.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return maxAttempts;
    }
    return Math.max(0, maxAttempts - record.count);
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [identifier, data] of this.limits.entries()) {
      if (now > data.resetTime) {
        this.limits.delete(identifier);
      }
    }
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
    let sanitized = input.replace(/[\x01-\x1f\x7f\x80-\x9f]/g, '');

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
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'",
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

  const suspicious = false;
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

// Auto-cleanup (run periodically)
setInterval(
  () => {
    CSRFProtection.cleanupExpired();
    RateLimiter.cleanup();
  },
  5 * 60 * 1000
); // Every 5 minutes

// Control character detection (fixed regex)
const controlCharPattern = /[\x00-\x1f\x7f\x80-\x9f]/g;

// SQL injection pattern (fixed escapes)
const sqlInjectionPattern =
  /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)|(-{2}|\/\*|\*\/|;|\||&|\+)/gi;
