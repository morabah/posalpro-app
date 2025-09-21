'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';

// Dynamic import to prevent SSR issues with service worker registration
const ServiceWorkerRegistration = dynamic(
  () =>
    import('@/components/pwa/ServiceWorkerRegistration').then(mod => ({
      default: mod.ServiceWorkerRegistration,
    })),
  { ssr: false }
);

const isProd = process.env.NODE_ENV === 'production';

export function ServiceWorkerWrapper() {
  // In development, aggressively unregister any existing SW to avoid stale chunk caches
  useEffect(() => {
    if (!isProd && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        if (regs.length > 0) {
          Promise.all(regs.map(r => r.unregister()))
            .then(() => {
              if ('caches' in window) {
                return caches
                  .keys()
                  .then(keys => Promise.all(keys.map(k => caches.delete(k))))
                  .catch(() => void 0);
              }
            })
            .finally(() => {
              // Ensure page is no longer controlled by SW
              window.location.reload();
            });
        }
      });
    }
  }, []);

  if (!isProd) return null;

  return <ServiceWorkerRegistration />;
}

