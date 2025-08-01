/**
 * PosalPro MVP2 - Mobile-Optimized Form Hook
 * Addresses React Hook Form performance bottlenecks on mobile devices
 * Component Traceability Matrix: US-8.1, H9, AC-8.1.1
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Replaces watch() with manual form data collection
 * - Uses onBlur validation mode on mobile instead of onChange
 * - Implements debounced updates to prevent excessive re-renders
 * - Throttles analytics tracking to reduce overhead
 */

'use client';

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useResponsive } from '@/hooks/useResponsive';
import { useCallback, useEffect, useRef } from 'react';
import { FieldValues, useForm, UseFormProps, UseFormReturn } from 'react-hook-form';

interface MobileOptimizedFormConfig<T extends FieldValues> extends UseFormProps<T> {
  onDataChange?: (data: T) => void;
  debounceDelay?: number;
  analyticsThrottleInterval?: number;
  componentName?: string;
}

interface MobileOptimizedFormReturn<T extends FieldValues> extends UseFormReturn<T> {
  handleFieldChange: (fieldName: string) => () => void;
  collectFormData: () => T;
  isMobileOptimized: boolean;
}

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-1.1', 'US-2.2'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.2', 'AC-1.1.1'],
  methods: [
    'optimizeMobileFormPerformance()',
    'implementDebouncedUpdates()',
    'reduceMobileRenderCycles()',
  ],
  hypotheses: ['H9'], // Mobile UX optimization
  testCases: ['TC-H9-003', 'TC-H9-004'],
};

export function useMobileOptimizedForm<T extends FieldValues>({
  onDataChange,
  debounceDelay,
  analyticsThrottleInterval = 5000,
  componentName = 'UnknownForm',
  ...formConfig
}: MobileOptimizedFormConfig<T>): MobileOptimizedFormReturn<T> {
  const { isMobile } = useResponsive();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Performance optimization refs
  const debouncedUpdateRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastAnalyticsTrackRef = useRef<number>(0);
  const fieldInteractionsRef = useRef<number>(0);

  // ✅ MOBILE OPTIMIZATION: Adjust form mode based on device
  const optimizedFormConfig = {
    ...formConfig,
    mode: isMobile ? 'onBlur' : formConfig.mode || 'onSubmit',
  } as UseFormProps<T>;

  const form = useForm<T>(optimizedFormConfig);

  // ✅ PERFORMANCE FIX: Manual form data collection instead of watch()
  const collectFormData = useCallback((): T => {
    // Use form.getValues() to get all form values
    return form.getValues();
  }, [form]);

  // ✅ PERFORMANCE OPTIMIZATION: Debounced update function
  const debouncedUpdate = useCallback(
    (data: T) => {
      // Clear existing timeout
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }

      // Set new timeout with mobile-optimized delay
      const delay = debounceDelay || (isMobile ? 500 : 300);
      debouncedUpdateRef.current = setTimeout(() => {
        onDataChange?.(data);
      }, delay);
    },
    [onDataChange, debounceDelay, isMobile]
  );

  // ✅ MOBILE-OPTIMIZED: Field change handler with throttled analytics
  const handleFieldChange = useCallback(
    (fieldName: string) => {
      return () => {
        // Increment field interactions
        fieldInteractionsRef.current += 1;

        // Mobile-optimized analytics throttling
        const now = Date.now();
        const shouldTrackAnalytics =
          now - lastAnalyticsTrackRef.current > analyticsThrottleInterval &&
          fieldInteractionsRef.current % (isMobile ? 5 : 3) === 0;

        if (shouldTrackAnalytics) {
          lastAnalyticsTrackRef.current = now;

          analytics('mobile_form_field_interaction', {
            fieldName,
            componentName,
            fieldInteractions: fieldInteractionsRef.current,
            isMobile,
            userStories: COMPONENT_MAPPING.userStories,
            hypotheses: COMPONENT_MAPPING.hypotheses,
            testCases: COMPONENT_MAPPING.testCases,
            performanceOptimized: true,
          }, 'low');
        }

        // Collect and update form data with debouncing
        const formData = collectFormData();
        debouncedUpdate(formData);
      };
    },
    [
      collectFormData,
      debouncedUpdate,
      analytics,
      analyticsThrottleInterval,
      isMobile,
      componentName,
    ]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }
    };
  }, []);

  return {
    ...form,
    handleFieldChange,
    collectFormData,
    isMobileOptimized: isMobile,
  };
}

export default useMobileOptimizedForm;
