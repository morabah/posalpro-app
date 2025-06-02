/**
 * PosalPro MVP2 - Form Validation Hook
 * React Hook Form + Zod integration for enhanced form validation
 * Simplified version for H2.3 implementation
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm, type FieldValues } from 'react-hook-form';
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
    defaultValues: defaultValues as any,
    mode: 'onChange',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track field interactions (simplified for now)
  const trackFieldFocus = useCallback(
    (fieldName: string) => {
      if (enableAnalytics) {
        console.log(`Field focus: ${formName}.${fieldName}`);
      }
    },
    [enableAnalytics, formName]
  );

  const trackFieldBlur = useCallback(
    (fieldName: string) => {
      if (enableAnalytics) {
        console.log(`Field blur: ${formName}.${fieldName}`);
      }
    },
    [enableAnalytics, formName]
  );

  const trackFieldChange = useCallback(
    (fieldName: string) => {
      if (enableAnalytics) {
        console.log(`Field change: ${formName}.${fieldName}`);
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
            console.log(`Form submit attempt: ${formName}`);
          }

          await onValidSubmit(data);

          if (enableAnalytics) {
            console.log(`Form submit success: ${formName}`);
          }
        } catch (error) {
          if (enableAnalytics) {
            console.error(`Form submit error: ${formName}`, error);
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
