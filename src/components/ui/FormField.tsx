'use client';

import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';

// ✅ Form Field Props Interface
export interface FormFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea';
  value?: any; // Optional for RHF/uncontrolled compatibility
  onChange?: (value: any | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; // Supports both value and event signatures
  onBlur?: (...args: any[]) => void; // Updated for React Hook Form compatibility
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
    },
    ref
  ) => {
    const hasError = error && touched;
    const fieldId = `field-${name}`;

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

      // If no value prop is provided, assume React Hook Form/uncontrolled usage.
      // Pass through the raw event so libraries expecting e.target.name/value work.
      if (typeof value === 'undefined') {
        onChange?.(e);
        return;
      }

      // Controlled usage: derive the new value and pass it up.
      let newValue: any = e.target.value;
      if (type === 'number') {
        newValue = e.target.value !== '' ? parseFloat(e.target.value) : undefined;
      }
      onChange?.(newValue);
    };

    const handleBlur = (...args: any[]) => {
      if (onBlur) {
        onBlur(...args);
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
              ref={ref as React.RefObject<HTMLTextAreaElement>}
              id={fieldId}
              name={name}
              // Avoid forcing controlled mode when value is undefined (RHF compatibility)
              value={value !== undefined ? value : undefined}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(baseInputClasses, 'resize-none min-h-[80px]', { 'pl-8': icon })}
              rows={3}
            />
          ) : (
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              id={fieldId}
              name={name}
              type={type}
              // Avoid forcing controlled mode when value is undefined (RHF compatibility)
              value={value !== undefined ? value : undefined}
              onChange={handleChange}
              onBlur={handleBlur}
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
