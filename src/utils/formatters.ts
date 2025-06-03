/**
 * Utility functions for formatting data
 * 
 * These functions follow the functional programming patterns established in our
 * code quality foundation and include proper TypeScript type definitions.
 */

/**
 * Formats a number as currency
 * @param value - The numeric value to format
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @param currency - The currency code (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  locale: string = 'en-US',
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a date according to the specified format
 * @param date - Date to format
 * @param format - Format style (default: 'medium')
 * @param locale - Locale to use (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  format: 'short' | 'medium' | 'long' = 'medium',
  locale: string = 'en-US'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  let options: Intl.DateTimeFormatOptions;
  
  switch (format) {
    case 'short':
      options = { year: 'numeric', month: 'numeric', day: 'numeric' };
      break;
    case 'medium':
      options = { year: 'numeric', month: 'short', day: 'numeric' };
      break;
    case 'long':
      options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
      break;
    default:
      options = { year: 'numeric', month: 'short', day: 'numeric' };
  }
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Truncates text to a specified length and adds ellipsis if needed
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if necessary
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Format file size in bytes to human-readable string
 * 
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Calculate the value
  const value = bytes / Math.pow(k, i);
  
  // Apply formatting based on whether it's a whole number and decimals parameter
  if (Number.isInteger(value) && decimals === 2) {
    // If it's a whole number and we're using the default decimal places, show as integer
    return `${value} ${sizes[i]}`;
  } else {
    // Otherwise respect the decimals parameter exactly
    return `${value.toFixed(decimals)} ${sizes[i]}`;
  }
}
