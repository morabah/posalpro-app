/**
 * PosalPro MVP2 - Authentication Circuit Breaker
 * Prevents performance cascades from authentication failures
 * Implements exponential backoff and circuit breaker pattern
 */

interface CircuitBreakerConfig {
  maxRetries: number;
  timeoutMs: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
  resetTimeoutMs: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  lastAttempt: number;
}

export class AuthCircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    isOpen: false,
    lastAttempt: 0,
  };
  private sessionStorage: Storage;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      maxRetries: 3,
      timeoutMs: 5000,
      baseBackoffMs: 1000,
      maxBackoffMs: 30000,
      resetTimeoutMs: 60000,
      ...config,
    };

    this.sessionStorage = typeof window !== 'undefined' ? window.sessionStorage : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as unknown as Storage;

    // Load state from session storage
    this.loadState();
  }

  private loadState(): void {
    try {
      const saved = this.sessionStorage.getItem('auth_circuit_breaker_state');
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const partial = parsed as Partial<CircuitBreakerState>;
          this.state = {
            ...this.state,
            ...partial,
          };
        }
      } else {
        this.resetState();
      }
    } catch {
      this.resetState();
    }
  }

  private saveState(): void {
    try {
      this.sessionStorage.setItem('auth_circuit_breaker_state', JSON.stringify(this.state));
    } catch {
      // Ignore storage errors
    }
  }

  private resetState(): void {
    this.state = {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
      lastAttempt: 0,
    };
    this.saveState();
  }

  /**
   * Check if we should allow an authentication attempt
   */
  canAttempt(): boolean {
    const now = Date.now();

    // If circuit is closed, allow attempt
    if (!this.state.isOpen) {
      return true;
    }

    // If enough time has passed, allow attempt to test if service is back up
    if (now - this.state.lastFailure > this.config.resetTimeoutMs) {
      console.log('🔄 [AuthCircuitBreaker] Testing if auth service is back up');
      return true;
    }

    // Check if we're still in backoff period
    const backoffTime = Math.min(
      this.config.baseBackoffMs * Math.pow(2, this.state.failures - 1),
      this.config.maxBackoffMs
    );

    if (now - this.state.lastAttempt < backoffTime) {
      console.log(`🚫 [AuthCircuitBreaker] Still in backoff period (${Math.ceil((backoffTime - (now - this.state.lastAttempt)) / 1000)}s remaining)`);
      return false;
    }

    return true;
  }

  /**
   * Record a successful authentication
   */
  recordSuccess(): void {
    if (this.state.failures > 0 || this.state.isOpen) {
      console.log('✅ [AuthCircuitBreaker] Auth service recovered, resetting circuit breaker');
      this.resetState();
    }
  }

  /**
   * Record an authentication failure
   */
  recordFailure(error: Error): void {
    const now = Date.now();
    this.state.failures++;
    this.state.lastFailure = now;
    this.state.lastAttempt = now;

    // Open circuit if too many failures
    if (this.state.failures >= this.config.maxRetries) {
      this.state.isOpen = true;
      console.warn(`🚨 [AuthCircuitBreaker] Circuit opened after ${this.state.failures} failures. Auth attempts will be throttled.`);
    }

    this.saveState();

    // Log with appropriate level based on failure count
    if (this.state.failures === 1) {
      console.warn('⚠️ [AuthCircuitBreaker] First auth failure, will retry');
    } else if (this.state.failures < this.config.maxRetries) {
      console.warn(`⚠️ [AuthCircuitBreaker] Auth failure ${this.state.failures}/${this.config.maxRetries}`);
    } else {
      console.error(`❌ [AuthCircuitBreaker] Circuit breaker activated. Error: ${error.message}`);
    }
  }

  /**
   * Get the current state for debugging
   */
  getState(): Readonly<CircuitBreakerState> {
    return { ...this.state };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    console.log('🔄 [AuthCircuitBreaker] Manually resetting circuit breaker');
    this.resetState();
  }

  /**
   * Execute an authentication operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.canAttempt()) {
      throw new Error('Authentication circuit breaker is open. Please try again later.');
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Authentication timeout')), this.config.timeoutMs)
        ),
      ]);

      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get retry delay for manual retry logic
   */
  getRetryDelay(): number {
    if (!this.state.isOpen) return 0;

    const backoffTime = Math.min(
      this.config.baseBackoffMs * Math.pow(2, this.state.failures - 1),
      this.config.maxBackoffMs
    );

    return Math.max(0, backoffTime - (Date.now() - this.state.lastAttempt));
  }
}

// Singleton instance for the app
let authCircuitBreakerInstance: AuthCircuitBreaker | null = null;

export function getAuthCircuitBreaker(): AuthCircuitBreaker {
  if (!authCircuitBreakerInstance) {
    authCircuitBreakerInstance = new AuthCircuitBreaker();
  }
  return authCircuitBreakerInstance;
} 