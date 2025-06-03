/**
 * PosalPro MVP2 - useAuth Hook
 * React hook for authentication operations with session management
 * Integrates with AuthEntity and provides loading states, error handling
 */

import {
  authEntity,
  type AuthSession,
  type AuthTokens,
  type DeviceSession,
  type LoginAttempt,
  type LoginCredentials,
  type RegisterUserData,
  type SecuritySettings,
  type TwoFactorSetup,
} from '@/lib/entities/auth';
import { useCallback, useEffect, useState } from 'react';

interface UseAuthState {
  session: AuthSession | null;
  tokens: AuthTokens | null;
  securitySettings: SecuritySettings | null;
  loginHistory: LoginAttempt[];
  deviceSessions: DeviceSession[];
  twoFactorSetup: TwoFactorSetup | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface UseAuthActions {
  // Authentication operations
  login: (
    credentials: LoginCredentials
  ) => Promise<{ session: AuthSession; tokens: AuthTokens } | null>;
  register: (userData: RegisterUserData) => Promise<{ message: string; userId?: string } | null>;
  logout: (allDevices?: boolean) => Promise<boolean>;
  refreshTokens: () => Promise<AuthTokens | null>;

  // Session management
  getCurrentSession: () => Promise<AuthSession | null>;
  validateSession: () => Promise<boolean>;
  getCachedSession: () => AuthSession | null;
  clearSessionCache: () => void;

  // Password management
  requestPasswordReset: (email: string) => Promise<boolean>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;

  // Two-factor authentication
  setup2FA: () => Promise<TwoFactorSetup | null>;
  confirm2FA: (
    setupToken: string,
    verificationCode: string
  ) => Promise<{ message: string; backupCodes: string[] } | null>;
  disable2FA: (verificationCode: string) => Promise<boolean>;

  // Security management
  getSecuritySettings: () => Promise<SecuritySettings | null>;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<SecuritySettings | null>;
  getLoginHistory: (page?: number, limit?: number) => Promise<LoginAttempt[]>;
  getDeviceSessions: () => Promise<DeviceSession[]>;
  revokeDeviceSession: (sessionId: string) => Promise<boolean>;

  // Email verification
  verifyEmail: (token: string) => Promise<boolean>;
  resendEmailVerification: () => Promise<boolean>;

  // State management
  clearError: () => void;
  refreshAuth: () => Promise<void>;
}

export const useAuth = (): UseAuthState & UseAuthActions => {
  const [state, setState] = useState<UseAuthState>({
    session: null,
    tokens: null,
    securitySettings: null,
    loginHistory: [],
    deviceSessions: [],
    twoFactorSetup: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Authentication Operations
  const login = useCallback(
    async (
      credentials: LoginCredentials
    ): Promise<{ session: AuthSession; tokens: AuthTokens } | null> => {
      try {
        setLoading(true);
        clearError();

        const response = await authEntity.login(credentials);

        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            session: response.data!.session,
            tokens: response.data!.tokens,
            isAuthenticated: true,
            loading: false,
          }));
          return response.data;
        } else {
          setError(response.message || 'Login failed');
          return null;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return null;
      }
    },
    [setLoading, clearError, setError]
  );

  const register = useCallback(
    async (userData: RegisterUserData): Promise<{ message: string; userId?: string } | null> => {
      try {
        setLoading(true);
        clearError();

        const response = await authEntity.register(userData);

        if (response.success && response.data) {
          setState(prev => ({ ...prev, loading: false }));
          return response.data;
        } else {
          setError(response.message || 'Registration failed');
          return null;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return null;
      }
    },
    [setLoading, clearError, setError]
  );

  const logout = useCallback(
    async (allDevices: boolean = false): Promise<boolean> => {
      try {
        setLoading(true);
        clearError();

        const response = await authEntity.logout(allDevices);

        if (response.success) {
          setState(prev => ({
            ...prev,
            session: null,
            tokens: null,
            isAuthenticated: false,
            loading: false,
          }));
          return true;
        } else {
          setError(response.message || 'Logout failed');
          return false;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return false;
      }
    },
    [setLoading, clearError, setError]
  );

  const refreshTokens = useCallback(async (): Promise<AuthTokens | null> => {
    try {
      setLoading(true);
      clearError();

      const response = await authEntity.refreshTokens();

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          tokens: response.data!,
          loading: false,
        }));
        return response.data;
      } else {
        setError(response.message || 'Token refresh failed');
        return null;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      return null;
    }
  }, [setLoading, clearError, setError]);

  // Session Management
  const getCurrentSession = useCallback(async (): Promise<AuthSession | null> => {
    try {
      setLoading(true);
      clearError();

      const response = await authEntity.getCurrentSession();

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          session: response.data!,
          isAuthenticated: true,
          loading: false,
        }));
        return response.data;
      } else {
        setState(prev => ({
          ...prev,
          session: null,
          isAuthenticated: false,
          loading: false,
        }));
        return null;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      return null;
    }
  }, [setLoading, clearError, setError]);

  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const isValid = await authEntity.validateSession();
      setState(prev => ({ ...prev, isAuthenticated: isValid }));
      return isValid;
    } catch (error) {
      setState(prev => ({ ...prev, isAuthenticated: false }));
      return false;
    }
  }, []);

  const getCachedSession = useCallback((): AuthSession | null => {
    return authEntity.getCachedSession();
  }, []);

  const clearSessionCache = useCallback((): void => {
    authEntity.clearSessionCache();
    setState(prev => ({ ...prev, session: null, isAuthenticated: false }));
  }, []);

  // Password Management
  const requestPasswordReset = useCallback(
    async (email: string): Promise<boolean> => {
      try {
        setLoading(true);
        clearError();

        const response = await authEntity.requestPasswordReset(email);

        if (response.success) {
          setState(prev => ({ ...prev, loading: false }));
          return true;
        } else {
          setError(response.message || 'Password reset request failed');
          return false;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return false;
      }
    },
    [setLoading, clearError, setError]
  );

  const confirmPasswordReset = useCallback(
    async (token: string, newPassword: string): Promise<boolean> => {
      try {
        setLoading(true);
        clearError();

        const response = await authEntity.confirmPasswordReset(token, newPassword);

        if (response.success) {
          setState(prev => ({ ...prev, loading: false }));
          return true;
        } else {
          setError(response.message || 'Password reset confirmation failed');
          return false;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return false;
      }
    },
    [setLoading, clearError, setError]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      try {
        setLoading(true);
        clearError();

        const response = await authEntity.changePassword(currentPassword, newPassword);

        if (response.success) {
          setState(prev => ({ ...prev, loading: false }));
          return true;
        } else {
          setError(response.message || 'Password change failed');
          return false;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return false;
      }
    },
    [setLoading, clearError, setError]
  );

  // Two-Factor Authentication
  const setup2FA = useCallback(async (): Promise<TwoFactorSetup | null> => {
    try {
      setLoading(true);
      clearError();

      const response = await authEntity.setup2FA();

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          twoFactorSetup: response.data!,
          loading: false,
        }));
        return response.data;
      } else {
        setError(response.message || '2FA setup failed');
        return null;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      return null;
    }
  }, [setLoading, clearError, setError]);

  const confirm2FA = useCallback(
    async (
      setupToken: string,
      verificationCode: string
    ): Promise<{ message: string; backupCodes: string[] } | null> => {
      try {
        setLoading(true);
        clearError();

        const response = await authEntity.confirm2FA(setupToken, verificationCode);

        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            twoFactorSetup: null,
            loading: false,
          }));
          return response.data;
        } else {
          setError(response.message || '2FA confirmation failed');
          return null;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return null;
      }
    },
    [setLoading, clearError, setError]
  );

  const disable2FA = useCallback(
    async (verificationCode: string): Promise<boolean> => {
      try {
        setLoading(true);
        clearError();

        const response = await authEntity.disable2FA(verificationCode);

        if (response.success) {
          setState(prev => ({ ...prev, loading: false }));
          return true;
        } else {
          setError(response.message || '2FA disable failed');
          return false;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return false;
      }
    },
    [setLoading, clearError, setError]
  );

  // Security Management
  const getSecuritySettings = useCallback(async (): Promise<SecuritySettings | null> => {
    try {
      setLoading(true);
      clearError();

      const response = await authEntity.getSecuritySettings();

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          securitySettings: response.data!,
          loading: false,
        }));
        return response.data;
      } else {
        setError(response.message || 'Failed to get security settings');
        return null;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      return null;
    }
  }, [setLoading, clearError, setError]);

  const updateSecuritySettings = useCallback(
    async (settings: Partial<SecuritySettings>): Promise<SecuritySettings | null> => {
      try {
        setLoading(true);
        clearError();

        const response = await authEntity.updateSecuritySettings(settings);

        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            securitySettings: response.data!,
            loading: false,
          }));
          return response.data;
        } else {
          setError(response.message || 'Failed to update security settings');
          return null;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return null;
      }
    },
    [setLoading, clearError, setError]
  );

  const getLoginHistory = useCallback(
    async (page: number = 1, limit: number = 20): Promise<LoginAttempt[]> => {
      try {
        setLoading(true);
        clearError();

        const response = await authEntity.getLoginHistory(page, limit);

        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            loginHistory: response.data!,
            loading: false,
          }));
          return response.data;
        } else {
          setError(response.message || 'Failed to get login history');
          return [];
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return [];
      }
    },
    [setLoading, clearError, setError]
  );

  const getDeviceSessions = useCallback(async (): Promise<DeviceSession[]> => {
    try {
      setLoading(true);
      clearError();

      const response = await authEntity.getDeviceSessions();

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          deviceSessions: response.data!,
          loading: false,
        }));
        return response.data;
      } else {
        setError(response.message || 'Failed to get device sessions');
        return [];
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      return [];
    }
  }, [setLoading, clearError, setError]);

  const revokeDeviceSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      try {
        setLoading(true);
        clearError();

        const response = await authEntity.revokeDeviceSession(sessionId);

        if (response.success) {
          setState(prev => ({
            ...prev,
            deviceSessions: prev.deviceSessions.filter(session => session.id !== sessionId),
            loading: false,
          }));
          return true;
        } else {
          setError(response.message || 'Failed to revoke device session');
          return false;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return false;
      }
    },
    [setLoading, clearError, setError]
  );

  // Email Verification
  const verifyEmail = useCallback(
    async (token: string): Promise<boolean> => {
      try {
        setLoading(true);
        clearError();

        const response = await authEntity.verifyEmail(token);

        if (response.success) {
          setState(prev => ({ ...prev, loading: false }));
          return true;
        } else {
          setError(response.message || 'Email verification failed');
          return false;
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        return false;
      }
    },
    [setLoading, clearError, setError]
  );

  const resendEmailVerification = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      clearError();

      const response = await authEntity.resendEmailVerification();

      if (response.success) {
        setState(prev => ({ ...prev, loading: false }));
        return true;
      } else {
        setError(response.message || 'Failed to resend email verification');
        return false;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      return false;
    }
  }, [setLoading, clearError, setError]);

  // Utility Operations
  const refreshAuth = useCallback(async (): Promise<void> => {
    await getCurrentSession();
  }, [getCurrentSession]);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const cachedSession = getCachedSession();
      if (cachedSession) {
        setState(prev => ({
          ...prev,
          session: cachedSession,
          isAuthenticated: true,
        }));
      } else {
        await getCurrentSession();
      }
    };

    initializeAuth();
  }, [getCachedSession, getCurrentSession]);

  return {
    // State
    ...state,

    // Actions
    login,
    register,
    logout,
    refreshTokens,
    getCurrentSession,
    validateSession,
    getCachedSession,
    clearSessionCache,
    requestPasswordReset,
    confirmPasswordReset,
    changePassword,
    setup2FA,
    confirm2FA,
    disable2FA,
    getSecuritySettings,
    updateSecuritySettings,
    getLoginHistory,
    getDeviceSessions,
    revokeDeviceSession,
    verifyEmail,
    resendEmailVerification,
    clearError,
    refreshAuth,
  };
};
