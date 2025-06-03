/**
 * Unit tests for formatters utility functions
 * 
 * Following quality-first approach and TDD principles as outlined in our
 * quality gates process.
 * 
 * @stage Development
 * @quality-gate Unit Testing
 */

import { formatCurrency, formatDate, truncateText, formatFileSize } from '../formatters';

describe('Formatter Utilities', () => {
  describe('formatCurrency', () => {
    it('formats USD currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('handles negative values correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('supports different currencies and locales', () => {
      expect(formatCurrency(1234.56, 'fr-FR', 'EUR')).toMatch(/1\s?234,56\s?€/);
      // JPY typically displays without decimal places, so it may round
      expect(formatCurrency(1234.56, 'ja-JP', 'JPY')).toMatch(/￥1,234/);
    });
  });

  describe('formatDate', () => {
    // Use a fixed date for consistent testing
    const testDate = new Date(2023, 0, 15); // January 15, 2023

    it('formats date in short format correctly', () => {
      expect(formatDate(testDate, 'short')).toBe('1/15/2023');
    });

    it('formats date in medium format correctly', () => {
      expect(formatDate(testDate, 'medium')).toBe('Jan 15, 2023');
    });

    it('formats date in long format correctly', () => {
      expect(formatDate(testDate, 'long')).toContain('January 15, 2023');
    });

    it('accepts string date input', () => {
      expect(formatDate('2023-01-15', 'short')).toBe('1/15/2023');
    });

    it('accepts timestamp input', () => {
      const timestamp = testDate.getTime();
      expect(formatDate(timestamp, 'short')).toBe('1/15/2023');
    });

    it('supports different locales', () => {
      expect(formatDate(testDate, 'short', 'de-DE')).toBe('15.1.2023');
    });
  });

  describe('truncateText', () => {
    it('returns original text when shorter than max length', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('truncates text and adds ellipsis when longer than max length', () => {
      expect(truncateText('Hello, world!', 5)).toBe('Hello...');
    });

    it('handles empty strings', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('handles exact length correctly', () => {
      expect(truncateText('12345', 5)).toBe('12345');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(100)).toBe('100 Bytes');
    });

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('supports custom decimal places', () => {
      expect(formatFileSize(1536, 1)).toBe('1.5 KB');
      // Check if decimal places are respected using a RegExp instead of exact match
      expect(formatFileSize(1536, 3)).toMatch(/1\.\d{3} KB/);
    });
  });
});
