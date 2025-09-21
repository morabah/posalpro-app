'use client';

import { logDebug, logError } from '@/lib/logger';
import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';

// Type definitions for form field values
type FormFieldValue = string | number | undefined;
type FormFieldChangeHandler = (
  event:
    | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    | { target: any; type?: any }
    | FormFieldValue
    | undefined
    | any
) => void;
type FormFieldBlurHandler = (
  event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement> | { target: any; type?: any }
) => void;

// ✅ React Hook Form Register Props Interface
interface RegisterProps {
  name?: string;
  onChange?: (event: any) => void;
  onBlur?: (event: any) => void;
  ref?: React.Ref<any>;
}

// ✅ Form Field Props Interface
export interface FormFieldProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>,
    'onChange' | 'onBlur'
  > {
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea';
  value?: FormFieldValue; // Optional for RHF/uncontrolled compatibility
  onChange?: FormFieldChangeHandler; // Supports both value and event signatures
  onBlur?: FormFieldBlurHandler; // Updated for React Hook Form compatibility
  error?: string;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  icon?: React.ReactNode;
  validationClass?: string;
}

// ✅ Text Input Component with forwardRef for RHF compatibility
export const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
  (
    {
      name,
      label,
      placeholder,
      type = 'text',
      value,
      onChange,
      onBlur,
      error,
      touched = false,
      required = false,
      disabled = false,
      className,
      inputClassName,
      labelClassName,
      errorClassName,
      icon,
      validationClass,
      ...restProps // Capture any additional props from register (like ref, name from RHF)
    },
    ref
  ) => {
    // Extract register-specific props
    const registerProps = restProps as RegisterProps;

    // Combine RHF register ref with forwarded ref
    const setRef = (element: HTMLInputElement | HTMLTextAreaElement | null) => {
      const registerRef = (registerProps as RegisterProps)?.ref as
        | ((instance: any) => void)
        | React.MutableRefObject<any>
        | undefined;

      if (typeof registerRef === 'function') {
        registerRef(element);
      } else if (registerRef && 'current' in registerRef) {
        (registerRef as React.MutableRefObject<any>).current = element;
      }

      if (typeof ref === 'function') {
        ref(element as any);
      } else if (ref && 'current' in (ref as any)) {
        (ref as React.MutableRefObject<any>).current = element as any;
      }
    };

    // Resolve effective handlers
    const rhfOnChange = (registerProps as RegisterProps).onChange;
    const rhfOnBlur = (registerProps as RegisterProps).onBlur;
    const effectiveOnChange = onChange ?? rhfOnChange;
    const effectiveOnBlur = onBlur ?? rhfOnBlur;
    const isControlled = value !== undefined;

    // Debug: Log handler detection
    logDebug('FormField handler detection:', {
      fieldName: name || registerProps.name,
      hasRHFHandlers: Boolean(rhfOnChange || rhfOnBlur),
      isControlled,
      hasCustomHandlers: Boolean(onChange || onBlur),
      registerPropsKeys: Object.keys(registerProps),
      component: 'FormField',
      operation: 'handler_detection',
    });

    // Debug logging for component initialization
    logDebug('FormField initialized:', {
      fieldName: name || registerProps.name,
      isControlled,
      hasCustomHandlers: Boolean(onChange || onBlur),
      hasRHFHandlers: Boolean(rhfOnChange || rhfOnBlur),
      component: 'FormField',
      operation: 'component_init',
      timestamp: new Date().toISOString(),
    });

    const hasError = error && touched;
    const fieldId = `field-${name || registerProps.name || 'unnamed'}`;

    const baseInputClasses = cn(
      'w-full border-b bg-transparent focus:outline-none transition-colors duration-200',
      'placeholder:text-gray-400',
      {
        'border-red-500 focus:border-red-500': hasError,
        'border-gray-300 focus:border-blue-500': !hasError,
        'opacity-50 cursor-not-allowed': disabled,
      },
      validationClass,
      inputClassName
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (disabled) return;

      // Debug: Log all change events
      logDebug('FormField handleChange called:', {
        event: e,
        eventType: typeof e,
        hasTarget: e && typeof e === 'object' && 'target' in e,
        targetValue: e && typeof e === 'object' && e.target ? (e.target as any).value : 'no target',
        fieldName: name || registerProps.name,
        component: 'FormField',
        operation: 'handle_change',
        timestamp: new Date().toISOString(),
      });

      // Safety check: ensure event and target exist
      if (!e || !e.target) {
        logError('FormField: Invalid event object passed to handleChange', {
          event: e,
          eventType: typeof e,
          hasTarget: e && typeof e === 'object' && 'target' in e,
          target: e && typeof e === 'object' && e.target,
          fieldName: name || registerProps.name,
          component: 'FormField',
          operation: 'handle_change_validation',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // If no value prop is provided and no custom onChange, assume React Hook Form/uncontrolled usage.
      // Pass through the raw event so libraries expecting e.target.name/value work.
      if (!isControlled) {
        try {
          // Use the onChange from registerProps (from register) if available
          const changeHandler = registerProps.onChange || onChange;
          changeHandler?.(e);
        } catch (error) {
          logError('FormField: Error in uncontrolled onChange handler', {
            error,
            event: e,
            fieldName: name || registerProps.name,
            component: 'FormField',
            operation: 'uncontrolled_onchange_error',
            timestamp: new Date().toISOString(),
          });
        }
        return;
      }

      // Controlled usage: derive the new value and pass it up.
      let newValue: FormFieldValue = e.target.value;
      if (type === 'number') {
        newValue = e.target.value !== '' ? parseFloat(e.target.value) : undefined;
      }
      try {
        onChange?.(newValue);
      } catch (error) {
        logError('FormField: Error in controlled onChange handler', {
          error,
          event: e,
          fieldName: name || registerProps.name,
          component: 'FormField',
          operation: 'controlled_onchange_error',
          timestamp: new Date().toISOString(),
        });
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (disabled) return;

      // Safety check: ensure event and target exist
      if (!e || !e.target) {
        logError('FormField: Invalid event object passed to handleBlur', {
          event: e,
          eventType: typeof e,
          hasTarget: e && typeof e === 'object' && 'target' in e,
          target: e && typeof e === 'object' && e.target,
          fieldName: name || registerProps.name,
          component: 'FormField',
          operation: 'handle_blur_validation',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (onBlur || registerProps.onBlur) {
        try {
          const blurHandler = registerProps.onBlur || onBlur;
          blurHandler?.(e);
        } catch (error) {
          logError('FormField: Error in onBlur handler', {
            error,
            event: e,
            fieldName: name || registerProps.name,
            component: 'FormField',
            operation: 'onblur_handler_error',
            timestamp: new Date().toISOString(),
          });
        }
      }
    };

    return (
      <div className={cn('space-y-1', className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              'block text-sm font-medium text-gray-700',
              { 'text-red-600': hasError },
              labelClassName
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Icon */}
          {icon && (
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}

          {/* Input/Textarea */}
          {type === 'textarea' ? (
            <textarea
              {...restProps}
              ref={setRef as unknown as React.RefObject<HTMLTextAreaElement>}
              id={fieldId}
              name={name || registerProps.name}
              // Avoid forcing controlled mode when value is undefined (RHF compatibility)
              value={value !== undefined ? value : undefined}
              onChange={isControlled ? handleChange : (effectiveOnChange as any)}
              onBlur={isControlled ? handleBlur : (effectiveOnBlur as any)}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(baseInputClasses, 'resize-none min-h-[80px]', { 'pl-8': icon })}
              rows={3}
            />
          ) : (
            <input
              {...restProps}
              ref={setRef as unknown as React.RefObject<HTMLInputElement>}
              id={fieldId}
              name={name || registerProps.name}
              type={type}
              // Avoid forcing controlled mode when value is undefined (RHF compatibility)
              value={value !== undefined ? value : undefined}
              onChange={isControlled ? handleChange : (effectiveOnChange as any)}
              onBlur={isControlled ? handleBlur : (effectiveOnBlur as any)}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(baseInputClasses, { 'pl-8': icon })}
            />
          )}
        </div>

        {/* Error Message */}
        {hasError && <p className={cn('text-sm text-red-600', errorClassName)}>{error}</p>}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

// ✅ Form Field with Icon Component
export function FormFieldWithIcon({ icon, ...props }: FormFieldProps & { icon: React.ReactNode }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0 text-gray-400">{icon}</div>
      <div className="flex-1">
        <FormField {...props} />
      </div>
    </div>
  );
}

// ✅ Form Field Group Component
export function FormFieldGroup({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
      {children}
    </div>
  );
}

// ✅ Form Actions Component
export function FormActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-end space-x-3 pt-4', className)}>{children}</div>
  );
}

// ✅ Form Error Summary Component
export function FormErrorSummary({
  errors,
  className,
}: {
  errors: Record<string, string>;
  className?: string;
}) {
  const errorEntries = Object.entries(errors).filter(([_, error]) => error);

  if (errorEntries.length === 0) return null;

  return (
    <div className={cn('mb-4 p-3 bg-red-50 border border-red-200 rounded-md', className)}>
      <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following issues:</h4>
      <ul className="text-sm text-red-700 space-y-1">
        {errorEntries.map(([field, error]) => (
          <li key={field} className="flex items-start">
            <span className="text-red-500 mr-2">•</span>
            <span>{error}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ✅ Form Success Message Component
export function FormSuccessMessage({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 p-3 bg-green-50 border border-green-200 rounded-md', className)}>
      <div className="flex items-center">
        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm text-green-800">{message}</span>
      </div>
    </div>
  );
}
