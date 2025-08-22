'use client';

import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues with service worker registration
const ServiceWorkerRegistration = dynamic(
  () =>
    import('@/components/pwa/ServiceWorkerRegistration').then(mod => ({
      default: mod.ServiceWorkerRegistration,
    })),
  { ssr: false }
);

export function ServiceWorkerWrapper() {
  return <ServiceWorkerRegistration />;
}


