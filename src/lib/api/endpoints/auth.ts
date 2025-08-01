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

export const authApi = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<SessionData>> {
    return apiClient.post<SessionData>('/auth/login', credentials);
  },

  async register(userData: RegisterUserData): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/register', userData);
  },

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/logout', {});
  },

  async refreshToken(): Promise<ApiResponse<{ token: string; expiresAt: string }>> {
    return apiClient.post<{ token: string; expiresAt: string }>('/auth/refresh', {});
  },

  async getSession(): Promise<ApiResponse<SessionData>> {
    return apiClient.get<SessionData>('/auth/session');
  },

  async requestPasswordReset(data: { email: string }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/password-reset', data);
  },

  async confirmPasswordReset(data: {
    token: string;
    password: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/password-reset/confirm', data);
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/change-password', data);
  },

  // Two-Factor Authentication
  async enable2FA(): Promise<
    ApiResponse<{ qrCode?: string; backupCodes?: string[]; message: string }>
  > {
    return apiClient.post<{ qrCode?: string; backupCodes?: string[]; message: string }>(
      '/auth/2fa/enable',
      {}
    );
  },

  async verify2FA(data: {
    token: string;
  }): Promise<ApiResponse<{ verified: boolean; message: string }>> {
    return apiClient.post<{ verified: boolean; message: string }>('/auth/2fa/verify', data);
  },

  async disable2FA(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>('/auth/2fa');
  },

  // Session Management
  async getSessions(): Promise<
    ApiResponse<
      Array<{
        id: string;
        device: string;
        location: string;
        lastActivity: string;
        current: boolean;
      }>
    >
  > {
    return apiClient.get('/auth/sessions');
  },

  async revokeSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/auth/sessions/${sessionId}`);
  },

  async revokeAllSessions(): Promise<ApiResponse<{ message: string; count: number }>> {
    return apiClient.delete<{ message: string; count: number }>('/auth/sessions');
  },
};
