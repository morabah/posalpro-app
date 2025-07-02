import { logger } from '@/utils/logger'; /**
 * PosalPro MVP2 - Security Hardening Framework
 * Implements rate limiting, input validation, security headers, and audit logging
 *
 * Phase 4 Implementation: Production-Ready Security Infrastructure
 * Reference: COMPREHENSIVE_GAP_ANALYSIS.md Phase 3 Enhancement & Polish
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { databaseIdSchema } from '../validation/schemas/common'; // ✅ Import database-agnostic ID schema

// Rate limiting utilities
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const request = this.requests.get(identifier);

    if (!request || now > request.resetTime) {
      // New window or expired window
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (request.count >= this.maxRequests) {
      return false;
    }

    request.count++;
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const request = this.requests.get(identifier);
    if (!request || Date.now() > request.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - request.count);
  }

  getResetTime(identifier: string): number {
    const request = this.requests.get(identifier);
    if (!request || Date.now() > request.resetTime) {
      return Date.now() + this.windowMs;
    }
    return request.resetTime;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, request] of Array.from(this.requests.entries())) {
      if (now - request.resetTime > this.windowMs) {
        this.requests.delete(key);
      }
    }
  }
}

// Global rate limiters for different endpoints
export const authRateLimiter = new RateLimiter(60000, 5); // 5 requests per minute for auth
export const apiRateLimiter = new RateLimiter(60000, 100); // 100 requests per minute for API
export const strictRateLimiter = new RateLimiter(900000, 3); // 3 requests per 15 minutes for sensitive operations

// Input validation and sanitization
export class InputValidator {
  // Sanitize string input
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>\"'%;()&+]/g, '') // Remove potentially dangerous characters
      .trim()
      .substring(0, 1000); // Limit length
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailSchema = z.string().email();
    try {
      emailSchema.parse(email);
      return true;
    } catch {
      return false;
    }
  }

  // Validate password strength
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common passwords
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Validate and sanitize SQL-like inputs
  static validateSqlInput(input: string): boolean {
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\*\/|\/\*)/,
      /(\b(OR|AND)\b.*=.*\b(OR|AND)\b)/i,
      /[';\"]/,
    ];

    return !sqlInjectionPatterns.some(pattern => pattern.test(input));
  }

  // Validate file uploads
  static validateFileUpload(
    file: File,
    allowedTypes: string[],
    maxSize: number
  ): { valid: boolean; error?: string } {
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds maximum allowed' };
    }

    // Check for executable file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
    const fileName = file.name.toLowerCase();

    if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
      return { valid: false, error: 'Executable files are not allowed' };
    }

    return { valid: true };
  }
}

// Security headers utility
export class SecurityHeaders {
  static getSecurityHeaders(): Record<string, string> {
    return {
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.posalpro.com",
        "frame-ancestors 'none'",
      ].join('; '),

      // Prevent XSS attacks
      'X-XSS-Protection': '1; mode=block',

      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',

      // Prevent clickjacking
      'X-Frame-Options': 'DENY',

      // Enforce HTTPS
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

      // Control referrer information
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      // Permissions policy
      'Permissions-Policy': [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'interest-cohort=()',
      ].join(', '),

      // Remove server information
      Server: 'PosalPro',
    };
  }

  static applyToResponse(response: NextResponse): NextResponse {
    const headers = this.getSecurityHeaders();

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
}

// CSRF protection
export class CSRFProtection {
  private static tokens: Map<string, { token: string; expires: number }> = new Map();

  static generateToken(sessionId: string): string {
    const token = crypto.randomUUID();
    const expires = Date.now() + 3600000; // 1 hour

    this.tokens.set(sessionId, { token, expires });
    return token;
  }

  static validateToken(sessionId: string, token: string): boolean {
    const storedToken = this.tokens.get(sessionId);

    if (!storedToken) {
      return false;
    }

    if (Date.now() > storedToken.expires) {
      this.tokens.delete(sessionId);
      return false;
    }

    return storedToken.token === token;
  }

  private static cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [sessionId, tokenData] of Array.from(CSRFProtection.tokens.entries())) {
      if (now > tokenData.expires) {
        CSRFProtection.tokens.delete(sessionId);
      }
    }
  }
}

// Audit logging
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  error?: string;
}

export class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs: number = 10000;

  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const logEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...entry,
    };

    this.logs.push(logEntry);

    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // In production, this would be sent to a logging service
    if (entry.severity === 'critical' || entry.severity === 'high') {
      logger.warn('Security Alert:', logEntry);
    }
  }

  getLogs(filters?: Partial<AuditLogEntry>): AuditLogEntry[] {
    if (!filters) {
      return this.logs;
    }

    return this.logs.filter(log => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined) return true;
        return log[key as keyof AuditLogEntry] === value;
      });
    });
  }

  getSecurityEvents(): AuditLogEntry[] {
    return this.logs.filter(
      log => log.severity === 'high' || log.severity === 'critical' || !log.success
    );
  }
}

// Global audit logger instance
export const auditLogger = new AuditLogger();

// Security middleware
export function createSecurityMiddleware() {
  return async (request: NextRequest) => {
    const response = NextResponse.next();

    // Apply security headers
    SecurityHeaders.applyToResponse(response);

    // Get client info
    const ip =
      (request as any).ip ||
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Apply rate limiting
    let rateLimiter = apiRateLimiter;

    if (request.nextUrl.pathname.startsWith('/api/auth')) {
      rateLimiter = authRateLimiter;
    } else if (
      request.nextUrl.pathname.includes('admin') ||
      request.nextUrl.pathname.includes('sensitive')
    ) {
      rateLimiter = strictRateLimiter;
    }

    if (!rateLimiter.isAllowed(ip)) {
      auditLogger.log({
        action: 'rate_limit_exceeded',
        resource: request.nextUrl.pathname,
        details: { path: request.nextUrl.pathname },
        ipAddress: ip,
        userAgent,
        severity: 'medium',
        success: false,
        error: 'Rate limit exceeded',
      });

      return new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimiter.getResetTime(ip) - Date.now()) / 1000).toString(),
        },
      });
    }

    // Log all requests
    auditLogger.log({
      action: 'request',
      resource: request.nextUrl.pathname,
      details: {
        method: request.method,
        path: request.nextUrl.pathname,
      },
      ipAddress: ip,
      userAgent,
      severity: 'low',
      success: true,
    });

    return response;
  };
}

// Input validation schemas
export const SecuritySchemas = {
  // User registration
  userRegistration: z
    .object({
      name: z
        .string()
        .min(2)
        .max(50)
        .regex(/^[a-zA-Z\s]+$/, 'Only letters and spaces allowed'),
      email: z.string().email(),
      password: z.string().min(8),
      confirmPassword: z.string(),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),

  // Login
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),

  // Proposal creation
  proposalCreation: z.object({
    name: z.string().min(3).max(100),
    description: z.string().max(1000),
    clientId: databaseIdSchema, // ✅ FIXED: Using database-agnostic databaseIdSchema instead of z.string().uuid()
    deadline: z.string().datetime(),
  }),

  // File upload
  fileUpload: z.object({
    fileName: z.string().max(255),
    fileType: z.string(),
    fileSize: z.number().max(10 * 1024 * 1024), // 10MB max
  }),
};

// Security utilities
export class SecurityUtils {
  // Generate secure random string
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  // Hash sensitive data (for client-side hashing before transmission)
  static async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Validate JWT token format (basic validation)
  static isValidJWTFormat(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  // Check for suspicious patterns in input
  static detectSuspiciousInput(input: string): { suspicious: boolean; reasons: string[] } {
    const suspiciousPatterns = [
      { pattern: /<script/i, reason: 'Contains script tag' },
      { pattern: /javascript:/i, reason: 'Contains javascript protocol' },
      { pattern: /on\w+\s*=/i, reason: 'Contains event handler' },
      { pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b)/i, reason: 'Contains SQL keywords' },
      { pattern: /\.\.\//g, reason: 'Contains path traversal' },
      { pattern: /eval\s*\(/i, reason: 'Contains eval function' },
    ];

    const reasons: string[] = [];

    suspiciousPatterns.forEach(({ pattern, reason }) => {
      if (pattern.test(input)) {
        reasons.push(reason);
      }
    });

    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  }
}

// Export default security configuration
export default {
  RateLimiter,
  InputValidator,
  SecurityHeaders,
  CSRFProtection,
  AuditLogger,
  SecurityUtils,
  SecuritySchemas,
  createSecurityMiddleware,
};
