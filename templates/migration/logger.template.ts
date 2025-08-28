// Enhanced Logging Template for Migration from Bridge Pattern
// User Story: US-1.1 (Logging & Observability)
// Hypothesis: H1 (Structured logging improves debugging and monitoring)
//
// ✅ FOLLOWS: CORE_REQUIREMENTS.md - Comprehensive logging standards
// ✅ IMPLEMENTS: Structured logging with context and metadata
// ✅ ALIGNS: Performance tracking and error correlation
// ✅ FEATURES: Multiple output formats and log levels

// ====================
// Log Levels
// ====================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// ====================
// Log Context Interface
// ====================

export interface LogContext {
  component?: string;
  operation?: string;
  userId?: string;
  resourceId?: string;
  requestId?: string;
  userStory?: string;
  hypothesis?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
  loadTime?: number;
  count?: number;
  status?: number;
  method?: string;
  path?: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  error?: {
    code?: string;
    message: string;
    stack?: string;
    details?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

// ====================
// Logger Configuration
// ====================

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStructured: boolean;
  includeTimestamp: boolean;
  includeRequestId: boolean;
  environment: 'development' | 'staging' | 'production';
  serviceName: string;
}

// ====================
// Logger Class
// ====================

export class Logger {
  private config: LoggerConfig;
  private requestId: string | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStructured: true,
      includeTimestamp: true,
      includeRequestId: true,
      environment: (process.env.NODE_ENV as any) || 'development',
      serviceName: 'posalpro-app',
      ...config,
    };
  }

  // Set request ID for correlation
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  // Clear request ID
  clearRequestId(): void {
    this.requestId = null;
  }

  // Check if log level is enabled
  private isLevelEnabled(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
    const currentIndex = levels.indexOf(this.config.level);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  // Create log entry
  private createLogEntry(level: LogLevel, message: string, context?: LogContext): Record<string, unknown> {
    const timestamp = this.config.includeTimestamp ? new Date().toISOString() : undefined;

    const entry: Record<string, unknown> = {
      level,
      message,
      timestamp,
      service: this.config.serviceName,
      environment: this.config.environment,
    };

    if (this.config.includeRequestId && this.requestId) {
      entry.requestId = this.requestId;
    }

    if (context) {
      // Filter out undefined values and sensitive data
      Object.entries(context).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Skip sensitive fields in production
          if (this.config.environment === 'production' && ['password', 'token', 'secret'].includes(key)) {
            entry[key] = '[REDACTED]';
          } else {
            entry[key] = value;
          }
        }
      });
    }

    return entry;
  }

  // Format log entry for console
  private formatForConsole(entry: Record<string, unknown>): string {
    const { level, timestamp, message, ...context } = entry;
    const timestampStr = timestamp ? `[${timestamp}]` : '';
    const contextStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
    return `${timestampStr} ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  // Format log entry as structured JSON
  private formatAsJson(entry: Record<string, unknown>): string {
    return JSON.stringify(entry, null, this.config.environment === 'development' ? 2 : 0);
  }

  // Core logging method
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const entry = this.createLogEntry(level, message, context);

    if (this.config.enableConsole) {
      const consoleMethod = level === LogLevel.ERROR || level === LogLevel.CRITICAL ? 'error' :
                           level === LogLevel.WARN ? 'warn' :
                           level === LogLevel.DEBUG ? 'debug' : 'log';

      if (this.config.enableStructured) {
        console[consoleMethod](this.formatAsJson(entry));
      } else {
        console[consoleMethod](this.formatForConsole(entry));
      }
    }

    // TODO: Add external logging service integration (e.g., DataDog, LogRocket, etc.)
    // this.sendToExternalService(entry);
  }

  // Public logging methods
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  critical(message: string, context?: LogContext): void {
    this.log(LogLevel.CRITICAL, message, context);
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation}`, {
      ...context,
      operation,
      duration,
      performance: true,
    });
  }

  // Request logging
  request(method: string, path: string, status: number, duration: number, context?: LogContext): void {
    const level = status >= 500 ? LogLevel.ERROR :
                  status >= 400 ? LogLevel.WARN : LogLevel.INFO;

    this.log(level, `HTTP ${method} ${path}`, {
      ...context,
      method,
      path,
      status,
      duration,
      http: true,
    });
  }

  // User action logging
  userAction(action: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, {
      ...context,
      action,
      userAction: true,
    });
  }

  // Error logging with full context
  logError(error: unknown, message?: string, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    };

    this.error(message || 'An error occurred', errorContext);
  }
}

// ====================
// Default Logger Instance
// ====================

const defaultLogger = new Logger();

// ====================
// Convenience Functions (Backward Compatibility)
// ====================

export const logDebug = (message: string, context?: LogContext): void => {
  defaultLogger.debug(message, context);
};

export const logInfo = (message: string, context?: LogContext): void => {
  defaultLogger.info(message, context);
};

export const logWarn = (message: string, context?: LogContext): void => {
  defaultLogger.warn(message, context);
};

export const logError = (message: string, context?: LogContext): void => {
  defaultLogger.error(message, context);
};

// ====================
// Advanced Logging Functions
// ====================

export const logPerformance = (operation: string, duration: number, context?: LogContext): void => {
  defaultLogger.performance(operation, duration, context);
};

export const logRequest = (method: string, path: string, status: number, duration: number, context?: LogContext): void => {
  defaultLogger.request(method, path, status, duration, context);
};

export const logUserAction = (action: string, context?: LogContext): void => {
  defaultLogger.userAction(action, context);
};

export const logApiError = (error: unknown, operation: string, context?: LogContext): void => {
  defaultLogger.logError(error, `API Error: ${operation}`, context);
};

// ====================
// Request ID Management
// ====================

export const setRequestId = (requestId: string): void => {
  defaultLogger.setRequestId(requestId);
};

export const clearRequestId = (): void => {
  defaultLogger.clearRequestId();
};

// ====================
// Logger Factory
// ====================

export const createLogger = (config?: Partial<LoggerConfig>): Logger => {
  return new Logger(config);
};

// ====================
// Export Default
// ====================

export default defaultLogger;
