/**
 * PosalPro MVP2 - Auth Entity
 * Authentication entity class with session management and security operations
 * Integrates with NextAuth.js and existing auth infrastructure
 */

import { apiClient, type ApiResponse } from '@/lib/api/client';
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
  private static instance: AuthEntity;
  private sessionCache = new Map<string, AuthSession>();
  private readonly SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): AuthEntity {
    if (!AuthEntity.instance) {
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

      if (response.success && response.data) {
        // Cache session
        this.cacheSession(response.data.session);

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

      console.error('Login failed:', error);
      throw error;
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

      console.error('Registration failed:', error);
      throw error;
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
        // Clear session cache
        this.sessionCache.clear();

        // Track logout
        trackAuthEvent('logout_success', {
          allDevices,
        });
      }

      return response;
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
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
          expiresAt: response.data?.expiresAt,
        });
      }

      return response;
    } catch (error) {
      trackAuthEvent('token_refresh_failure', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<ApiResponse<AuthSession>> {
    try {
      const response = await apiClient.get<AuthSession>('/auth/session');

      if (response.success && response.data) {
        this.cacheSession(response.data);
      }

      return response;
    } catch (error) {
      console.error('Failed to get current session:', error);
      throw error;
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
      console.error('Password reset request failed:', error);
      throw error;
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
      console.error('Password reset confirmation failed:', error);
      throw error;
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
      console.error('Password change failed:', error);
      throw error;
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
      console.error('2FA setup failed:', error);
      throw error;
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
      console.error('2FA confirmation failed:', error);
      throw error;
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
      console.error('2FA disable failed:', error);
      throw error;
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
      console.error('Failed to get security settings:', error);
      throw error;
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
      console.error('Failed to update security settings:', error);
      throw error;
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
      console.error('Failed to get login history:', error);
      throw error;
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
      console.error('Failed to get device sessions:', error);
      throw error;
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
      console.error('Failed to revoke device session:', error);
      throw error;
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
      console.error('Email verification failed:', error);
      throw error;
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
      console.error('Failed to resend email verification:', error);
      throw error;
    }
  }

  /**
   * Check if session is valid
   */
  async validateSession(): Promise<boolean> {
    try {
      const response = await apiClient.get<{ valid: boolean }>('/auth/validate');
      return response.success && response.data?.valid === true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  /**
   * Get cached session if available
   */
  getCachedSession(): AuthSession | null {
    // Return the first (most recent) cached session
    const sessions = Array.from(this.sessionCache.values());
    return sessions.length > 0 ? sessions[0] : null;
  }

  /**
   * Clear session cache
   */
  clearSessionCache(): void {
    this.sessionCache.clear();
  }

  // Private helper methods
  private cacheSession(session: AuthSession): void {
    this.sessionCache.set(session.id, session);

    // Auto-clear cache after TTL
    setTimeout(() => {
      this.sessionCache.delete(session.id);
    }, this.SESSION_CACHE_TTL);
  }
}

// Export singleton instance
export const authEntity = AuthEntity.getInstance();
