'use client';

import { useEffect } from 'react';

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

          console.log('[PWA] Service Worker registered successfully:', registration);

          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is available
                  console.log('[PWA] New service worker available');

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
            console.log('[PWA] Service worker activated');
          });
        } catch (error) {
          console.error('[PWA] Service Worker registration failed:', error);
        }
      };

      registerServiceWorker();
    }
  }, []);

  return null; // This component doesn't render anything
}
