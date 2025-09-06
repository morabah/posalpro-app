import { logger } from '@/lib/logger'; /**
 * Error Interceptor
 * Handles global error processing and categorization
 */

import type { ApiResponse } from '../client';
import { ApiRequest } from './authInterceptor';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  BUSINESS = 'BUSINESS',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export interface ProcessedError {
  category: ErrorCategory;
  code: string;
  message: string;
  userMessage: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  requestId?: string;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorHandlerOptions {
  showUserNotification?: boolean;
  logError?: boolean;
  trackAnalytics?: boolean;
  retryable?: boolean;
}

class ErrorInterceptor {
  private static instance: ErrorInterceptor | undefined;
  private errorHandlers: Map<ErrorCategory, (error: ProcessedError) => void> = new Map();

  static getInstance(): ErrorInterceptor {
    if (!ErrorInterceptor.instance) {
      ErrorInterceptor.instance = new ErrorInterceptor();
    }
    return ErrorInterceptor.instance;
  }

  registerErrorHandler(category: ErrorCategory, handler: (error: ProcessedError) => void): void {
    this.errorHandlers.set(category, handler);
  }

  private categorizeError(status: number, _response: unknown): ErrorCategory {
    // Intentionally unused in categorization for now
    void _response;
    if (status === 0) {
      return ErrorCategory.NETWORK;
    }

    if (status === 401) {
      return ErrorCategory.AUTHENTICATION;
    }

    if (status === 403) {
      return ErrorCategory.AUTHORIZATION;
    }

    if (status >= 400 && status < 500) {
      if (status === 422 || status === 400) {
        return ErrorCategory.VALIDATION;
      }
      return ErrorCategory.CLIENT;
    }

    if (status >= 500) {
      return ErrorCategory.SERVER;
    }

    return ErrorCategory.UNKNOWN;
  }

  private generateUserMessage(category: ErrorCategory, originalMessage: string): string {
    const userMessages: Record<ErrorCategory, string> = {
      [ErrorCategory.NETWORK]:
        'Unable to connect to the server. Please check your internet connection and try again.',
      [ErrorCategory.AUTHENTICATION]: 'Your session has expired. Please sign in again.',
      [ErrorCategory.AUTHORIZATION]: 'You do not have permission to perform this action.',
      [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
      [ErrorCategory.BUSINESS]: originalMessage || 'A business rule violation occurred.',
      [ErrorCategory.SERVER]:
        'A server error occurred. Our team has been notified. Please try again later.',
      [ErrorCategory.CLIENT]: 'An error occurred with your request. Please try again.',
      [ErrorCategory.TIMEOUT]: 'The request took too long to complete. Please try again.',
      [ErrorCategory.UNKNOWN]: 'An unexpected error occurred. Please try again.',
    };

    return userMessages[category] || userMessages[ErrorCategory.UNKNOWN];
  }

  private getSeverity(category: ErrorCategory, status: number): ProcessedError['severity'] {
    if (category === ErrorCategory.SERVER && status >= 500) {
      return 'critical';
    }

    if (category === ErrorCategory.NETWORK || category === ErrorCategory.AUTHENTICATION) {
      return 'high';
    }

    if (category === ErrorCategory.VALIDATION || category === ErrorCategory.BUSINESS) {
      return 'medium';
    }

    return 'low';
  }

  private isRetryable(category: ErrorCategory, status: number): boolean {
    const retryableCategories = [ErrorCategory.NETWORK, ErrorCategory.TIMEOUT];

    const retryableStatuses = [408, 429, 502, 503, 504];

    return retryableCategories.includes(category) || retryableStatuses.includes(status);
  }

  processError(
    error: Error | ApiResponse,
    request: ApiRequest,
    options: ErrorHandlerOptions = {
      showUserNotification: true,
      logError: true,
      trackAnalytics: true,
    }
  ): ProcessedError {
    let status: number;
    let responseData: unknown;
    let originalMessage: string;

    if ('status' in error) {
      // API Response error
      status = typeof error.status === 'number' ? error.status : 0;
      responseData = 'data' in error ? ((error as { data?: unknown }).data ?? null) : null;

      // Handle both wrapped and unwrapped response formats
      if (typeof responseData === 'string') {
        // Unwrapped response (middleware format)
        originalMessage = responseData;
      } else if (typeof responseData === 'object' && responseData !== null) {
        // Wrapped response (API format)
        const rdForMsg = responseData as Record<string, unknown>;
        const msgFromMessage =
          rdForMsg && typeof rdForMsg.message === 'string'
            ? (rdForMsg.message as string)
            : undefined;
        const msgFromError =
          rdForMsg && typeof rdForMsg.error === 'string' ? (rdForMsg.error as string) : undefined;
        originalMessage = msgFromMessage || msgFromError || `HTTP ${status}` || 'Unknown API error';
      } else {
        // No response data
        originalMessage = status ? `HTTP ${status}` : 'Unknown API error';
      }
    } else {
      // Network or other error
      const err = error as Error;
      status = 0;
      responseData = null;
      originalMessage = err.message || err.toString() || 'Unknown error';
    }

    const category = this.categorizeError(status, responseData);
    const userMessage = this.generateUserMessage(category, originalMessage);
    const severity = this.getSeverity(category, status);
    const retryable = options.retryable ?? this.isRetryable(category, status);

    // Extract metadata from response data (handle both wrapped and unwrapped formats)
    let codeMeta: string | undefined;
    let requestIdMeta: string | undefined;

    if (typeof responseData === 'string') {
      // Unwrapped response (middleware format) - no metadata available
      codeMeta = undefined;
      requestIdMeta = undefined;
    } else if (typeof responseData === 'object' && responseData !== null) {
      // Wrapped response (API format) - extract metadata
      const rdForMeta = responseData as Record<string, unknown>;
      codeMeta =
        rdForMeta && typeof rdForMeta.code === 'string' ? (rdForMeta.code as string) : undefined;
      requestIdMeta =
        rdForMeta && typeof rdForMeta.requestId === 'string'
          ? (rdForMeta.requestId as string)
          : undefined;
    } else {
      // No response data
      codeMeta = undefined;
      requestIdMeta = undefined;
    }

    const processedError: ProcessedError = {
      category,
      code: codeMeta || `${category}_${status}`,
      message: originalMessage || 'No error message provided',
      userMessage,
      details: {
        status,
        url: request.url,
        method: request.method,
        responseData,
        requestId: requestIdMeta,
        originalError:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      },
      timestamp: new Date(),
      requestId: requestIdMeta,
      retryable,
      severity,
    };

    // Handle the error based on category
    this.handleError(processedError, options);

    return processedError;
  }

  private handleError(error: ProcessedError, options: ErrorHandlerOptions): void {
    // Log error if requested
    if (options.logError === true) {
      this.logError(error);
    }

    // Track analytics if requested
    if (options.trackAnalytics === true) {
      this.trackError(error);
    }

    // Call registered category handler
    const handler = this.errorHandlers.get(error.category);
    if (handler) {
      handler(error);
    }

    // Show user notification if requested
    if (options.showUserNotification === true && typeof window !== 'undefined') {
      this.showUserNotification(error);
    }
  }

  private logError(error: ProcessedError): void {
    const logLevel = this.getLogLevel(error.severity);

    const logData = {
      timestamp: error.timestamp.toISOString(),
      category: error.category,
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      details: error.details ?? {},
      severity: error.severity,
      retryable: error.retryable,
      requestId: error.requestId,
    };

    // Only log if we have meaningful data
    if (logData.message !== 'No error message' || Object.keys(logData.details).length > 0) {
      console[logLevel]('[ErrorInterceptor]', logData);
    } else {
      // Don't log completely empty errors - they're likely from successful responses
      logger.debug('[ErrorInterceptor] Skipping empty error log - likely successful response');
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production' && error.severity === 'critical') {
      // Send to external logging service
      this.sendToLoggingService(logData);
    }
  }

  private getLogLevel(severity: ProcessedError['severity']): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      default:
        return 'log';
    }
  }

  private trackError(error: ProcessedError): void {
    // Track error in analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `${error.category}: ${error.code}`,
        fatal: error.severity === 'critical',
        custom_map: {
          error_category: error.category,
          error_code: error.code,
          severity: error.severity,
          retryable: error.retryable,
        },
      });
    }
  }

  private showUserNotification(error: ProcessedError): void {
    // This would integrate with your toast/notification system
    // For now, we'll dispatch a custom event
    window.dispatchEvent(
      new CustomEvent('app:error', {
        detail: {
          message: error.userMessage,
          type: this.getNotificationType(error.severity),
          duration: this.getNotificationDuration(error.severity),
          action: error.retryable ? 'retry' : undefined,
        },
      })
    );
  }

  private getNotificationType(severity: ProcessedError['severity']): string {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  }

  private getNotificationDuration(severity: ProcessedError['severity']): number {
    switch (severity) {
      case 'critical':
        return 0; // Stay until user dismisses
      case 'high':
        return 10000; // 10 seconds
      case 'medium':
        return 7000; // 7 seconds
      default:
        return 5000; // 5 seconds
    }
  }

  private async sendToLoggingService(logData: Record<string, unknown>): Promise<void> {
    // Implement logging service integration
    // For now, just logger.info
    logger.info('[ErrorInterceptor] Error logged:', logData);
  }

  async interceptResponse<T>(
    response: Response,
    data: unknown,
    options: ErrorHandlerOptions = {}
  ): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const error = this.processError(
        {
          status: response.status,
          data: data,
          success: false,
          message: `HTTP ${response.status}`,
        } as ApiResponse<T>,
        {
          url: response.url,
          method: response.type as string,
          headers: Object.fromEntries(response.headers.entries()),
        },
        options
      );

      throw new Error(error.userMessage);
    }

    // Handle API responses that already have the expected structure
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      // API route already returns proper ApiResponse structure, pass it through
      return data as ApiResponse<T>;
    }

    // For raw data, wrap it in ApiResponse structure
    return {
      data: data as T,
      success: true,
      message: 'Success',
    };
  }
}

// Global error handler setup
export const errorInterceptor = ErrorInterceptor.getInstance();

// Set up global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', event => {
    try {
      const reason: unknown = event.reason;
      const err: Error =
        reason instanceof Error
          ? reason
          : new Error(typeof reason === 'string' ? reason : 'Unhandled promise rejection');
      errorInterceptor.processError(err, {
        url: window.location.href,
        method: 'GET',
        headers: {},
      });
    } catch (handlerError) {
      logger.error('[ErrorInterceptor] Error in unhandledrejection handler:', handlerError);
    }
  });

  window.addEventListener('error', event => {
    try {
      const error = new Error(event.message || 'Unknown error');
      if (event.filename) {
        error.stack = `${error.message}\n    at ${event.filename}:${event.lineno}:${event.colno}`;
      }
      errorInterceptor.processError(error, {
        url: window.location.href,
        method: 'GET',
        headers: {},
      });
    } catch (handlerError) {
      logger.error('[ErrorInterceptor] Error in error handler:', handlerError);
    }
  });
}
