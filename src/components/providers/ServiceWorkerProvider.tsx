'use client';

/**
 * PosalPro MVP2 - Service Worker Provider
 * Initializes and manages service worker functionality
 */

import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
  enableNotifications?: boolean;
  enableAutoUpdate?: boolean;
}

export function ServiceWorkerProvider({ 
  children, 
  enableNotifications = true,
  enableAutoUpdate = false 
}: ServiceWorkerProviderProps) {
  const {
    status,
    isOnline,
    updateAvailable,
    initialize,
    updateServiceWorker,
  } = useServiceWorker(false); // Don't auto-initialize

  const [hasShownOfflineNotice, setHasShownOfflineNotice] = useState(false);
  const [hasShownUpdateNotice, setHasShownUpdateNotice] = useState(false);

  // Initialize service worker on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && status.isSupported) {
      initialize().then(success => {
        if (success && enableNotifications) {
          console.log('Service worker initialized successfully');
        }
      });
    }
  }, [initialize, status.isSupported, enableNotifications]);

  // Handle online/offline status changes
  useEffect(() => {
    if (!enableNotifications) return;

    if (!isOnline && !hasShownOfflineNotice) {
      toast.warning('You are currently offline. Some features may be limited.', {
        duration: 5000,
        action: {
          label: 'Dismiss',
          onClick: () => setHasShownOfflineNotice(true),
        },
      });
      setHasShownOfflineNotice(true);
    } else if (isOnline && hasShownOfflineNotice) {
      toast.success('You are back online!', {
        duration: 3000,
      });
      setHasShownOfflineNotice(false);
    }
  }, [isOnline, hasShownOfflineNotice, enableNotifications]);

  // Handle service worker updates
  useEffect(() => {
    if (!enableNotifications || !updateAvailable || hasShownUpdateNotice) return;

    if (enableAutoUpdate) {
      // Auto-update without user interaction
      updateServiceWorker().then(success => {
        if (success) {
          toast.success('App updated successfully!', { duration: 3000 });
        }
      });
    } else {
      // Show update notification with user action
      toast.info('A new version of the app is available!', {
        duration: 10000,
        action: {
          label: 'Update',
          onClick: () => {
            updateServiceWorker().then(success => {
              if (success) {
                toast.success('Updating app...', { duration: 2000 });
              }
            });
          },
        },
      });
    }

    setHasShownUpdateNotice(true);
  }, [updateAvailable, hasShownUpdateNotice, enableNotifications, enableAutoUpdate, updateServiceWorker]);

  // Add global offline indicator
  const OfflineIndicator = () => {
    if (isOnline) return null;

    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white text-center py-2 text-sm font-medium">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>You are offline - Some features may be limited</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <OfflineIndicator />
      {children}
    </>
  );
}

/**
 * Service Worker Status Component
 * Shows current service worker status (for debugging/admin)
 */
export function ServiceWorkerStatus() {
  const { status, config, cacheInfo, isOnline } = useServiceWorker(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white text-xs p-3 rounded-lg max-w-xs">
      <div className="font-semibold mb-2">Service Worker Status</div>
      <div className="space-y-1">
        <div>Supported: {status.isSupported ? '✅' : '❌'}</div>
        <div>Registered: {status.isRegistered ? '✅' : '❌'}</div>
        <div>Active: {status.isActive ? '✅' : '❌'}</div>
        <div>Online: {isOnline ? '✅' : '❌'}</div>
        <div>Caches: {cacheInfo.length}</div>
        <div>Strategy: {config.cacheStrategy}</div>
      </div>
    </div>
  );
}
