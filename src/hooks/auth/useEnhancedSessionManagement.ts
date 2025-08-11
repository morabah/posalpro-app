/**
 * PosalPro MVP2 - Enhanced Session Management Hook
 * 🔧 PHASE 3: AUTHENTICATION & USER MANAGEMENT ENHANCEMENT
 *
 * Component Traceability Matrix Integration
 * User Stories: US-2.3 (Business Development Manager), Platform Foundation
 * Hypotheses: H4 (Cross-Department Coordination), Infrastructure for All Hypotheses
 * Test Cases: TC-H4-002, Infrastructure for All Test Cases
 *
 * Wireframe Reference: Supporting all authenticated screens
 * Performance: Advanced session optimization with caching
 * Analytics: Comprehensive session analytics and hypothesis validation
 */

'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { ApiResponseOptimizer } from '@/lib/performance/ApiResponseOptimizer';
import { getSession, signOut } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.3', 'Platform Foundation'],
  acceptanceCriteria: ['AC-2.3.1', 'AC-2.3.2', 'Platform Infrastructure'],
  methods: [
    'manageSession()',
    'trackUserActivity()',
    'handleSessionChanges()',
    'enforceTimeout()',
    'refreshSession()',
    'validateSession()',
    'monitorSessionHealth()',
    'optimizeSessionPerformance()',
  ],
  hypotheses: ['H4'],
  testCases: ['TC-H4-002'],
};

interface SessionMetrics {
  sessionDuration: number;
  activityCount: number;
  idleTime: number;
  refreshCount: number;
  lastActivity: number;
  sessionHealth: 'healthy' | 'warning' | 'critical';
  performanceScore: number;
  securityEvents: number;
  roleChanges: number;
  permissionValidations: number;
}

interface SessionWarningConfig {
  warningThreshold: number; // Minutes before expiry to show warning
  idleTimeout: number; // Minutes of inactivity before timeout
  extendDuration: number; // Minutes to extend session
  maxExtensions: number; // Maximum number of extensions allowed
}

interface EnhancedSessionState {
  isActive: boolean;
  isWarning: boolean;
  timeRemaining: number;
  lastActivity: number;
  sessionHealth: 'healthy' | 'warning' | 'critical';
  metrics: SessionMetrics;
  warningConfig: SessionWarningConfig;
}

const DEFAULT_WARNING_CONFIG: SessionWarningConfig = {
  warningThreshold: 5, // 5 minutes
  idleTimeout: 30, // 30 minutes
  extendDuration: 15, // 15 minutes
  maxExtensions: 3, // Maximum 3 extensions
};

export function useEnhancedSessionManagement(config: Partial<SessionWarningConfig> = {}) {
  const { isAuthenticated, isLoading, refreshSession: update } = useAuth();
  // Derive session via next-auth getSession() only when needed
  const [session, setLocalSession] = useState<Awaited<ReturnType<typeof getSession>> | null>(null);
  useEffect(() => {
    (async () => {
      const s = await getSession();
      setLocalSession(s);
    })();
  }, []);
  // Removed unused router
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { handleAsyncError } = useErrorHandler();
  const errorHandlingService = ErrorHandlingService.getInstance();
  const apiOptimizer = ApiResponseOptimizer.getInstance();

  // Session state
  const [sessionState, setSessionState] = useState<EnhancedSessionState>({
    isActive: false,
    isWarning: false,
    timeRemaining: 0,
    lastActivity: Date.now(),
    sessionHealth: 'healthy',
    metrics: {
      sessionDuration: 0,
      activityCount: 0,
      idleTime: 0,
      refreshCount: 0,
      lastActivity: Date.now(),
      sessionHealth: 'healthy',
      performanceScore: 100,
      securityEvents: 0,
      roleChanges: 0,
      permissionValidations: 0,
    },
    warningConfig: { ...DEFAULT_WARNING_CONFIG, ...config },
  });

  // Refs for timers and tracking
  const activityTimer = useRef<NodeJS.Timeout | null>(null);
  const warningTimer = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef<number>(Date.now());
  const extensionCount = useRef<number>(0);
  const lastHeartbeat = useRef<number>(Date.now());

  // Activity tracking
  const trackActivity = useCallback(
    (activityType: string, metadata: Record<string, unknown> = {}) => {
      const now = Date.now();

      setSessionState(prev => ({
        ...prev,
        lastActivity: now,
        metrics: {
          ...prev.metrics,
          activityCount: prev.metrics.activityCount + 1,
          lastActivity: now,
          idleTime: 0,
        },
      }));

      // Track activity analytics
      analytics(
        'session_activity',
        {
          activityType,
          sessionId: session?.user.id,
          sessionDuration: now - sessionStartTime.current,
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          componentMapping: COMPONENT_MAPPING,
          ...metadata,
        },
        'low'
      );

      lastHeartbeat.current = now;
    },
    [analytics, session?.user.id]
  );

  // Session refresh with optimization
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const startTime = Date.now();

      // Use API optimizer for session refresh
      const optimizedResult = await apiOptimizer.optimizeResponse(
        `session_refresh_${session?.user.id}`,
        async () => {
          const updatedSession = await update();
          return updatedSession;
        },
        {
          ttl: 60000, // Cache for 1 minute
          compress: true,
          trackPerformance: true,
        }
      );

      const refreshDuration = Date.now() - startTime;

      setSessionState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          refreshCount: prev.metrics.refreshCount + 1,
          performanceScore: Math.max(
            0,
            prev.metrics.performanceScore - (refreshDuration > 1000 ? 5 : 0)
          ),
        },
      }));

      // Track session refresh analytics
      analytics(
        'session_refresh',
        {
          success: true,
          duration: refreshDuration,
          fromCache: optimizedResult.fromCache,
          sessionId: session?.user.id,
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          componentMapping: COMPONENT_MAPPING,
        },
        'medium'
      );

      return true;
    } catch (error) {
      const standardError = errorHandlingService.processError(
        error,
        'Failed to refresh session',
        ErrorCodes.AUTH.SESSION_INVALID,
        {
          component: 'useEnhancedSessionManagement',
          operation: 'refreshSession',
          sessionId: session?.user.id,
          userFriendlyMessage: 'Session refresh failed. Please sign in again.',
        }
      );

      analytics(
        'session_refresh_error',
        {
          error: standardError.code,
          sessionId: session?.user.id,
          userStories: COMPONENT_MAPPING.userStories,
          componentMapping: COMPONENT_MAPPING,
        },
        'high'
      );

      return false;
    }
  }, [update, session?.user.id, analytics, errorHandlingService, apiOptimizer]);

  // Session extension
  const extendSession = useCallback(async (): Promise<boolean> => {
    if (extensionCount.current >= sessionState.warningConfig.maxExtensions) {
      analytics(
        'session_extension_denied',
        {
          reason: 'max_extensions_reached',
          extensionCount: extensionCount.current,
          sessionId: session?.user.id,
          componentMapping: COMPONENT_MAPPING,
        },
        'medium'
      );
      return false;
    }

    const success = await refreshSession();
    if (success) {
      extensionCount.current += 1;

      setSessionState(prev => ({
        ...prev,
        isWarning: false,
        timeRemaining: prev.warningConfig.extendDuration * 60 * 1000,
      }));

      analytics(
        'session_extended',
        {
          extensionNumber: extensionCount.current,
          extensionDuration: sessionState.warningConfig.extendDuration,
          sessionId: session?.user.id,
          userStories: COMPONENT_MAPPING.userStories,
          componentMapping: COMPONENT_MAPPING,
        },
        'medium'
      );
    }

    return success;
  }, [refreshSession, sessionState.warningConfig, session?.user.id, analytics]);

  // Session logout with cleanup
  const logout = useCallback(
    async (reason: string = 'user_initiated') => {
      try {
        const sessionDuration = Date.now() - sessionStartTime.current;

        // Track logout analytics
        analytics(
          'session_logout',
          {
            reason,
            sessionDuration,
            activityCount: sessionState.metrics.activityCount,
            extensionCount: extensionCount.current,
            sessionId: session?.user.id,
            userStories: COMPONENT_MAPPING.userStories,
            componentMapping: COMPONENT_MAPPING,
          },
          'medium'
        );

        // Clear timers
        if (activityTimer.current) {
          clearInterval(activityTimer.current);
          activityTimer.current = null;
        }
        if (warningTimer.current) {
          clearTimeout(warningTimer.current);
          warningTimer.current = null;
        }

        // Perform logout
        await signOut({ callbackUrl: '/auth/login' });
      } catch (error) {
        handleAsyncError(error, 'Failed to logout', {
          component: 'useEnhancedSessionManagement',
          operation: 'logout',
          reason,
        });
      }
    },
    [sessionState.metrics, session?.user.id, analytics, handleAsyncError]
  );

  // Session health monitoring
  const updateSessionHealth = useCallback(() => {
    const now = Date.now();
    const idleTime = now - sessionState.lastActivity;
    const sessionDuration = now - sessionStartTime.current;

    let health: 'healthy' | 'warning' | 'critical' = 'healthy';
    let performanceScore = sessionState.metrics.performanceScore;

    // Check idle time
    if (idleTime > sessionState.warningConfig.idleTimeout * 60 * 1000 * 0.8) {
      health = 'warning';
      performanceScore = Math.max(0, performanceScore - 10);
    }

    if (idleTime > sessionState.warningConfig.idleTimeout * 60 * 1000) {
      health = 'critical';
      performanceScore = Math.max(0, performanceScore - 20);
    }

    // Check session duration
    if (sessionDuration > 8 * 60 * 60 * 1000) {
      // 8 hours
      health = health === 'critical' ? 'critical' : 'warning';
      performanceScore = Math.max(0, performanceScore - 5);
    }

    setSessionState(prev => ({
      ...prev,
      sessionHealth: health,
      metrics: {
        ...prev.metrics,
        sessionHealth: health,
        performanceScore,
        sessionDuration,
        idleTime,
      },
    }));

    // Track health changes
    if (health !== sessionState.sessionHealth) {
      analytics(
        'session_health_change',
        {
          oldHealth: sessionState.sessionHealth,
          newHealth: health,
          idleTime,
          sessionDuration,
          sessionId: session?.user.id,
          componentMapping: COMPONENT_MAPPING,
        },
        'medium'
      );
    }
  }, [sessionState, session?.user.id, analytics]);

  // Activity monitoring setup
  useEffect(() => {
    if (isAuthenticated && session) {
      setSessionState(prev => ({ ...prev, isActive: true }));
      sessionStartTime.current = Date.now();

      // Set up activity monitoring
      activityTimer.current = setInterval(() => {
        updateSessionHealth();
      }, 60000); // Check every minute

      // Track session start
      analytics(
        'session_started',
        {
          sessionId: session.user.id,
          userRoles: session.user.roles,
          userDepartment: session.user.department,
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
          componentMapping: COMPONENT_MAPPING,
        },
        'high'
      );

      return () => {
        if (activityTimer.current) {
          clearInterval(activityTimer.current);
          activityTimer.current = null;
        }
      };
    } else {
      setSessionState(prev => ({ ...prev, isActive: false }));
    }
  }, [isAuthenticated, session, analytics, updateSessionHealth]);

  // Session warning management
  useEffect(() => {
    if (sessionState.sessionHealth === 'warning' && !sessionState.isWarning) {
      setSessionState(prev => ({ ...prev, isWarning: true }));

      // Set warning timer
      warningTimer.current = setTimeout(
        () => {
          if (sessionState.sessionHealth === 'critical') {
            logout('session_timeout');
          }
        },
        sessionState.warningConfig.warningThreshold * 60 * 1000
      );

      analytics(
        'session_warning_triggered',
        {
          timeRemaining: sessionState.warningConfig.warningThreshold,
          sessionId: session?.user.id,
          componentMapping: COMPONENT_MAPPING,
        },
        'medium'
      );
    }

    return () => {
      if (warningTimer.current) {
        clearTimeout(warningTimer.current);
        warningTimer.current = null;
      }
    };
  }, [
    sessionState.sessionHealth,
    sessionState.isWarning,
    sessionState.warningConfig,
    session?.user.id,
    analytics,
    logout,
  ]);

  // Automatic session validation
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const currentSession = await getSession();

      if (!currentSession) {
        logout('session_invalid');
        return false;
      }

      // Validate session permissions and roles (values are guaranteed by auth layer typings)
      const hasValidRoles = currentSession.user.roles.length > 0;
      const hasValidPermissions = currentSession.user.permissions.length > 0;

      if (!hasValidRoles || !hasValidPermissions) {
        analytics(
          'session_validation_failed',
          {
            reason: 'invalid_permissions',
            hasRoles: hasValidRoles,
            hasPermissions: hasValidPermissions,
            sessionId: session?.user.id,
            componentMapping: COMPONENT_MAPPING,
          },
          'high'
        );

        logout('invalid_permissions');
        return false;
      }

      setSessionState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          permissionValidations: prev.metrics.permissionValidations + 1,
        },
      }));

      return true;
    } catch (error) {
      handleAsyncError(error, 'Session validation failed', {
        component: 'useEnhancedSessionManagement',
        operation: 'validateSession',
      });
      return false;
    }
  }, [session?.user.id, analytics, logout, handleAsyncError]);

  // Performance monitoring
  const getSessionReport = useCallback(() => {
    const now = Date.now();
    const sessionDuration = now - sessionStartTime.current;

    return {
      sessionId: session?.user.id,
      duration: sessionDuration,
      metrics: sessionState.metrics,
      health: sessionState.sessionHealth,
      isActive: sessionState.isActive,
      isWarning: sessionState.isWarning,
      extensionCount: extensionCount.current,
      lastHeartbeat: lastHeartbeat.current,
      componentMapping: COMPONENT_MAPPING,
      timestamp: now,
    };
  }, [session?.user.id, sessionState]);

  return {
    // Session state
    session,
    status,
    sessionState,

    // Session management
    refreshSession,
    extendSession,
    logout,
    validateSession,

    // Activity tracking
    trackActivity,

    // Monitoring
    getSessionReport,

    // Computed values
    isAuthenticated,
    isLoading,
    timeUntilExpiry: sessionState.timeRemaining,
    sessionHealth: sessionState.sessionHealth,
  };
}
