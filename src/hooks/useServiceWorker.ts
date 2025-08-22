/**
 * PosalPro MVP2 - Service Worker Hook
 * React hook for managing service worker functionality
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug } from '@/lib/logger';
import {
  ServiceWorkerConfig,
  serviceWorkerManager,
  ServiceWorkerStatus,
} from '@/lib/offline/ServiceWorkerManager';
import { useCallback, useEffect, useState } from 'react';

export interface UseServiceWorkerReturn {
  status: ServiceWorkerStatus;
  config: ServiceWorkerConfig;
  isOnline: boolean;
  updateAvailable: boolean;
  cacheInfo: Array<{ name: string; size: number }>;

  // Actions
  initialize: () => Promise<boolean>;
  updateServiceWorker: () => Promise<boolean>;
  clearCaches: () => Promise<boolean>;
  queueForSync: (action: string, data: Record<string, unknown>) => Promise<boolean>;
  updateConfig: (config: Partial<ServiceWorkerConfig>) => void;
  unregister: () => Promise<boolean>;

  // Cache management
  refreshCacheInfo: () => Promise<void>;
}

export function useServiceWorker(autoInitialize: boolean = true): UseServiceWorkerReturn {
  const [status, setStatus] = useState<ServiceWorkerStatus>(serviceWorkerManager.getStatus());
  const [config, setConfig] = useState<ServiceWorkerConfig>(serviceWorkerManager.getConfig());
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<Array<{ name: string; size: number }>>([]);

  // Initialize service worker
  const initialize = useCallback(async (): Promise<boolean> => {
    const result = await serviceWorkerManager.initialize();
    setStatus(serviceWorkerManager.getStatus());
    return result;
  }, []);

  // Update service worker
  const updateServiceWorker = useCallback(async (): Promise<boolean> => {
    const result = await serviceWorkerManager.updateServiceWorker();
    if (result) {
      setUpdateAvailable(false);
    }
    return result;
  }, []);

  // Refresh cache information
  const refreshCacheInfo = useCallback(async (): Promise<void> => {
    const info = await serviceWorkerManager.getCacheInfo();
    setCacheInfo(info);
  }, []);

  // Clear all caches
  const clearCaches = useCallback(async (): Promise<boolean> => {
    const result = await serviceWorkerManager.clearCaches();
    if (result) {
      await refreshCacheInfo();
    }
    return result;
  }, [refreshCacheInfo]);

  // Queue action for background sync
  const queueForSync = useCallback(
    async (action: string, data: Record<string, unknown>): Promise<boolean> => {
      return await serviceWorkerManager.queueForSync(action, data);
    },
    []
  );

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<ServiceWorkerConfig>): void => {
    serviceWorkerManager.updateConfig(newConfig);
    setConfig(serviceWorkerManager.getConfig());
  }, []);

  // Unregister service worker
  const unregister = useCallback(async (): Promise<boolean> => {
    const result = await serviceWorkerManager.unregister();
    setStatus(serviceWorkerManager.getStatus());
    return result;
  }, []);

  // Setup event listeners
  useEffect(() => {
    const handleStatusUpdate = (newStatus: ServiceWorkerStatus) => {
      setStatus(newStatus);
    };

    const handleConfigChange = (newConfig: ServiceWorkerConfig) => {
      setConfig(newConfig);
    };

    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    const handleCacheUpdated = () => {
      refreshCacheInfo();
    };

    // Register event listeners
    serviceWorkerManager.on('initialized', handleStatusUpdate);
    serviceWorkerManager.on('activated', handleStatusUpdate);
    serviceWorkerManager.on('updateavailable', handleUpdateAvailable);
    serviceWorkerManager.on('online', handleStatusUpdate);
    serviceWorkerManager.on('offline', handleStatusUpdate);
    serviceWorkerManager.on('configchanged', handleConfigChange);
    serviceWorkerManager.on('cacheupdated', handleCacheUpdated);
    serviceWorkerManager.on('cachecleared', handleStatusUpdate);
    serviceWorkerManager.on('unregistered', handleStatusUpdate);

    // Auto-initialize if requested
    if (autoInitialize && status.isSupported && !status.isRegistered) {
      initialize();
    }

    // Initial cache info load
    refreshCacheInfo();

    // Cleanup event listeners
    return () => {
      serviceWorkerManager.off('initialized', handleStatusUpdate);
      serviceWorkerManager.off('activated', handleStatusUpdate);
      serviceWorkerManager.off('updateavailable', handleUpdateAvailable);
      serviceWorkerManager.off('online', handleStatusUpdate);
      serviceWorkerManager.off('offline', handleStatusUpdate);
      serviceWorkerManager.off('configchanged', handleConfigChange);
      serviceWorkerManager.off('cacheupdated', handleCacheUpdated);
      serviceWorkerManager.off('cachecleared', handleStatusUpdate);
      serviceWorkerManager.off('unregistered', handleStatusUpdate);
    };
  }, [autoInitialize, initialize, refreshCacheInfo, status.isSupported, status.isRegistered]);

  return {
    status,
    config,
    isOnline: !status.isOffline,
    updateAvailable,
    cacheInfo,

    // Actions
    initialize,
    updateServiceWorker,
    clearCaches,
    queueForSync,
    updateConfig,
    unregister,

    // Cache management
    refreshCacheInfo,
  };
}

/**
 * Hook for offline-first data operations
 */
export function useOfflineSync() {
  const { queueForSync, isOnline } = useServiceWorker();

  const syncAction = useCallback(
    async (action: string, data: Record<string, unknown>) => {
      if (isOnline) {
        // Execute immediately if online
        try {
          logDebug('Executing action online:', { action, data });
          return { success: true, immediate: true };
        } catch {
          // Queue for later if immediate execution fails
          const queued = await queueForSync(action, data);
          return { success: queued, immediate: false, queued };
        }
      } else {
        // Queue for when back online
        const queued = await queueForSync(action, data);
        return { success: queued, immediate: false, queued };
      }
    },
    [isOnline, queueForSync]
  );

  return {
    syncAction,
    isOnline,
  };
}

/**
 * Hook for cache management
 */
export function useCacheManagement() {
  const { cacheInfo, clearCaches, refreshCacheInfo } = useServiceWorker(false);

  const totalCacheSize = cacheInfo.reduce((total, cache) => total + cache.size, 0);

  const clearSpecificCache = useCallback(
    async (cacheName: string): Promise<boolean> => {
      try {
        const result = await caches.delete(cacheName);
        if (result) {
          await refreshCacheInfo();
        }
        return result;
      } catch (error) {
        ErrorHandlingService.getInstance().processError(
          error as Error,
          'Failed to clear specific cache',
          ErrorCodes.SYSTEM.INTERNAL_ERROR,
          {
            component: 'useServiceWorker',
            operation: 'clearSpecificCache',
            cacheName,
          }
        );
        return false;
      }
    },
    [refreshCacheInfo]
  );

  return {
    cacheInfo,
    totalCacheSize,
    clearCaches,
    clearSpecificCache,
    refreshCacheInfo,
  };
}
