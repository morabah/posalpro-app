/**
 * PosalPro Design System Tokens
 * Based on blue primary color (#2563EB) and professional enterprise aesthetic
 * Integrates with wireframe specifications and accessibility requirements
 */

export const colorTokens = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb', // Primary brand color
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },

  // Neutral grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

export const typographyTokens = {
  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'ui-monospace', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const spacingTokens = {
  // Standard spacing scale
  0: '0px',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px - label-input gaps
  3: '0.75rem', // 12px
  4: '1rem', // 16px - element spacing
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px - content padding
  8: '2rem', // 32px
  10: '2.5rem', // 40px - input height
  11: '2.75rem', // 44px - button height (accessibility)
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
};

export const borderRadiusTokens = {
  none: '0px',
  sm: '0.125rem',
  DEFAULT: '0.375rem', // 6px - standard form elements
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
};

export const shadowTokens = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

export const breakpointTokens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

/**
 * Component-specific design tokens
 * Based on wireframe specifications for forms and UI elements
 */
export const componentTokens = {
  // Form elements based on wireframe specs
  form: {
    inputHeight: '2.5rem', // 40px
    buttonHeight: '2.75rem', // 44px for accessibility
    labelGap: '0.5rem', // 8px
    elementSpacing: '1rem', // 16px
    contentPadding: '1.5rem', // 24px
  },

  // Border radius for consistency
  borderRadius: {
    form: '0.375rem', // 6px for all form elements
    card: '0.5rem', // 8px for cards
    button: '0.375rem', // 6px for buttons
  },

  // Z-index scale for layering
  zIndex: {
    dropdown: 10,
    modal: 50,
    notification: 100,
    tooltip: 200,
  },
};
