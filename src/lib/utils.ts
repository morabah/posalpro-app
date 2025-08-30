/**
 * PosalPro MVP2 - Utility Functions
 * Common utility functions for the application
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine and merge Tailwind CSS classes
 * Handles conflicts and merges classes properly
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Debounce function to limit function calls
 */
export function debounce<A extends unknown[], R>(
  func: (...args: A) => R,
  wait: number
): (...args: A) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: A) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      void func(...args);
    }, wait);
  };
}

/**
 * Throttle function to limit function calls
 */
export function throttle<A extends unknown[], R>(
  func: (...args: A) => R,
  limit: number
): (...args: A) => void {
  let inThrottle = false;

  return (...args: A) => {
    if (!inThrottle) {
      void func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(dateObj);
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format plain numbers with grouping and optional precision
 */
export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    ...options,
  }).format(safeValue);
}

/**
 * Format date in UTC with sensible defaults
 */
export function formatDateUTC(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid Date';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    }).format(d);
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + '...' : str;
}
