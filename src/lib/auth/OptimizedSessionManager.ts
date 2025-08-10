/**
 * PosalPro MVP2 - Optimized Session Manager
 * Addresses authentication performance issues:
 * - Prevents 405 session refresh loops
 * - Implements intelligent session validation
 * - Reduces authentication API calls
 * - Provides session state management
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logger } from '@/utils/logger';

interface SessionState {
  isValid: boolean;
  lastValidation: number;
  cooldownActive: boolean;
  cooldownExpiry: number;
  refreshAttempts: number;
  lastRefreshAttempt: number;
}

interface SessionConfig {
  validationInterval: number; // milliseconds
  cooldownDuration: number; // milliseconds
  maxRefreshAttempts: number;
  refreshCooldown: number; // milliseconds
  enableOptimizations: boolean;
}

const DEFAULT_CONFIG: SessionConfig = {
  validationInterval: 300000, // 5 minutes instead of frequent checks
  cooldownDuration: 300000, // 5 minutes cooldown after errors
  maxRefreshAttempts: 3,
  refreshCooldown: 60000, // 1 minute between refresh attempts
  enableOptimizations: true,
};

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.1', 'US-2.2', 'US-2.3'],
  acceptanceCriteria: ['AC-2.1.1', 'AC-2.2.1', 'AC-2.3.1'],
  methods: ['validateSession()', 'refreshSession()', 'handleCooldown()'],
  hypotheses: ['H3', 'H4', 'H8'],
  testCases: ['TC-H3-001', 'TC-H4-001', 'TC-H8-001'],
};

export class OptimizedSessionManager {
  private static instance: OptimizedSessionManager;
  private errorHandlingService: ErrorHandlingService;
  private config: SessionConfig;
  private sessionState: SessionState;
  private validationTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, EventListener> = new Map();

  private constructor(config: Partial<SessionConfig> = {}) {
    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.sessionState = {
      isValid: false,
      lastValidation: 0,
      cooldownActive: false,
      cooldownExpiry: 0,
      refreshAttempts: 0,
      lastRefreshAttempt: 0,
    };

    this.initializeSessionManager();
  }

  public static getInstance(config?: Partial<SessionConfig>): OptimizedSessionManager {
    if (!OptimizedSessionManager.instance) {
      OptimizedSessionManager.instance = new OptimizedSessionManager(config);
    }
    return OptimizedSessionManager.instance;
  }

  /**
   * Initialize session manager with optimizations
   */
  private initializeSessionManager(): void {
    try {
      // Load previous session state from localStorage
      this.loadSessionState();

      // Setup event listeners for optimization
      this.setupEventListeners();

      // Start validation timer with longer intervals
      this.startValidationTimer();

      logger.info('Optimized session manager initialized', {
        component: 'OptimizedSessionManager',
        config: this.config,
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
      });
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        'Failed to initialize optimized session manager',
        ErrorCodes.SYSTEM.INITIALIZATION_FAILED,
        {
          component: 'OptimizedSessionManager',
          operation: 'initializeSessionManager',
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
        }
      );
    }
  }

  /**
   * Validate session with intelligent cooldown
   */
  public async validateSession(): Promise<boolean> {
    try {
      const now = Date.now();

      // Check if we're in cooldown period
      if (this.sessionState.cooldownActive && now < this.sessionState.cooldownExpiry) {
        logger.debug('Session validation skipped due to cooldown', {
          component: 'OptimizedSessionManager',
          cooldownRemaining: this.sessionState.cooldownExpiry - now,
          userStories: COMPONENT_MAPPING.userStories,
        });
        return this.sessionState.isValid;
      }

      // Check if validation is too frequent
      if (now - this.sessionState.lastValidation < this.config.validationInterval) {
        logger.debug('Session validation throttled', {
          component: 'OptimizedSessionManager',
          timeSinceLastValidation: now - this.sessionState.lastValidation,
          userStories: COMPONENT_MAPPING.userStories,
        });
        return this.sessionState.isValid;
      }

      // Perform actual validation
      const validationStartTime = performance.now();
      const isValid = await this.performSessionValidation();
      const validationDuration = performance.now() - validationStartTime;

      // Update session state
      this.sessionState.isValid = isValid;
      this.sessionState.lastValidation = now;

      // Clear cooldown if validation successful
      if (isValid && this.sessionState.cooldownActive) {
        this.clearCooldown();
      }

      // Save state
      this.saveSessionState();

      // Log performance warning if validation takes too long
      if (validationDuration > 1000) {
        logger.warn('Session validation exceeded 1 second', {
          duration: validationDuration,
          component: 'OptimizedSessionManager',
          userStories: COMPONENT_MAPPING.userStories,
        });
      }

      return isValid;
    } catch (error) {
      this.handleValidationError(error);
      return false;
    }
  }

  /**
   * Refresh session with intelligent retry logic
   */
  public async refreshSession(): Promise<boolean> {
    try {
      const now = Date.now();

      // Check cooldown and attempt limits
      if (this.sessionState.cooldownActive && now < this.sessionState.cooldownExpiry) {
        logger.debug('Session refresh blocked by cooldown', {
          component: 'OptimizedSessionManager',
          cooldownRemaining: this.sessionState.cooldownExpiry - now,
          userStories: COMPONENT_MAPPING.userStories,
        });
        return false;
      }

      // Check if too many recent attempts
      if (this.sessionState.refreshAttempts >= this.config.maxRefreshAttempts) {
        this.activateCooldown('Max refresh attempts exceeded');
        return false;
      }

      // Check minimum time between attempts
      if (now - this.sessionState.lastRefreshAttempt < this.config.refreshCooldown) {
        logger.debug('Session refresh throttled', {
          component: 'OptimizedSessionManager',
          timeSinceLastAttempt: now - this.sessionState.lastRefreshAttempt,
          userStories: COMPONENT_MAPPING.userStories,
        });
        return false;
      }

      // Perform refresh
      this.sessionState.refreshAttempts++;
      this.sessionState.lastRefreshAttempt = now;

      const refreshStartTime = performance.now();
      const success = await this.performSessionRefresh();
      const refreshDuration = performance.now() - refreshStartTime;

      if (success) {
        // Reset attempts on success
        this.sessionState.refreshAttempts = 0;
        this.sessionState.isValid = true;
        this.clearCooldown();

        logger.info('Session refresh successful', {
          duration: refreshDuration,
          attempts: this.sessionState.refreshAttempts,
          component: 'OptimizedSessionManager',
          userStories: COMPONENT_MAPPING.userStories,
        });
      } else {
        // Activate cooldown on multiple failures
        if (this.sessionState.refreshAttempts >= this.config.maxRefreshAttempts) {
          this.activateCooldown('Session refresh failed multiple times');
        }
      }

      this.saveSessionState();
      return success;
    } catch (error) {
      this.handleRefreshError(error);
      return false;
    }
  }

  /**
   * Activate cooldown to prevent spam
   */
  private activateCooldown(reason: string): void {
    const now = Date.now();
    this.sessionState.cooldownActive = true;
    this.sessionState.cooldownExpiry = now + this.config.cooldownDuration;

    logger.warn('Session manager cooldown activated', {
      reason,
      duration: this.config.cooldownDuration,
      expiry: this.sessionState.cooldownExpiry,
      component: 'OptimizedSessionManager',
      userStories: COMPONENT_MAPPING.userStories,
    });

    // Dispatch event for components to handle cooldown
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('auth-cooldown-activated', {
          detail: {
            reason,
            duration: this.config.cooldownDuration,
            expiry: this.sessionState.cooldownExpiry,
          },
        })
      );
    }

    this.saveSessionState();
  }

  /**
   * Clear cooldown state
   */
  private clearCooldown(): void {
    if (this.sessionState.cooldownActive) {
      this.sessionState.cooldownActive = false;
      this.sessionState.cooldownExpiry = 0;
      this.sessionState.refreshAttempts = 0;

      logger.info('Session manager cooldown cleared', {
        component: 'OptimizedSessionManager',
        userStories: COMPONENT_MAPPING.userStories,
      });

      // Dispatch event for components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-cooldown-cleared'));
      }

      this.saveSessionState();
    }
  }

  /**
   * Perform actual session validation
   */
  private async performSessionValidation(): Promise<boolean> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return false;
      }

      // Try to get session from NextAuth
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle 405 Method Not Allowed specifically
      if (response.status === 405) {
        logger.warn('Session validation received 405 error, activating cooldown', {
          component: 'OptimizedSessionManager',
          userStories: COMPONENT_MAPPING.userStories,
        });
        this.activateCooldown('405 Method Not Allowed error');
        return false;
      }

      if (!response.ok) {
        return false;
      }

      const sessionData: unknown = await response.json();
      const hasUser =
        typeof sessionData === 'object' &&
        sessionData !== null &&
        'user' in sessionData &&
        (sessionData as { user?: unknown }).user !== undefined;
      return hasUser;
    } catch (error) {
      logger.warn('Session validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'OptimizedSessionManager',
        userStories: COMPONENT_MAPPING.userStories,
      });
      return false;
    }
  }

  /**
   * Perform actual session refresh
   */
  private async performSessionRefresh(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      // Use NextAuth refresh mechanism
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
          'X-Refresh-Session': 'true',
        },
      });

      // Handle 405 Method Not Allowed specifically
      if (response.status === 405) {
        logger.warn('Session refresh received 405 error, activating cooldown', {
          component: 'OptimizedSessionManager',
          userStories: COMPONENT_MAPPING.userStories,
        });
        this.activateCooldown('405 Method Not Allowed error during refresh');
        return false;
      }

      return response.ok;
    } catch (error) {
      logger.warn('Session refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'OptimizedSessionManager',
        userStories: COMPONENT_MAPPING.userStories,
      });
      return false;
    }
  }

  /**
   * Handle validation errors
   */
  private handleValidationError(error: unknown): void {
    this.sessionState.isValid = false;

    // Activate cooldown on repeated errors
    this.sessionState.refreshAttempts++;
    if (this.sessionState.refreshAttempts >= this.config.maxRefreshAttempts) {
      this.activateCooldown('Repeated validation errors');
    }

    this.errorHandlingService.processError(
      error,
      'Session validation failed with error',
      ErrorCodes.AUTH.SESSION_EXPIRED,
      {
        component: 'OptimizedSessionManager',
        operation: 'validateSession',
        attempts: this.sessionState.refreshAttempts,
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
      }
    );

    this.saveSessionState();
  }

  /**
   * Handle refresh errors
   */
  private handleRefreshError(error: unknown): void {
    this.sessionState.refreshAttempts++;

    if (this.sessionState.refreshAttempts >= this.config.maxRefreshAttempts) {
      this.activateCooldown('Session refresh errors exceeded limit');
    }

    this.errorHandlingService.processError(
      error,
      'Session refresh failed with error',
      ErrorCodes.AUTH.TOKEN_REFRESH_FAILED,
      {
        component: 'OptimizedSessionManager',
        operation: 'refreshSession',
        attempts: this.sessionState.refreshAttempts,
        userStories: COMPONENT_MAPPING.userStories,
        hypotheses: COMPONENT_MAPPING.hypotheses,
      }
    );

    this.saveSessionState();
  }

  /**
   * Setup event listeners for optimization
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for performance optimization requests
    const optimizationListener = () => {
      // Increase validation intervals when optimization is requested
      this.config.validationInterval = Math.min(
        this.config.validationInterval * 1.5,
        900000 // Max 15 minutes
      );

      this.restartValidationTimer();

      logger.info('Session manager intervals optimized', {
        newInterval: this.config.validationInterval,
        component: 'OptimizedSessionManager',
        userStories: COMPONENT_MAPPING.userStories,
      });
    };

    // Listen for network status changes
    const onlineListener = () => {
      if (this.sessionState.cooldownActive) {
        // Clear cooldown when coming back online
        this.clearCooldown();
      }
    };

    const offlineListener = () => {
      // Pause validation when offline
      if (this.validationTimer) {
        clearInterval(this.validationTimer);
        this.validationTimer = null;
      }
    };

    window.addEventListener('auth-optimization-requested', optimizationListener);
    window.addEventListener('online', onlineListener);
    window.addEventListener('offline', offlineListener);

    this.eventListeners.set('optimization', optimizationListener);
    this.eventListeners.set('online', onlineListener);
    this.eventListeners.set('offline', offlineListener);
  }

  /**
   * Start validation timer with optimized intervals
   */
  private startValidationTimer(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
    }

    this.validationTimer = setInterval(() => {
      // Only validate if not in cooldown
      if (!this.sessionState.cooldownActive) {
        this.validateSession();
      }
    }, this.config.validationInterval);
  }

  /**
   * Restart validation timer with new intervals
   */
  private restartValidationTimer(): void {
    this.startValidationTimer();
  }

  /**
   * Load session state from localStorage
   */
  private loadSessionState(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('posalpro_optimized_session_state');
      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        // Validate saved state
        if (parsed && typeof parsed === 'object') {
          const partial = parsed as Partial<SessionState>;
          this.sessionState = {
            ...this.sessionState,
            ...partial,
          };

          // Check if cooldown has expired
          if (this.sessionState.cooldownActive && Date.now() > this.sessionState.cooldownExpiry) {
            this.clearCooldown();
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to load session state from localStorage', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'OptimizedSessionManager',
      });
    }
  }

  /**
   * Save session state to localStorage
   */
  private saveSessionState(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('posalpro_optimized_session_state', JSON.stringify(this.sessionState));
    } catch (error) {
      logger.warn('Failed to save session state to localStorage', {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'OptimizedSessionManager',
      });
    }
  }

  /**
   * Get current session status
   */
  public getSessionStatus(): SessionState & { config: SessionConfig } {
    return {
      ...this.sessionState,
      config: this.config,
    };
  }

  /**
   * Force clear cooldown (for admin/development use)
   */
  public forceClearCooldown(): void {
    this.clearCooldown();
    logger.info('Session cooldown force cleared', {
      component: 'OptimizedSessionManager',
      userStories: COMPONENT_MAPPING.userStories,
    });
  }

  /**
   * Cleanup on destroy
   */
  public destroy(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = null;
    }

    // Remove event listeners
    if (typeof window !== 'undefined') {
      this.eventListeners.forEach((listener, eventType) => {
        window.removeEventListener(eventType, listener);
      });
    }
    this.eventListeners.clear();

    // Save final state
    this.saveSessionState();
  }
}

// Export singleton instance
export const optimizedSessionManager = OptimizedSessionManager.getInstance();
