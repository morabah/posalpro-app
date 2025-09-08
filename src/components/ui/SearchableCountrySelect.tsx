/**
 * PosalPro MVP2 - Searchable Country Select Component
 * Dynamic country dropdown with search functionality
 * WCAG 2.1 AA compliant with proper keyboard navigation
 *
 * Features:
 * - Dynamic filtering as user types (first letter, first + second letter)
 * - Flag emojis for visual identification
 * - Keyboard navigation and accessibility
 * - React Hook Form integration (both context and direct props)
 * - Performance optimized with useMemo
 */

'use client';

import { Select, SelectOption } from '@/components/ui/forms/Select';
import { countries, countryUtils } from '@/lib/data/countries';
import { useMemo } from 'react';

interface SearchableCountrySelectProps {
  /**
   * Field name for React Hook Form
   */
  name: string;

  /**
   * Select label
   */
  label?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Required field indicator
   */
  required?: boolean;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Error message override
   */
  error?: string;

  /**
   * Direct form props (alternative to useFormContext)
   */
  register?: any;
  setValue?: any;
  watch?: any;
  formErrors?: any;
}

/**
 * Searchable Country Select Component
 * Complies with CORE_REQUIREMENTS.md patterns and accessibility standards
 */
export function SearchableCountrySelect({
  name,
  label = 'Country',
  placeholder = 'Select or search country...',
  required = false,
  disabled = false,
  className,
  size = 'md',
  error,
  register: directRegister,
  setValue: directSetValue,
  watch: directWatch,
  formErrors: directFormErrors,
}: SearchableCountrySelectProps) {
  // Use direct props - they are provided by the parent components
  const register = directRegister;
  const setValue = directSetValue;
  const watch = directWatch;
  const errors = directFormErrors;
  const currentValue = watch ? watch(name) : undefined;
  const fieldError =
    error || (typeof errors?.[name]?.message === 'string' ? errors[name]?.message : undefined);

  // Convert countries to SelectOption format with flag emojis
  const countryOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: 'Select Country', disabled: true },
      ...countries
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(country => ({
          value: country.name,
          label: countryUtils.getDisplayName(country),
          icon: country.flag ? (
            <span className="text-lg" role="img" aria-label={`${country.name} flag`}>
              {country.flag}
            </span>
          ) : undefined,
          description: `ISO Code: ${country.code}`,
        })),
    ],
    []
  );

  // Handle value changes
  const handleChange = (value: string | string[]) => {
    const selectedValue = Array.isArray(value) ? value[0] : value;
    if (setValue) {
      setValue(name, selectedValue || '', {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  // Register the field with React Hook Form
  const { onChange, ...registerProps } = register(name, {
    required: required ? `${label} is required` : false,
  });

  return (
    <div className={className}>
      <Select
        options={countryOptions}
        value={currentValue || ''}
        onChange={handleChange}
        placeholder={placeholder}
        label={label}
        searchable={true}
        clearable={true}
        size={size}
        disabled={disabled}
        error={fieldError}
        className="w-full"
        id={`country-select-${name}`}
      />

      {/* Hidden input for React Hook Form compatibility */}
      <input
        type="hidden"
        {...registerProps}
        value={currentValue || ''}
        onChange={e => {
          if (setValue) {
            setValue(name, e.target.value, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        }}
      />
    </div>
  );
}

SearchableCountrySelect.displayName = 'SearchableCountrySelect';
