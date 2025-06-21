import { logger } from '@/utils/logger';/**
 * PosalPro MVP2 - Analytics Storage Cleanup Utility
 * Provides manual cleanup functions for development and troubleshooting
 */

export const clearAnalyticsStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Clear all analytics-related data
      Object.keys(localStorage).forEach(key => {
        if (
          key.startsWith('dashboard_analytics') ||
          key.startsWith('analytics_session') ||
          key.includes('analytics')
        ) {
          localStorage.removeItem(key);
        }
      });

      logger.info('✅ Analytics storage cleared successfully');
      return true;
    }
  } catch (error) {
    logger.error('❌ Failed to clear analytics storage:', error);
    return false;
  }
  return false;
};

export const getStorageUsage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      let totalSize = 0;
      let analyticsSize = 0;

      Object.keys(localStorage).forEach(key => {
        const value = localStorage.getItem(key) || '';
        const keySize = key.length + value.length;
        totalSize += keySize;

        if (key.startsWith('dashboard_analytics') || key.startsWith('analytics_session')) {
          analyticsSize += keySize;
        }
      });

      return {
        total: totalSize,
        analytics: analyticsSize,
        percentage: totalSize > 0 ? (analyticsSize / totalSize) * 100 : 0,
        formatted: {
          total: `${(totalSize / 1024).toFixed(2)} KB`,
          analytics: `${(analyticsSize / 1024).toFixed(2)} KB`,
        },
      };
    }
  } catch (error) {
    logger.error('Failed to calculate storage usage:', error);
  }

  return null;
};

// Development helper - can be called from browser console
if (typeof window !== 'undefined') {
  (window as any).clearAnalyticsStorage = clearAnalyticsStorage;
  (window as any).getStorageUsage = getStorageUsage;
}
