/**
 * Design System & Tokens for Executive Dashboard
 * Centralized design tokens and utility functions
 */

// Enhanced Color Scheme and Design System
export const DESIGN_TOKENS = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    neutral: {
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
    gradient: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      danger: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      dark: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      light: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    xxl: '4rem',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
};

// ─── Shared formatters (use across cards/charts) ───────────────────────────────
export const formatCurrency = (amount: number) => {
  const v = isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: v >= 1_000_000 ? 'compact' : 'standard',
  }).format(v);
};

export const formatPercentage = (value: number, digits: number = 1) => {
  const v = isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v / 100);
};

export const formatNumber = (value: number, decimals: number = 1) => {
  const v = isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(v);
};

interface SparklineDataPoint {
  actual?: number;
  period?: string;
  target?: number;
  forecast?: number;
  [key: string]: unknown;
}

// Simple sparkline to visualize revenue trends
export const RevenueSparkline = ({ data }: { data: unknown[] }) => {
  if (!data || data.length === 0) return null;
  const values = data.slice(-6).map(d => (d as { actual?: number }).actual || 0);
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
};
