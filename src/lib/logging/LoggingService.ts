import { logger } from '@/utils/logger';/**
 * PosalPro MVP2 - Logging Service
 * Enterprise-grade logging infrastructure
 * Component Traceability Matrix: US-6.1, US-6.2, H8, H11
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  userStories?: string[];
  hypotheses?: string[];
  performanceMetrics?: {
    executionTime?: number;
    memoryUsage?: number;
    cacheHitRate?: number;
  };
}

export class LoggingService {
  private static instance: LoggingService;
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
  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }

  /**
   * Log informational messages
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  /**
   * Log warning messages
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log error messages
   */
  error(message: string, metadata?: Record<string, any>): void {
    this.log('error', message, metadata);
  }

  /**
   * Log critical messages
   */
  critical(message: string, metadata?: Record<string, any>): void {
    this.log('critical', message, metadata);
  }

  /**
   * Log performance metrics
   */
  performance(
    message: string,
    metrics: {
      executionTime?: number;
      memoryUsage?: number;
      cacheHitRate?: number;
    },
    metadata?: Record<string, any>
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
  private log(level: LogEntry['level'], message: string, metadata?: Record<string, any>): void {
    try {
      const logEntry: LogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        level,
        message,
        component: metadata?.component,
        operation: metadata?.operation,
        userId: metadata?.userId,
        sessionId: metadata?.sessionId,
        metadata,
        userStories: metadata?.userStories,
        hypotheses: metadata?.hypotheses,
        performanceMetrics: metadata?.performanceMetrics,
      };

      this.logs.push(logEntry);

      // Maintain max logs limit
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      // In development, also log to console
      if (process.env.NODE_ENV === 'development') {
        const consoleMethod =
          level === 'critical' || level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
        console[consoleMethod](`[${level.toUpperCase()}] ${message}`, metadata);
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
            ...metadata,
          }
        );
      }
    } catch (error) {
      // Fallback to console if logging service fails
      logger.error('LoggingService error: ' + (error instanceof Error ? error.message : String(error)), { level, message, metadata, error });
    }
  }

  /**
   * Get logs with optional filtering
   */
  getLogs(filters?: Partial<LogEntry>): LogEntry[] {
    if (!filters) {
      return this.logs;
    }

    return this.logs.filter(log => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined) return true;
        return log[key as keyof LogEntry] === value;
      });
    });
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
