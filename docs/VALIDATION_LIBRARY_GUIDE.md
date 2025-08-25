# ✅ Reusable Validation Library Guide

## Overview

The PosalPro MVP2 validation library provides a comprehensive, reusable solution
for form validation across the entire application. It offers real-time
validation, user-friendly error messages, and consistent UI patterns.

## 🎯 Key Features

- **Real-time validation** with immediate feedback
- **User-friendly error messages** with actionable guidance
- **Consistent UI patterns** across all forms
- **Type-safe validation** with TypeScript support
- **Reusable components** for rapid development
- **Built-in validation patterns** for common use cases

## 📦 Core Components

### 1. `useFormValidation` Hook

The main validation hook that manages form state and validation logic.

```typescript
import { useFormValidation } from '@/hooks/useFormValidation';

const validation = useFormValidation(initialData, validationSchema, options);
```

**Parameters:**

- `initialData`: Initial form data
- `validationSchema`: Validation rules for each field
- `options`: Configuration options (validateOnChange, validateOnBlur,
  debounceMs)

**Returns:**

- `formData`: Current form data
- `validationErrors`: Current validation errors
- `isValid`: Whether the form is valid
- `hasErrors`: Whether there are any errors
- `handleFieldChange`: Function to handle field changes
- `handleFieldBlur`: Function to handle field blur
- `validateAll`: Function to validate all fields
- `resetForm`: Function to reset the form
- `getFieldError`: Function to get field-specific errors
- `isFieldTouched`: Function to check if field was touched
- `getFieldValidationClass`: Function to get CSS classes for validation styling

### 2. Form Field Components

Reusable form field components with built-in validation UI.

```typescript
import { FormField, FormErrorSummary, FormActions } from '@/components/ui/FormField';

<FormField
  name="email"
  label="Email Address"
  type="email"
  value={validation.formData.email}
  onChange={(value) => validation.handleFieldChange('email', value)}
  onBlur={() => validation.handleFieldBlur('email')}
  error={validation.getFieldError('email')}
  touched={validation.isFieldTouched('email')}
  required
  icon={<EnvelopeIcon className="w-5 h-5" />}
/>
```

### 3. Validation Schemas

Predefined validation schemas for common use cases.

```typescript
import { customerValidationSchema } from '@/lib/validation/customerValidation';
import { COMMON_VALIDATION_SCHEMAS } from '@/hooks/useFormValidation';
```

## 🔧 Usage Examples

### Basic Form Implementation

```typescript
'use client';

import { useFormValidation } from '@/hooks/useFormValidation';
import { FormField, FormErrorSummary } from '@/components/ui/FormField';

export function MyForm() {
  const initialData = {
    name: '',
    email: '',
    phone: '',
  };

  const validationSchema = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address',
    },
    phone: {
      required: false,
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      message: 'Please enter a valid phone number',
    },
  };

  const validation = useFormValidation(initialData, validationSchema);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validation.validateAll();
    if (Object.keys(errors).length > 0) {
      return; // Form has errors
    }

    // Submit form data
    console.log(validation.formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormErrorSummary errors={validation.validationErrors} />

      <FormField
        name="name"
        label="Name"
        value={validation.formData.name}
        onChange={(value) => validation.handleFieldChange('name', value)}
        onBlur={() => validation.handleFieldBlur('name')}
        error={validation.getFieldError('name')}
        touched={validation.isFieldTouched('name')}
        required
      />

      <FormField
        name="email"
        label="Email"
        type="email"
        value={validation.formData.email}
        onChange={(value) => validation.handleFieldChange('email', value)}
        onBlur={() => validation.handleFieldBlur('email')}
        error={validation.getFieldError('email')}
        touched={validation.isFieldTouched('email')}
        required
      />

      <button
        type="submit"
        disabled={validation.hasErrors || !validation.isValid}
      >
        Submit
      </button>
    </form>
  );
}
```

### Using Predefined Schemas

```typescript
import { COMMON_VALIDATION_SCHEMAS } from '@/hooks/useFormValidation';

const validationSchema = {
  name: COMMON_VALIDATION_SCHEMAS.name,
  email: COMMON_VALIDATION_SCHEMAS.email,
  phone: COMMON_VALIDATION_SCHEMAS.phone,
  website: COMMON_VALIDATION_SCHEMAS.website,
};
```

### Custom Validation Rules

```typescript
const validationSchema = {
  annualRevenue: {
    required: false,
    custom: (value: any) => {
      if (value !== undefined && value !== null) {
        if (value < 0) return 'Revenue cannot be negative';
        if (value === 0) return 'Revenue cannot be zero';
      }
      return null;
    },
  },
  employeeCount: {
    required: false,
    custom: (value: any) => {
      if (value !== undefined && value !== null) {
        if (value < 1) return 'Employee count must be at least 1';
        if (value > 100000) return 'Employee count seems too high';
      }
      return null;
    },
  },
};
```

## 🎨 Validation Patterns

### Built-in Patterns

```typescript
import { VALIDATION_PATTERNS } from '@/hooks/useFormValidation';

// Available patterns:
VALIDATION_PATTERNS.email; // Email validation
VALIDATION_PATTERNS.phone; // Phone number validation
VALIDATION_PATTERNS.url; // URL validation
VALIDATION_PATTERNS.numeric; // Numbers only
VALIDATION_PATTERNS.alphanumeric; // Letters and numbers
VALIDATION_PATTERNS.date; // Date format (YYYY-MM-DD)
VALIDATION_PATTERNS.time; // Time format (HH:MM)
VALIDATION_PATTERNS.zipCode; // ZIP code validation
VALIDATION_PATTERNS.currency; // Currency amount validation
```

### Built-in Messages

```typescript
import { VALIDATION_MESSAGES } from '@/hooks/useFormValidation';

// Available messages:
VALIDATION_MESSAGES.required;
VALIDATION_MESSAGES.email;
VALIDATION_MESSAGES.phone;
VALIDATION_MESSAGES.url;
VALIDATION_MESSAGES.positiveNumber;
VALIDATION_MESSAGES.nonZero;
VALIDATION_MESSAGES.minLength(min);
VALIDATION_MESSAGES.maxLength(max);
```

## 🏗️ Creating Custom Validation Schemas

### For New Entities

1. Create a validation schema file:

```typescript
// src/lib/validation/productValidation.ts
import {
  createValidationSchema,
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES,
} from '@/hooks/useFormValidation';

export const productValidationSchema = createValidationSchema({
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: 'Please enter a valid product name (2-100 characters)',
  },
  price: {
    required: true,
    custom: (value: any) => {
      if (value <= 0) return 'Price must be greater than 0';
      return null;
    },
  },
  sku: {
    required: true,
    pattern: /^[A-Z0-9]{6,12}$/,
    message: 'SKU must be 6-12 characters (uppercase letters and numbers)',
  },
});
```

2. Use in your component:

```typescript
import { productValidationSchema } from '@/lib/validation/productValidation';

const validation = useFormValidation(initialData, productValidationSchema);
```

## 🔄 Migration from Old Validation

### Before (Old Pattern)

```typescript
const [validationErrors, setValidationErrors] = useState({});

const validateField = (field: string, value: any) => {
  // Manual validation logic
  if (field === 'email' && !emailRegex.test(value)) {
    setValidationErrors(prev => ({ ...prev, email: 'Invalid email' }));
  }
};

const handleFieldChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  validateField(field, value);
};
```

### After (New Pattern)

```typescript
const validation = useFormValidation(initialData, validationSchema);

// Validation is handled automatically
const handleFieldChange = (field: string, value: any) => {
  validation.handleFieldChange(field, value);
};
```

## 🎯 Best Practices

### 1. Schema Organization

- Keep validation schemas in `src/lib/validation/`
- Use descriptive names: `customerValidationSchema`, `productValidationSchema`
- Export schemas for reuse across components

### 2. Error Messages

- Use user-friendly, actionable messages
- Provide examples when helpful: "e.g., contact@company.com"
- Be specific about requirements: "must be at least 2 characters"

### 3. Validation Timing

- Use `validateOnChange: true` for immediate feedback
- Use `validateOnBlur: true` for final validation
- Consider debouncing for performance with large forms

### 4. UI Patterns

- Always show error messages below fields
- Use red borders for error states
- Disable submit buttons when form is invalid
- Show error summary for multiple errors

### 5. Performance

- Use `useCallback` for validation functions
- Memoize validation schemas
- Avoid complex validation in render cycles

## 🧪 Testing

### Unit Testing Validation Schemas

```typescript
import { validateCustomerField } from '@/lib/validation/customerValidation';

describe('Customer Validation', () => {
  it('should validate email format', () => {
    expect(validateCustomerField('email', 'invalid')).toBeTruthy();
    expect(validateCustomerField('email', 'valid@email.com')).toBeNull();
  });
});
```

### Integration Testing Forms

```typescript
import { render, fireEvent, screen } from '@testing-library/react';
import { CustomerFormExample } from '@/components/examples/CustomerFormExample';

test('shows validation errors for invalid email', () => {
  render(<CustomerFormExample />);

  const emailInput = screen.getByLabelText(/email/i);
  fireEvent.change(emailInput, { target: { value: 'invalid' } });
  fireEvent.blur(emailInput);

  expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
});
```

## 📚 Related Documentation

- [CORE_REQUIREMENTS.md](../CORE_REQUIREMENTS.md) - Development standards
- [Form Components](../src/components/ui/FormField.tsx) - Reusable form
  components
- [Validation Hook](../src/hooks/useFormValidation.ts) - Core validation logic
- [Customer Validation](../src/lib/validation/customerValidation.ts) - Example
  implementation

## 🚀 Future Enhancements

- **Async validation** for server-side checks
- **Conditional validation** based on other field values
- **Validation groups** for complex forms
- **Internationalization** support for error messages
- **Validation analytics** for user behavior insights
