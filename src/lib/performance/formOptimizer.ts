/**
 * PosalPro MVP2 - Form Performance Optimizer
 * Addresses critical form validation performance issues
 * Component Traceability Matrix: US-2.3, H4, AC-2.3.1
 */

import { debounce } from 'lodash';
import { useCallback, useMemo, useRef } from 'react';
import { logWarn } from '@/lib/logger';

export interface FormPerformanceConfig {
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  debounceDelay?: number;
  enableAnalytics?: boolean;
  shouldFocusError?: boolean;
  shouldUnregister?: boolean;
}

export const DEFAULT_FORM_CONFIG: FormPerformanceConfig = {
  validationMode: 'onBlur', // ✅ PERFORMANCE: Reduce validation frequency
  reValidateMode: 'onBlur',
  debounceDelay: 300,
  enableAnalytics: false,
  shouldFocusError: false, // ✅ PERFORMANCE: Prevent layout shifts
  shouldUnregister: false, // ✅ PERFORMANCE: Better caching
};

export const MOBILE_FORM_CONFIG: FormPerformanceConfig = {
  ...DEFAULT_FORM_CONFIG,
  debounceDelay: 500, // ✅ MOBILE: Longer delay for touch interactions
  shouldFocusError: false, // ✅ MOBILE: Prevent zoom/focus issues
};

interface FormFieldValue {
  [key: string]: unknown;
}

interface OptimizedFormConfig {
  debounceDelay: number;
  validationDelay: number;
  cacheSize: number;
  updateThreshold: number;
  enableLazyValidation: boolean;
  enableFieldCaching: boolean;
}

/**
 * Hook for optimized form validation
 */
export function useOptimizedFormValidation<T>(
  validationFn: (data: T) => boolean | Promise<boolean>,
  config: FormPerformanceConfig = DEFAULT_FORM_CONFIG
) {
  const lastValidationRef = useRef<number>(0);
  const validationCacheRef = useRef<Map<string, boolean>>(new Map());

  // ✅ PERFORMANCE: Debounced validation
  const debouncedValidation = useMemo(
    () =>
      debounce(async (data: T, callback: (isValid: boolean) => void) => {
        const dataKey = JSON.stringify(data);

        // ✅ PERFORMANCE: Check cache first
        if (validationCacheRef.current.has(dataKey)) {
          callback(validationCacheRef.current.get(dataKey)!);
          return;
        }

        const startTime = performance.now();
        const isValid = await validationFn(data);
        const validationTime = performance.now() - startTime;

        // ✅ PERFORMANCE: Cache result
        validationCacheRef.current.set(dataKey, isValid);

        // ✅ PERFORMANCE: Limit cache size
        if (validationCacheRef.current.size > 100) {
          const firstKey = validationCacheRef.current.keys().next().value;
          if (firstKey) {
            validationCacheRef.current.delete(firstKey);
          }
        }

        // ✅ ANALYTICS: Track slow validations
        if (config.enableAnalytics && validationTime > 100) {
          logWarn(`Slow form validation detected: ${validationTime.toFixed(2)}ms`);
        }

        callback(isValid);
      }, config.debounceDelay ?? 300),
    [validationFn, config.debounceDelay, config.enableAnalytics]
  );

  const validateWithPerformance = useCallback(
    (data: T): Promise<boolean> => {
      return new Promise(resolve => {
        const now = Date.now();

        // ✅ PERFORMANCE: Throttle validation calls
        if (now - lastValidationRef.current < 100) {
          resolve(true); // Skip if called too frequently
          return;
        }

        lastValidationRef.current = now;
        debouncedValidation(data, resolve);
      });
    },
    [debouncedValidation]
  );

  return {
    validateWithPerformance,
    clearCache: () => validationCacheRef.current.clear(),
  };
}

/**
 * Form field performance optimizer
 */
export class FormFieldOptimizer {
  private static instance: FormFieldOptimizer | null = null;
  private fieldUpdateTimes = new Map<string, number>();
  private validationCache = new Map<string, any>();

  static getInstance(): FormFieldOptimizer {
    if (FormFieldOptimizer.instance === null) {
      FormFieldOptimizer.instance = new FormFieldOptimizer();
    }
    return FormFieldOptimizer.instance;
  }

  /**
   * Optimize field update frequency
   */
  shouldUpdateField(fieldName: string, value: FormFieldValue): boolean {
    const now = Date.now();
    const lastUpdate = this.fieldUpdateTimes.get(fieldName) ?? 0;
    const cacheKey = `${fieldName}_${JSON.stringify(value)}`;

    // ✅ PERFORMANCE: Skip if updated too recently
    if (now - lastUpdate < 150) {
      return false;
    }

    // ✅ PERFORMANCE: Skip if value hasn't changed
    if (this.validationCache.has(cacheKey)) {
      return false;
    }

    this.fieldUpdateTimes.set(fieldName, now);
    this.validationCache.set(cacheKey, value);

    // ✅ PERFORMANCE: Limit cache size
    if (this.validationCache.size > 200) {
      const firstKey = this.validationCache.keys().next().value;
      if (firstKey) {
        this.validationCache.delete(firstKey);
      }
    }

    return true;
  }

  /**
   * Clear optimization cache
   */
  clearCache(): void {
    this.fieldUpdateTimes.clear();
    this.validationCache.clear();
  }
}

/**
 * Performance monitoring for forms
 */
export interface FormPerformanceMetrics {
  validationTime: number;
  renderTime: number;
  fieldUpdateCount: number;
  cacheHitRate: number;
}

export class FormPerformanceMonitor {
  private metrics: FormPerformanceMetrics = {
    validationTime: 0,
    renderTime: 0,
    fieldUpdateCount: 0,
    cacheHitRate: 0,
  };

  private validationStartTime = 0;
  private renderStartTime = 0;
  private totalValidations = 0;
  private cacheHits = 0;

  startValidation(): void {
    this.validationStartTime = performance.now();
  }

  endValidation(): void {
    if (this.validationStartTime > 0) {
      this.metrics.validationTime = performance.now() - this.validationStartTime;
      this.totalValidations++;
      this.validationStartTime = 0;
    }
  }

  startRender(): void {
    this.renderStartTime = performance.now();
  }

  endRender(): void {
    if (this.renderStartTime > 0) {
      this.metrics.renderTime = performance.now() - this.renderStartTime;
      this.renderStartTime = 0;
    }
  }

  recordFieldUpdate(): void {
    this.metrics.fieldUpdateCount++;
  }

  recordCacheHit(): void {
    this.cacheHits++;
    this.metrics.cacheHitRate =
      this.totalValidations > 0 ? (this.cacheHits / this.totalValidations) * 100 : 0;
  }

  getMetrics(): FormPerformanceMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      validationTime: 0,
      renderTime: 0,
      fieldUpdateCount: 0,
      cacheHitRate: 0,
    };
    this.totalValidations = 0;
    this.cacheHits = 0;
  }
}

/**
 * React Hook Form performance configuration
 */
export function getOptimizedFormConfig(isMobile = false): OptimizedFormConfig {
  return {
    debounceDelay: isMobile ? 300 : 200,
    validationDelay: isMobile ? 500 : 300,
    cacheSize: isMobile ? 100 : 200,
    updateThreshold: isMobile ? 200 : 150,
    enableLazyValidation: true,
    enableFieldCaching: true,
  };
}

/**
 * Utility to detect mobile devices for form optimization
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  );
}

export default {
  useOptimizedFormValidation,
  FormFieldOptimizer,
  FormPerformanceMonitor,
  getOptimizedFormConfig,
  isMobileDevice,
  DEFAULT_FORM_CONFIG,
  MOBILE_FORM_CONFIG,
};
