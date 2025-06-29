import { logger } from '@/utils/logger'; /**
 * Error Interceptor
 * Handles global error processing and categorization
 */

import type { ApiResponse } from '../client';
import { ApiRequest } from './authInterceptor';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
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
  details?: any;
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
  private static instance: ErrorInterceptor;
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

  private categorizeError(status: number, response: any): ErrorCategory {
    if (status === 0 || status === undefined) {
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
    options: ErrorHandlerOptions = {}
  ): ProcessedError {
    let status: number;
    let responseData: any;
    let originalMessage: string;

    // Add safety checks for error object
    if (!error) {
      error = new Error('Unknown error occurred');
    }

    // Add safety checks for request object
    if (!request) {
      request = {
        url: 'unknown',
        method: 'GET',
        headers: {},
      };
    }

    if ('status' in error) {
      // API Response error
      status = typeof error.status === 'number' ? error.status : 0;
      responseData = 'data' in error ? error.data : null;
      originalMessage =
        responseData?.message || responseData?.error || `HTTP ${status}` || 'Unknown API error';
    } else {
      // Network or other error
      status = 0;
      responseData = null;
      originalMessage = error?.message || error?.toString() || 'Unknown error';
    }

    const category = this.categorizeError(status, responseData);
    const userMessage = this.generateUserMessage(category, originalMessage);
    const severity = this.getSeverity(category, status);
    const retryable = options.retryable ?? this.isRetryable(category, status);

    const processedError: ProcessedError = {
      category,
      code: responseData?.code || `${category}_${status}`,
      message: originalMessage || 'No error message provided',
      userMessage,
      details: {
        status,
        url: request?.url || 'unknown',
        method: request?.method || 'GET',
        responseData,
        requestId: responseData?.requestId,
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
      requestId: responseData?.requestId,
      retryable,
      severity,
    };

    // Handle the error based on category
    this.handleError(processedError, options);

    return processedError;
  }

  private handleError(error: ProcessedError, options: ErrorHandlerOptions): void {
    // Log error if requested
    if (options.logError !== false) {
      this.logError(error);
    }

    // Track analytics if requested
    if (options.trackAnalytics !== false) {
      this.trackError(error);
    }

    // Call registered category handler
    const handler = this.errorHandlers.get(error.category);
    if (handler) {
      handler(error);
    }

    // Show user notification if requested
    if (options.showUserNotification !== false && typeof window !== 'undefined') {
      this.showUserNotification(error);
    }
  }

  private logError(error: ProcessedError): void {
    // Safety check for error object
    if (!error) {
      logger.error('[ErrorInterceptor] No error object provided to logError');
      return;
    }

    const logLevel = this.getLogLevel(error.severity || 'low');

    const logData = {
      timestamp: error.timestamp?.toISOString() || new Date().toISOString(),
      category: error.category || 'UNKNOWN',
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'No error message',
      userMessage: error.userMessage || 'Unknown error occurred',
      details: error.details || {},
      severity: error.severity || 'low',
      retryable: error.retryable || false,
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

  private async sendToLoggingService(logData: any): Promise<void> {
    // Implement logging service integration
    // For now, just logger.info
    logger.info('[ErrorInterceptor] Error logged:', logData);
  }

  async interceptResponse(
    response: Response,
    data: any,
    options: ErrorHandlerOptions = {}
  ): Promise<ApiResponse<any>> {
    if (!response.ok) {
      const error = this.processError(
        {
          status: response.status,
          data: data,
          success: false,
          message: `HTTP ${response.status}`,
        } as ApiResponse<any>,
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
      return data;
    }

    // For raw data, wrap it in ApiResponse structure
    return {
      data: data,
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
      const error = event.reason || new Error('Unhandled promise rejection');
      errorInterceptor.processError(error, {
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
