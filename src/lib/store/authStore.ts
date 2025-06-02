/**
 * Authentication Store
 * Zustand-based global authentication state management
 */

import { authApi, type LoginCredentials, type SessionData } from '@/lib/api/endpoints/auth';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: SessionData | null;
  sessionExpiry: Date | null;

  // Authentication actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearAuth: () => void;

  // Session management
  checkSessionValidity: () => boolean;
  extendSession: () => void;
  getTimeUntilExpiry: () => number;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: false,
      user: null,
      sessionExpiry: null,

      // Login action
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });

        try {
          const response = await authApi.login(credentials);

          if (!response.success) {
            throw new Error(response.message || 'Login failed');
          }

          const userData = response.data;
          const sessionExpiry = new Date(userData.sessionExpiry);

          set({
            isAuthenticated: true,
            isLoading: false,
            user: userData,
            sessionExpiry,
          });

          // Set up automatic session refresh
          const timeUntilExpiry = sessionExpiry.getTime() - Date.now();
          const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000); // Refresh 5 minutes before expiry

          setTimeout(() => {
            const { refreshSession } = get();
            refreshSession();
          }, refreshTime);
        } catch (error) {
          set({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            sessionExpiry: null,
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true });

        try {
          await authApi.logout();
        } catch (error) {
          console.warn('Logout API call failed:', error);
          // Continue with local logout even if API fails
        } finally {
          set({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            sessionExpiry: null,
          });
        }
      },

      // Refresh session
      refreshSession: async () => {
        const { isAuthenticated, user } = get();

        if (!isAuthenticated || !user) {
          return;
        }

        try {
          const response = await authApi.getSession();

          if (!response.success) {
            throw new Error(response.message || 'Session refresh failed');
          }

          const userData = response.data;
          const sessionExpiry = new Date(userData.sessionExpiry);

          set({
            user: userData,
            sessionExpiry,
          });

          // Schedule next refresh
          const timeUntilExpiry = sessionExpiry.getTime() - Date.now();
          const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000);

          setTimeout(() => {
            const { refreshSession } = get();
            refreshSession();
          }, refreshTime);
        } catch (error) {
          console.error('Session refresh failed:', error);
          // Auto-logout on refresh failure
          get().clearAuth();
        }
      },

      // Clear authentication state
      clearAuth: () => {
        set({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          sessionExpiry: null,
        });
      },

      // Check if session is still valid
      checkSessionValidity: () => {
        const { sessionExpiry, isAuthenticated } = get();

        if (!isAuthenticated || !sessionExpiry) {
          return false;
        }

        const now = Date.now();
        const expiry = sessionExpiry.getTime();

        if (now >= expiry) {
          get().clearAuth();
          return false;
        }

        return true;
      },

      // Extend session activity
      extendSession: () => {
        const { sessionExpiry, isAuthenticated } = get();

        if (!isAuthenticated || !sessionExpiry) {
          return;
        }

        // Extend session by updating last activity
        const newExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

        set({
          sessionExpiry: newExpiry,
          user: get().user
            ? {
                ...get().user!,
                lastActivity: new Date(),
                sessionExpiry: newExpiry,
              }
            : null,
        });
      },

      // Get time until session expiry (in milliseconds)
      getTimeUntilExpiry: () => {
        const { sessionExpiry } = get();

        if (!sessionExpiry) {
          return 0;
        }

        return Math.max(sessionExpiry.getTime() - Date.now(), 0);
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        sessionExpiry: state.sessionExpiry,
      }),
      // Handle rehydration
      onRehydrateStorage: () => state => {
        if (state) {
          // Check session validity on rehydration
          const isValid = state.checkSessionValidity();
          if (!isValid) {
            state.clearAuth();
          } else {
            // Set up session refresh timer
            const timeUntilExpiry = state.getTimeUntilExpiry();
            const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000);

            if (refreshTime > 0) {
              setTimeout(() => {
                state.refreshSession();
              }, refreshTime);
            }
          }
        }
      },
    }
  )
);

// Export useful selectors
export const useAuthUser = () => useAuthStore(state => state.user);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore(state => state.isLoading);

// Session management hooks
export const useSessionValidity = () => {
  const checkSessionValidity = useAuthStore(state => state.checkSessionValidity);
  const getTimeUntilExpiry = useAuthStore(state => state.getTimeUntilExpiry);

  return {
    isSessionValid: checkSessionValidity(),
    timeUntilExpiry: getTimeUntilExpiry(),
  };
};

// Auto-logout hook for session expiry warnings
export const useSessionWarning = (warningThreshold: number = 5 * 60 * 1000) => {
  const getTimeUntilExpiry = useAuthStore(state => state.getTimeUntilExpiry);
  const clearAuth = useAuthStore(state => state.clearAuth);

  const timeUntilExpiry = getTimeUntilExpiry();
  const showWarning = timeUntilExpiry > 0 && timeUntilExpiry <= warningThreshold;

  return {
    showWarning,
    timeUntilExpiry,
    logout: clearAuth,
  };
};
