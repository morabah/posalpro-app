import { logger } from '@/lib/logger';/**
 * PosalPro MVP2 - Logging Service
 * Enterprise-grade logging infrastructure
 * Component Traceability Matrix: US-6.1, US-6.2, H8, H11
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';

interface PerformanceMetrics {
  executionTime?: number;
  memoryUsage?: number;
  cacheHitRate?: number;
}

export interface LogMetadata {
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  userStories?: string[];
  hypotheses?: string[];
  performanceMetrics?: PerformanceMetrics;
  [key: string]: unknown;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  userStories?: string[];
  hypotheses?: string[];
  performanceMetrics?: PerformanceMetrics;
}

export class LoggingService {
  private static instance: LoggingService | undefined;
  private logs: LogEntry[] = [];
  private maxLogs: number = 10000;
  private errorHandlingService: ErrorHandlingService;

  private constructor() {
    this.errorHandlingService = ErrorHandlingService.getInstance();
  }

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Log debug information
   */
  debug(message: string, metadata?: LogMetadata): void {
    this.log('debug', message, metadata);
  }

  /**
   * Log informational messages
   */
  info(message: string, metadata?: LogMetadata): void {
    this.log('info', message, metadata);
  }

  /**
   * Log warning messages
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log error messages
   */
  error(message: string, metadata?: LogMetadata): void {
    this.log('error', message, metadata);
  }

  /**
   * Log critical messages
   */
  critical(message: string, metadata?: LogMetadata): void {
    this.log('critical', message, metadata);
  }

  /**
   * Log performance metrics
   */
  performance(
    message: string,
    metrics: PerformanceMetrics,
    metadata?: LogMetadata
  ): void {
    this.log('info', message, {
      ...metadata,
      performanceMetrics: metrics,
      userStories: ['US-6.1', 'US-6.2'],
      hypotheses: ['H8', 'H11'],
    });
  }

  /**
   * Core logging method
   */
  private log(level: LogEntry['level'], message: string, metadata?: LogMetadata): void {
    try {
      const safeMeta: LogMetadata | undefined = metadata ? { ...metadata } : undefined;
      const logEntry: LogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        level,
        message,
        component: safeMeta?.component,
        operation: safeMeta?.operation,
        userId: safeMeta?.userId,
        sessionId: safeMeta?.sessionId,
        metadata: safeMeta?.metadata,
        userStories: safeMeta?.userStories,
        hypotheses: safeMeta?.hypotheses,
        performanceMetrics: safeMeta?.performanceMetrics,
      };

      this.logs.push(logEntry);

      // Maintain max logs limit
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      // In development, also log to console
      if (process.env.NODE_ENV === 'development') {
        type ConsoleMethod = 'error' | 'warn' | 'log';
        const consoleFns: Record<ConsoleMethod, (...args: unknown[]) => void> = {
          error: console.error.bind(console),
          warn: console.warn.bind(console),
          log: console.log.bind(console),
        };
        const method: ConsoleMethod =
          level === 'critical' || level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
        consoleFns[method](`[${level.toUpperCase()}] ${message}`, safeMeta);
      }

      // For critical and error logs, also process through error handling service
      if (level === 'critical' || level === 'error') {
        this.errorHandlingService.processError(
          new Error(message),
          `Logging service: ${level} level message`,
          level === 'critical'
            ? ErrorCodes.SYSTEM.INTERNAL_ERROR
            : ErrorCodes.SYSTEM.INTERNAL_ERROR,
          {
            component: 'LoggingService',
            operation: 'log',
            logLevel: level,
            originalMessage: message,
            userFriendlyMessage: 'System logging event occurred.',
            ...(safeMeta ? (safeMeta as Record<string, unknown>) : {}),
          }
        );
      }
    } catch (error) {
      // Fallback to console if logging service fails
      const metaForLog: Record<string, unknown> | undefined = metadata?.metadata;
      logger.error(
        'LoggingService error: ' + (error instanceof Error ? error.message : String(error)),
        { level, message, metadata: metaForLog, error }
      );
    }
  }

  /**
   * Get logs with optional filtering
   */
  getLogs(filters?: Partial<LogEntry>): LogEntry[] {
    if (!filters) {
      return this.logs;
    }

    const keys = Object.keys(filters) as Array<keyof LogEntry>;
    return this.logs.filter(log =>
      keys.every(key => {
        const expected = filters[key];
        if (expected === undefined) return true;
        const actual = log[key];
        if (key === 'timestamp') {
          return actual instanceof Date && expected instanceof Date
            ? actual.getTime() === expected.getTime()
            : false;
        }
        if (typeof actual !== typeof expected) return false;
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual === expected;
        }
        if (typeof actual === 'number' && typeof expected === 'number') {
          return actual === expected;
        }
        if (typeof actual === 'boolean' && typeof expected === 'boolean') {
          return actual === expected;
        }
        // For objects (including arrays), fall back to referential equality
        return Object.is(actual as unknown, expected as unknown);
      })
    );
  }

  /**
   * Get performance logs
   */
  getPerformanceLogs(): LogEntry[] {
    return this.logs.filter(log => log.performanceMetrics);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs for analysis
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const loggingService = LoggingService.getInstance();
export default LoggingService;
