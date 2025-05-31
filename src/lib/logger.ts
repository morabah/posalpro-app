/**
 * Centralized Logging Infrastructure
 * Provides structured logging with environment-aware configuration
 * and comprehensive context data support
 */

// Log levels enum for type safety
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Log context interface for structured data
export interface LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  error?: Error | unknown;
  environment: string;
  userAgent?: string;
  sessionId?: string;
  userId?: string;
  component?: string;
  action?: string;
}

// Environment configuration interface
interface LoggerConfig {
  enableConsole: boolean;
  enableRemote: boolean;
  minLevel: LogLevel;
  includeStackTrace: boolean;
  maxDataSize: number;
  remoteEndpoint?: string;
}

// Environment-aware configuration
const getLoggerConfig = (): LoggerConfig => {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';
  const isTest = env === 'test';

  return {
    enableConsole: !isTest, // Disable console in tests
    enableRemote: isProduction,
    minLevel: isProduction ? LogLevel.INFO : LogLevel.DEBUG,
    includeStackTrace: !isProduction,
    maxDataSize: isProduction ? 1000 : 5000, // Limit data size in production
    remoteEndpoint: process.env.NEXT_PUBLIC_LOGGING_ENDPOINT,
  };
};

// Logger class with structured logging capabilities
class Logger {
  private config: LoggerConfig;
  private sessionId: string;

  constructor() {
    this.config = getLoggerConfig();
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.config.minLevel);
    return currentLevelIndex >= minLevelIndex;
  }

  private formatData(
    data: Record<string, unknown> | undefined
  ): Record<string, unknown> | undefined {
    if (!data) return undefined;

    try {
      const serialized = JSON.stringify(data);
      if (serialized.length > this.config.maxDataSize) {
        return {
          ...data,
          _truncated: true,
          _originalSize: serialized.length,
          _maxSize: this.config.maxDataSize,
        };
      }
      return data;
    } catch (error) {
      return {
        _serializationError: true,
        _error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private createLogContext(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error | unknown
  ): LogContext {
    const context: LogContext = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: process.env.NODE_ENV || 'development',
      sessionId: this.sessionId,
    };

    // Add data if provided
    if (data) {
      context.data = this.formatData(data);
    }

    // Add error information if provided
    if (error) {
      context.error =
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: this.config.includeStackTrace ? error.stack : undefined,
            }
          : error;
    }

    // Add browser context if available
    if (typeof window !== 'undefined') {
      context.userAgent = window.navigator.userAgent;
    }

    return context;
  }

  private logToConsole(context: LogContext): void {
    if (!this.config.enableConsole) return;

    const { level, message, data, error } = context;
    const timestamp = new Date(context.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, data, error);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, data, error);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, data, error);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, data, error);
        break;
    }
  }

  private async logToRemote(context: LogContext): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
      });
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('[Logger] Failed to send log to remote endpoint:', error);
    }
  }

  private async log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error | unknown
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const context = this.createLogContext(level, message, data, error);

    // Log to console
    this.logToConsole(context);

    // Log to remote endpoint (async, don't wait)
    this.logToRemote(context).catch(err => {
      console.error('[Logger] Remote logging failed:', err);
    });
  }

  // Public logging methods
  public async debug(message: string, data?: Record<string, unknown>): Promise<void> {
    await this.log(LogLevel.DEBUG, message, data);
  }

  public async info(message: string, data?: Record<string, unknown>): Promise<void> {
    await this.log(LogLevel.INFO, message, data);
  }

  public async warn(message: string, data?: Record<string, unknown>): Promise<void> {
    await this.log(LogLevel.WARN, message, data);
  }

  public async error(
    message: string,
    error?: Error | unknown,
    data?: Record<string, unknown>
  ): Promise<void> {
    await this.log(LogLevel.ERROR, message, data, error);
  }

  // Validation logging for phase completion tracking
  public async validation(
    phase: string,
    status: 'success' | 'failed' | 'in_progress',
    details: string,
    lessons?: string,
    patterns?: string
  ): Promise<void> {
    await this.log(LogLevel.INFO, `Phase validation: ${phase}`, {
      phase,
      status,
      details,
      lessons,
      patterns,
      category: 'validation',
      timestamp: new Date().toISOString(),
    });
  }

  // Performance logging helper
  public async performance(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log(LogLevel.INFO, `Performance: ${operation}`, {
      operation,
      duration,
      metadata,
      category: 'performance',
    });
  }

  // Get current configuration (useful for debugging)
  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Update configuration at runtime
  public updateConfig(updates: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Create singleton logger instance
const logger = new Logger();

// Export convenience functions for easy usage
export const logDebug = (message: string, data?: Record<string, unknown>): Promise<void> =>
  logger.debug(message, data);

export const logInfo = (message: string, data?: Record<string, unknown>): Promise<void> =>
  logger.info(message, data);

export const logWarn = (message: string, data?: Record<string, unknown>): Promise<void> =>
  logger.warn(message, data);

export const logError = (
  message: string,
  error?: Error | unknown,
  data?: Record<string, unknown>
): Promise<void> => logger.error(message, error, data);

export const logValidation = (
  phase: string,
  status: 'success' | 'failed' | 'in_progress',
  details: string,
  lessons?: string,
  patterns?: string
): Promise<void> => logger.validation(phase, status, details, lessons, patterns);

export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>
): Promise<void> => logger.performance(operation, duration, metadata);

// Export logger instance for advanced usage
export { logger };

// Export additional types for external usage
export type { LoggerConfig };
