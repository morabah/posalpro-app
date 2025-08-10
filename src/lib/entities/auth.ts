/**
 * PosalPro MVP2 - Auth Entity
 * Authentication entity class with session management and security operations
 * Integrates with NextAuth.js and existing auth infrastructure
 */

import { apiClient, type ApiResponse } from '@/lib/api/client';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { trackAuthEvent } from '@/lib/store/authStore';
import { loginSchema, registrationSchema } from '@/lib/validation';
import { UserType } from '@/types/enums';
import { z } from 'zod';

// Infer types from validation schemas
export type LoginCredentials = z.infer<typeof loginSchema>;
export type RegisterUserData = z.infer<typeof registrationSchema>;

export interface AuthSession {
  id: string;
  userId: string;
  email: string;
  role: UserType;
  permissions: string[];
  department?: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastActivity: Date;
  sessionExpiry: Date;
  csrfToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  expiresAt: Date;
}

export interface SecuritySettings {
  userId: string;
  twoFactorEnabled: boolean;
  lastPasswordChange: Date;
  passwordExpiryDays: number;
  allowedIpAddresses: string[];
  sessionTimeout: number; // minutes
  maxConcurrentSessions: number;
  requirePasswordChange: boolean;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  timestamp: Date;
  location?: {
    country: string;
    city: string;
    timezone: string;
  };
}

export interface PasswordResetRequest {
  id: string;
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  ipAddress: string;
  requestedAt: Date;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  setupToken: string;
}

export interface DeviceSession {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: string;
  ipAddress: string;
  lastActivity: Date;
  createdAt: Date;
  isCurrentSession: boolean;
}

/**
 * Auth Entity Class
 * Provides comprehensive authentication and session management
 */
export class AuthEntity {
  private static instance: AuthEntity | null = null;
  private readonly errorHandlingService = ErrorHandlingService.getInstance();

  private constructor() {}

  public static getInstance(): AuthEntity {
    if (AuthEntity.instance === null) {
      AuthEntity.instance = new AuthEntity();
    }
    return AuthEntity.instance;
  }

  /**
   * Authenticate user with credentials
   */
  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<{ session: AuthSession; tokens: AuthTokens }>> {
    try {
      // Validate credentials
      const validatedCredentials = loginSchema.parse(credentials);

      // Perform login
      const response = await apiClient.post<{ session: AuthSession; tokens: AuthTokens }>(
        '/auth/login',
        validatedCredentials
      );

      if (response.success) {
        // Session cached automatically by apiClient
        
        // Track successful login
        trackAuthEvent('login_success', {
          userId: response.data.session.userId,
          role: response.data.session.role,
          hasRememberMe: validatedCredentials.rememberMe,
        });
      }

      return response;
    } catch (error) {
      // Track failed login attempt
      trackAuthEvent('login_failure', {
        email: credentials.email,
        role: credentials.role,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const processedError = this.errorHandlingService.processError(
        error,
        'Authentication failed',
        ErrorCodes.AUTH.INVALID_CREDENTIALS,
        {
          component: 'AuthEntity',
          operation: 'login',
          email: credentials.email,
          userFriendlyMessage: 'Invalid email or password. Please try again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Register new user
   */
  async register(
    userData: RegisterUserData
  ): Promise<ApiResponse<{ message: string; userId?: string }>> {
    try {
      // Validate registration data
      const validatedData = registrationSchema.parse(userData);

      // Register user
      const response = await apiClient.post<{ message: string; userId?: string }>(
        '/auth/register',
        validatedData
      );

      if (response.success) {
        // Track registration
        trackAuthEvent('registration_success', {
          email: validatedData.email,
          role: validatedData.role,
          department: validatedData.department,
        });
      }

      return response;
    } catch (error) {
      // Track registration failure
      trackAuthEvent('registration_failure', {
        email: userData.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const processedError = this.errorHandlingService.processError(
        error,
        'User registration failed',
        ErrorCodes.AUTH.INVALID_CREDENTIALS,
        {
          component: 'AuthEntity',
          operation: 'register',
          email: userData.email,
          userFriendlyMessage: 'Registration failed. Please check your information and try again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(allDevices: boolean = false): Promise<ApiResponse<{ message: string }>> {
    try {
      const endpoint = allDevices ? '/auth/logout/all' : '/auth/logout';
      const response = await apiClient.post<{ message: string }>(endpoint, {});

      if (response.success) {
        // Session cache cleared automatically by apiClient
        
        // Track logout
        trackAuthEvent('logout_success', {
          allDevices,
        });
      }

      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Logout operation failed',
        ErrorCodes.AUTH.LOGOUT_FAILED,
        {
          component: 'AuthEntity',
          operation: 'logout',
          allDevices,
          userFriendlyMessage: 'Unable to logout properly. Please try again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(): Promise<ApiResponse<AuthTokens>> {
    try {
      const response = await apiClient.post<AuthTokens>('/auth/refresh', {});

      if (response.success) {
        trackAuthEvent('token_refresh_success', {
          expiresAt: response.data.expiresAt,
        });
      }

      return response;
    } catch (error) {
      trackAuthEvent('token_refresh_failure', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const processedError = this.errorHandlingService.processError(
        error,
        'Token refresh failed',
        ErrorCodes.AUTH.TOKEN_REFRESH_FAILED,
        {
          component: 'AuthEntity',
          operation: 'refreshTokens',
          userFriendlyMessage: 'Your session has expired. Please login again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<ApiResponse<AuthSession>> {
    try {
      const response = await apiClient.get<AuthSession>('/auth/session');
      // Session caching handled automatically by apiClient
      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to retrieve current session',
        ErrorCodes.AUTH.SESSION_INVALID,
        {
          component: 'AuthEntity',
          operation: 'getCurrentSession',
          userFriendlyMessage: 'Unable to verify your session. Please login again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/password-reset/request', {
        email,
      });

      if (response.success) {
        trackAuthEvent('password_reset_requested', { email });
      }

      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Password reset request failed',
        ErrorCodes.AUTH.PASSWORD_RESET_FAILED,
        {
          component: 'AuthEntity',
          operation: 'requestPasswordReset',
          email,
          userFriendlyMessage: 'Unable to process password reset request. Please try again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/password-reset/confirm', {
        token,
        newPassword,
      });

      if (response.success) {
        trackAuthEvent('password_reset_completed', { token: token.substring(0, 8) + '...' });
      }

      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Password reset confirmation failed',
        ErrorCodes.AUTH.PASSWORD_RESET_FAILED,
        {
          component: 'AuthEntity',
          operation: 'confirmPasswordReset',
          tokenPrefix: token.substring(0, 8),
          userFriendlyMessage:
            'Password reset token is invalid or expired. Please request a new one.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/password-change', {
        currentPassword,
        newPassword,
      });

      if (response.success) {
        trackAuthEvent('password_changed', {});
      }

      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Password change operation failed',
        ErrorCodes.AUTH.PASSWORD_CHANGE_FAILED,
        {
          component: 'AuthEntity',
          operation: 'changePassword',
          userFriendlyMessage:
            'Unable to change password. Please verify your current password and try again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Setup two-factor authentication
   */
  async setup2FA(): Promise<ApiResponse<TwoFactorSetup>> {
    try {
      const response = await apiClient.post<TwoFactorSetup>('/auth/2fa/setup', {});

      if (response.success) {
        trackAuthEvent('2fa_setup_initiated', {});
      }

      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Two-factor authentication setup failed',
        ErrorCodes.SECURITY.SECURITY_VIOLATION,
        {
          component: 'AuthEntity',
          operation: 'setup2FA',
          userFriendlyMessage: 'Unable to setup two-factor authentication. Please try again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Confirm two-factor authentication setup
   */
  async confirm2FA(
    setupToken: string,
    verificationCode: string
  ): Promise<ApiResponse<{ message: string; backupCodes: string[] }>> {
    try {
      const response = await apiClient.post<{ message: string; backupCodes: string[] }>(
        '/auth/2fa/confirm',
        {
          setupToken,
          verificationCode,
        }
      );

      if (response.success) {
        trackAuthEvent('2fa_enabled', {});
      }

      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Two-factor authentication confirmation failed',
        ErrorCodes.SECURITY.TWO_FACTOR_VERIFICATION_FAILED,
        {
          component: 'AuthEntity',
          operation: 'confirm2FA',
          setupToken: setupToken.substring(0, 8) + '...',
          userFriendlyMessage: 'Invalid verification code. Please try again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disable2FA(verificationCode: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/2fa/disable', {
        verificationCode,
      });

      if (response.success) {
        trackAuthEvent('2fa_disabled', {});
      }

      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Two-factor authentication disable failed',
        ErrorCodes.SECURITY.TWO_FACTOR_DISABLE_FAILED,
        {
          component: 'AuthEntity',
          operation: 'disable2FA',
          userFriendlyMessage:
            'Unable to disable two-factor authentication. Please verify your code and try again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Get user security settings
   */
  async getSecuritySettings(): Promise<ApiResponse<SecuritySettings>> {
    try {
      const response = await apiClient.get<SecuritySettings>('/auth/security-settings');
      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to retrieve security settings',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'AuthEntity',
          operation: 'getSecuritySettings',
          userFriendlyMessage: 'Unable to load security settings. Please try again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(
    settings: Partial<SecuritySettings>
  ): Promise<ApiResponse<SecuritySettings>> {
    try {
      const response = await apiClient.put<SecuritySettings>('/auth/security-settings', settings);

      if (response.success) {
        trackAuthEvent('security_settings_updated', {
          updatedFields: Object.keys(settings),
        });
      }

      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to update security settings',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'AuthEntity',
          operation: 'updateSecuritySettings',
          updatedFields: Object.keys(settings),
          userFriendlyMessage:
            'Unable to save security settings. Please check your inputs and try again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Get login history
   */
  async getLoginHistory(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<LoginAttempt[]>> {
    try {
      const response = await apiClient.get<LoginAttempt[]>(
        `/auth/login-history?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to retrieve login history',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'AuthEntity',
          operation: 'getLoginHistory',
          page,
          limit,
          userFriendlyMessage: 'Unable to load login history. Please try again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Get active device sessions
   */
  async getDeviceSessions(): Promise<ApiResponse<DeviceSession[]>> {
    try {
      const response = await apiClient.get<DeviceSession[]>('/auth/sessions');
      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to retrieve device sessions',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'AuthEntity',
          operation: 'getDeviceSessions',
          userFriendlyMessage: 'Unable to load active sessions. Please try again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Revoke specific device session
   */
  async revokeDeviceSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/auth/sessions/${sessionId}`);

      if (response.success) {
        trackAuthEvent('device_session_revoked', { sessionId });
      }

      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to revoke device session',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: 'AuthEntity',
          operation: 'revokeDeviceSession',
          sessionId,
          userFriendlyMessage: 'Unable to revoke session. Please try again.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/verify-email', { token });

      if (response.success) {
        trackAuthEvent('email_verified', { token: token.substring(0, 8) + '...' });
      }

      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Email verification failed',
        ErrorCodes.AUTH.EMAIL_VERIFICATION_FAILED,
        {
          component: 'AuthEntity',
          operation: 'verifyEmail',
          tokenPrefix: token.substring(0, 8),
          userFriendlyMessage:
            'Email verification token is invalid or expired. Please request a new verification email.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/resend-verification', {});

      if (response.success) {
        trackAuthEvent('email_verification_resent', {});
      }

      return response;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to resend email verification',
        ErrorCodes.AUTH.EMAIL_VERIFICATION_FAILED,
        {
          component: 'AuthEntity',
          operation: 'resendEmailVerification',
          userFriendlyMessage: 'Unable to send verification email. Please try again later.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Check if session is valid
   */
  async validateSession(): Promise<boolean> {
    try {
      const response = await apiClient.get<{ valid: boolean }>('/auth/validate');
      if (response.success) {
        return response.data.valid === true;
      }
      return false;
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        'Session validation failed',
        ErrorCodes.AUTH.SESSION_INVALID,
        {
          component: 'AuthEntity',
          operation: 'validateSession',
          userFriendlyMessage: 'Unable to validate session. Please login again.',
        }
      );
      return false;
    }
  }

  /**
   * Get cached session if available
   * Note: Session caching is now handled automatically by apiClient
   */
  getCachedSession(): AuthSession | null {
    // Session caching is handled automatically by apiClient
    // This method is kept for backward compatibility but returns null
    return null;
  }

  /**
   * Clear session cache
   * Note: Session cache clearing is now handled automatically by apiClient
   */
  clearSessionCache(): void {
    // Session cache clearing is handled automatically by apiClient
    // This method is kept for backward compatibility
  }
}

// Export singleton instance
export const authEntity = AuthEntity.getInstance();
