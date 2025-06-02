/**
 * Authentication API Endpoints
 * Type-safe authentication operations with enhanced API client integration
 */

import { UserType } from '@/types';
import { apiClient, type ApiResponse } from '../client';

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserType;
  rememberMe?: boolean;
}

export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserType;
  department?: string;
}

export interface SessionData {
  userId: string;
  email: string;
  role: UserType;
  permissions: string[];
  lastActivity: Date;
  sessionExpiry: Date;
  department?: string;
}

// Development mock data (will be replaced with real API responses)
const mockSession: SessionData = {
  userId: 'user-123',
  email: 'test@example.com',
  role: UserType.PROPOSAL_MANAGER,
  permissions: ['read', 'write', 'delete'],
  lastActivity: new Date(),
  sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  department: 'Sales',
};

export const authApi = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<SessionData>> {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate login validation
      if (credentials.email && credentials.password) {
        return {
          data: {
            ...mockSession,
            role: credentials.role, // Use the selected role
          },
          success: true,
          message: 'Login successful',
        };
      } else {
        throw new Error('Invalid credentials');
      }
    }

    return apiClient.post<SessionData>('/auth/login', credentials);
  },

  async register(userData: RegisterUserData): Promise<ApiResponse<{ message: string }>> {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        data: { message: 'Registration successful. Please check your email for verification.' },
        success: true,
        message: 'Registration successful',
      };
    }

    return apiClient.post<{ message: string }>('/auth/register', userData);
  },

  async logout(): Promise<ApiResponse<{ message: string }>> {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        data: { message: 'Logout successful' },
        success: true,
        message: 'Logout successful',
      };
    }

    return apiClient.post<{ message: string }>('/auth/logout', {});
  },

  async refreshToken(): Promise<ApiResponse<{ token: string; expiresAt: string }>> {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        data: {
          token: 'new-mock-token-' + Date.now(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        success: true,
        message: 'Token refreshed successfully',
      };
    }

    return apiClient.post<{ token: string; expiresAt: string }>('/auth/refresh', {});
  },

  async getSession(): Promise<ApiResponse<SessionData>> {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        data: mockSession,
        success: true,
        message: 'Session retrieved successfully',
      };
    }

    return apiClient.get<SessionData>('/auth/session');
  },

  async requestPasswordReset(data: { email: string }): Promise<ApiResponse<{ message: string }>> {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return {
        data: { message: 'Password reset email sent successfully' },
        success: true,
        message: 'Reset email sent',
      };
    }

    return apiClient.post<{ message: string }>('/auth/password-reset', data);
  },

  async confirmPasswordReset(data: {
    token: string;
    password: string;
  }): Promise<ApiResponse<{ message: string }>> {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        data: { message: 'Password reset completed successfully' },
        success: true,
        message: 'Password reset successful',
      };
    }

    return apiClient.post<{ message: string }>('/auth/password-reset/confirm', data);
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        data: { message: 'Password changed successfully' },
        success: true,
        message: 'Password updated',
      };
    }

    return apiClient.post<{ message: string }>('/auth/change-password', data);
  },

  // Two-Factor Authentication
  async enable2FA(): Promise<
    ApiResponse<{ qrCode?: string; backupCodes?: string[]; message: string }>
  > {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        data: {
          qrCode: 'data:image/png;base64,mock-qr-code-data',
          backupCodes: ['123456', '789012', '345678', '901234', '567890'],
          message: '2FA enabled successfully',
        },
        success: true,
        message: '2FA setup complete',
      };
    }

    return apiClient.post<{ qrCode?: string; backupCodes?: string[]; message: string }>(
      '/auth/2fa/enable',
      {}
    );
  },

  async verify2FA(data: {
    token: string;
  }): Promise<ApiResponse<{ verified: boolean; message: string }>> {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        data: {
          verified: data.token === '123456', // Mock verification
          message: data.token === '123456' ? '2FA verified successfully' : 'Invalid token',
        },
        success: true,
        message: '2FA verification complete',
      };
    }

    return apiClient.post<{ verified: boolean; message: string }>('/auth/2fa/verify', data);
  },

  async disable2FA(): Promise<ApiResponse<{ message: string }>> {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 600));
      return {
        data: { message: '2FA disabled successfully' },
        success: true,
        message: '2FA disabled',
      };
    }

    return apiClient.delete<{ message: string }>('/auth/2fa');
  },

  // Session Management
  async getSessions(): Promise<
    ApiResponse<
      {
        id: string;
        device: string;
        location: string;
        lastActivity: string;
        current: boolean;
      }[]
    >
  > {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 400));
      const mockSessions = [
        {
          id: 'session-1',
          device: 'Chrome on MacOS',
          location: 'San Francisco, CA',
          lastActivity: new Date().toISOString(),
          current: true,
        },
        {
          id: 'session-2',
          device: 'Safari on iPhone',
          location: 'San Francisco, CA',
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          current: false,
        },
      ];

      return {
        data: mockSessions,
        success: true,
        message: 'Sessions retrieved successfully',
      };
    }

    return apiClient.get('/auth/sessions');
  },

  async revokeSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        data: { message: 'Session revoked successfully' },
        success: true,
        message: 'Session revoked',
      };
    }

    return apiClient.delete<{ message: string }>(`/auth/sessions/${sessionId}`);
  },

  async revokeAllSessions(): Promise<ApiResponse<{ message: string; count: number }>> {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        data: { message: 'All other sessions revoked successfully', count: 3 },
        success: true,
        message: 'Sessions revoked',
      };
    }

    return apiClient.delete<{ message: string; count: number }>('/auth/sessions');
  },
};
