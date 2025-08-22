'use client';

import { useEffect } from 'react';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';

/**
 * Service Worker Registration Component
 * Handles PWA service worker installation and updates
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          import('@/lib/logger').then(({ logInfo }) =>
            logInfo('[PWA] Service Worker registered successfully', { scope: registration.scope })
          );

          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is available
                  // eslint-disable-next-line @typescript-eslint/no-floating-promises
                  import('@/lib/logger').then(({ logInfo }) =>
                    logInfo('[PWA] New service worker available')
                  );

                  // You can show a notification to the user here
                  if (
                    confirm('A new version of PosalPro is available. Would you like to update?')
                  ) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Handle service worker activation
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            import('@/lib/logger').then(({ logInfo }) => logInfo('[PWA] Service worker activated'));
          });
        } catch (error) {
          ErrorHandlingService.getInstance().processError(
            error as Error,
            'Service Worker registration failed',
            ErrorCodes.SYSTEM.INITIALIZATION_FAILED,
            {
              component: 'ServiceWorkerRegistration',
              operation: 'registerServiceWorker',
            }
          );
        }
      };

      registerServiceWorker();
    }
  }, []);

  return null; // This component doesn't render anything
}
