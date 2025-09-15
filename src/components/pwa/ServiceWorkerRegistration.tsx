'use client';

import { Modal } from '@/components/ui/feedback/Modal';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { useEffect, useState } from 'react';

/**
 * Service Worker Registration Component
 * Handles PWA service worker installation and updates
 */
export function ServiceWorkerRegistration() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

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

                  import('@/lib/logger').then(({ logInfo }) =>
                    logInfo('[PWA] New service worker available')
                  );

                  // Show update modal instead of blocking confirm dialog
                  setNewWorker(newWorker);
                  setShowUpdateModal(true);
                }
              });
            }
          });

          // Handle service worker activation
          navigator.serviceWorker.addEventListener('controllerchange', () => {
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

  // Handle update confirmation
  const handleUpdateConfirm = () => {
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
    setShowUpdateModal(false);
  };

  // Handle update cancellation
  const handleUpdateCancel = () => {
    setShowUpdateModal(false);
    setNewWorker(null);
  };

  return (
    <>
      {/* PWA Update Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={handleUpdateCancel}
        title="Update Available"
        variant="default"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleUpdateCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Later
            </button>
            <button
              onClick={handleUpdateConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Update Now
            </button>
          </div>
        }
      >
        <div className="py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">New version available</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  A new version of PosalPro is available. Update now to get the latest features and
                  improvements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
