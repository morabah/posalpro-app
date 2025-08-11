'use client';

import { logger } from '@/utils/logger';
/**
 * PosalPro MVP2 - Form Validation Hook
 * React Hook Form + Zod integration for enhanced form validation
 * Simplified version for H2.3 implementation
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm, type FieldValues, type DefaultValues } from 'react-hook-form';
import type { ZodSchema } from 'zod';

interface UseFormValidationOptions<T extends FieldValues> {
  schema: ZodSchema<T>;
  formName: string;
  enableAnalytics?: boolean;
  defaultValues?: Partial<T>;
}

/**
 * Enhanced form validation hook with Zod
 */
export function useFormValidation<T extends FieldValues>({
  schema,
  formName,
  enableAnalytics = false,
  defaultValues,
}: UseFormValidationOptions<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T> | undefined,
    mode: 'onChange',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track field interactions (simplified for now)
  const trackFieldFocus = useCallback(
    (fieldName: string) => {
      if (enableAnalytics) {
        logger.info(`Field focus: ${formName}.${fieldName}`);
      }
    },
    [enableAnalytics, formName]
  );

  const trackFieldBlur = useCallback(
    (fieldName: string) => {
      if (enableAnalytics) {
        logger.info(`Field blur: ${formName}.${fieldName}`);
      }
    },
    [enableAnalytics, formName]
  );

  const trackFieldChange = useCallback(
    (fieldName: string) => {
      if (enableAnalytics) {
        logger.info(`Field change: ${formName}.${fieldName}`);
      }
    },
    [enableAnalytics, formName]
  );

  // Enhanced submit handler with validation
  const submitWithValidation = useCallback(
    (onValidSubmit: (data: T) => Promise<void>) => {
      return form.handleSubmit(async (data: T) => {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
          if (enableAnalytics) {
            logger.info(`Form submit attempt: ${formName}`);
          }

          await onValidSubmit(data);

          if (enableAnalytics) {
            logger.info(`Form submit success: ${formName}`);
          }
        } catch (error) {
          if (enableAnalytics) {
            logger.error(`Form submit error: ${formName}`, error);
          }

          throw error;
        } finally {
          setIsSubmitting(false);
        }
      });
    },
    [form, isSubmitting, enableAnalytics, formName]
  );

  return {
    ...form,
    isSubmitting,
    submitWithValidation,
    trackFieldFocus,
    trackFieldBlur,
    trackFieldChange,
  };
}
