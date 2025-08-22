/**
 * PosalPro MVP2 - Service Worker Manager
 * Handles service worker registration, updates, and offline capabilities
 */

import { logDebug, logWarn, logError } from '@/lib/logger';

export interface ServiceWorkerConfig {
  enabled: boolean;
  updateCheckInterval: number;
  cacheStrategy: 'aggressive' | 'conservative' | 'minimal';
  offlineSupport: boolean;
  backgroundSync: boolean;
  pushNotifications: boolean;
}

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  hasUpdate: boolean;
  isOffline: boolean;
  cacheSize: number;
  lastUpdate: Date | null;
}

// Typed event payloads for the manager events
interface SwEventPayloads {
  initialized: ServiceWorkerStatus;
  activated: ServiceWorkerStatus;
  online: ServiceWorkerStatus;
  offline: ServiceWorkerStatus;
  updateavailable: ServiceWorkerStatus;
  cachecleared: ServiceWorkerStatus;
  unregistered: ServiceWorkerStatus;
  configchanged: ServiceWorkerConfig;
  cacheupdated: { size: number };
  updatefound: ServiceWorkerStatus;
  error: unknown;
  offlineready: ServiceWorkerStatus;
}

// Public API that both the browser manager and the SSR stub must implement
export interface ServiceWorkerPublicAPI {
  initialize(): Promise<boolean>;
  updateServiceWorker(): Promise<boolean>;
  getCacheInfo(): Promise<Array<{ name: string; size: number }>>;
  clearCaches(): Promise<boolean>;
  queueForSync(action: string, data: Record<string, unknown>): Promise<boolean>;
  getStatus(): ServiceWorkerStatus;
  getConfig(): ServiceWorkerConfig;
  updateConfig(newConfig: Partial<ServiceWorkerConfig>): void;
  unregister(): Promise<boolean>;
  on<E extends keyof SwEventPayloads>(event: E, callback: (data: SwEventPayloads[E]) => void): void;
  off<E extends keyof SwEventPayloads>(
    event: E,
    callback: (data: SwEventPayloads[E]) => void
  ): void;
}

class ServiceWorkerManager implements ServiceWorkerPublicAPI {
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig;
  private status: ServiceWorkerStatus;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(config: Partial<ServiceWorkerConfig> = {}) {
    this.config = {
      enabled: true,
      updateCheckInterval: 60000, // 1 minute
      cacheStrategy: 'conservative',
      offlineSupport: true,
      backgroundSync: true,
      pushNotifications: false,
      ...config,
    };

    this.status = {
      isSupported: this.isServiceWorkerSupported(),
      isRegistered: false,
      isActive: false,
      hasUpdate: false,
      isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
      cacheSize: 0,
      lastUpdate: null,
    };

    this.setupEventListeners();
  }

  /**
   * Initialize and register the service worker
   */
  async initialize(): Promise<boolean> {
    if (!this.config.enabled || !this.status.isSupported) {
      logDebug('[SW Manager] Service worker not enabled or supported');
      return false;
    }

    try {
      logDebug('[SW Manager] Registering service worker...');

      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      this.status.isRegistered = true;
      this.status.lastUpdate = new Date();

      // Setup registration event listeners
      this.setupRegistrationListeners();

      // Check for updates periodically
      this.startUpdateChecker();

      // Setup background sync if supported
      if (this.config.backgroundSync && 'sync' in window.ServiceWorkerRegistration.prototype) {
        await this.setupBackgroundSync();
      }

      this.emit('initialized', this.status);
      logDebug('[SW Manager] Service worker initialized successfully');

      return true;
    } catch (error) {
      logError('[SW Manager] Failed to register service worker:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Check if service workers are supported
   */
  private isServiceWorkerSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      'caches' in window
    );
  }

  /**
   * Setup event listeners for online/offline status
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.status.isOffline = false;
      this.emit('online', this.status);
      logDebug('[SW Manager] Back online');
    });

    window.addEventListener('offline', () => {
      this.status.isOffline = true;
      this.emit('offline', this.status);
      logDebug('[SW Manager] Gone offline');
    });
  }

  /**
   * Setup service worker registration event listeners
   */
  private setupRegistrationListeners(): void {
    if (!this.registration) return;

    this.registration.addEventListener('updatefound', () => {
      logDebug('[SW Manager] Service worker update found');
      this.status.hasUpdate = true;
      this.emit('updatefound', this.status);

      const installingWorker = this.registration!.installing;
      if (installingWorker) {
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              logDebug('[SW Manager] New service worker available');
              this.emit('updateavailable', this.status);
            } else {
              logDebug('[SW Manager] Service worker installed for first time');
              this.status.isActive = true;
              this.emit('activated', this.status);
            }
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
      this.handleServiceWorkerMessage(event);
    });
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const data: unknown = (event as MessageEvent<unknown>).data;

    interface CacheUpdatedMessage {
      type: 'CACHE_UPDATED';
      size: number;
    }
    interface OfflineReadyMessage {
      type: 'OFFLINE_READY';
    }

    const isObject = (val: unknown): val is Record<string, unknown> =>
      typeof val === 'object' && val !== null;

    const isCacheUpdated = (val: unknown): val is CacheUpdatedMessage =>
      isObject(val) &&
      (val as { type?: unknown }).type === 'CACHE_UPDATED' &&
      typeof (val as { size?: unknown }).size === 'number';

    const isOfflineReady = (val: unknown): val is OfflineReadyMessage =>
      isObject(val) && (val as { type?: unknown }).type === 'OFFLINE_READY';

    if (isCacheUpdated(data)) {
      this.status.cacheSize = data.size;
      this.emit('cacheupdated', { size: data.size });
      return;
    }

    if (isOfflineReady(data)) {
      logDebug('[SW Manager] Offline functionality ready');
      this.emit('offlineready', this.status);
      return;
    }
    // Ignore unknown message shapes
  }

  /**
   * Start periodic update checker
   */
  private startUpdateChecker(): void {
    setInterval(async () => {
      if (this.registration) {
        try {
          await this.registration.update();
        } catch (error) {
          logError('[SW Manager] Update check failed:', error);
        }
      }
    }, this.config.updateCheckInterval);
  }

  /**
   * Setup background sync
   */
  private async setupBackgroundSync(): Promise<void> {
    if (!this.registration) return;

    try {
      // Check if background sync is supported
      if ('sync' in this.registration) {
        await (
          this.registration as ServiceWorkerRegistration & {
            sync: { register: (tag: string) => Promise<void> };
          }
        ).sync.register('background-sync');
        logDebug('[SW Manager] Background sync registered');
      }
    } catch (error) {
      logError('[SW Manager] Background sync registration failed:', error);
    }
  }

  /**
   * Update the service worker
   */
  async updateServiceWorker(): Promise<boolean> {
    if (!this.registration) {
      logWarn('[SW Manager] No registration available for update');
      return false;
    }

    try {
      await this.registration.update();

      if (this.registration.waiting) {
        // Tell the waiting service worker to skip waiting
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Reload the page to activate the new service worker
        window.location.reload();
        return true;
      }

      return false;
    } catch (error) {
      logError('[SW Manager] Service worker update failed:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Get cache information
   */
  async getCacheInfo(): Promise<Array<{ name: string; size: number }>> {
    if (!this.status.isSupported) return [];

    try {
      const cacheNames = await caches.keys();
      const cacheInfo = await Promise.all(
        cacheNames.map(async name => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return { name, size: keys.length };
        })
      );

      return cacheInfo;
    } catch (error) {
      logError('[SW Manager] Failed to get cache info:', error);
      return [];
    }
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<boolean> {
    if (!this.status.isSupported) return false;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));

      this.status.cacheSize = 0;
      this.emit('cachecleared', this.status);
      logDebug('[SW Manager] All caches cleared');

      return true;
    } catch (error) {
      logError('[SW Manager] Failed to clear caches:', error);
      return false;
    }
  }

  /**
   * Queue an action for background sync
   */
  async queueForSync(action: string, data: Record<string, unknown>): Promise<boolean> {
    if (!this.config.backgroundSync || !this.registration) return false;

    try {
      // Store the action in IndexedDB or localStorage for the service worker to process
      const queueData = {
        id: Date.now().toString(),
        action,
        data,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(`sw-queue-${queueData.id}`, JSON.stringify(queueData));

      // Register for background sync
      if ('sync' in this.registration) {
        await (
          this.registration as ServiceWorkerRegistration & {
            sync: { register: (tag: string) => Promise<void> };
          }
        ).sync.register('background-sync');
      }

      logDebug('[SW Manager] Action queued for background sync:', { action });
      return true;
    } catch (error) {
      logError('[SW Manager] Failed to queue action for sync:', error);
      return false;
    }
  }

  /**
   * Get current status
   */
  getStatus(): ServiceWorkerStatus {
    return { ...this.status };
  }

  /**
   * Get current configuration
   */
  getConfig(): ServiceWorkerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ServiceWorkerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configchanged', this.config);
  }

  /**
   * Event emitter functionality
   */
  // Overloads: typed events, plus generic fallback for SSR compatibility
  on<E extends keyof SwEventPayloads>(event: E, callback: (data: SwEventPayloads[E]) => void): void;
  on(event: string, callback: (data?: unknown) => void): void;
  on(event: string, callback: (data?: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    // The Set stores listeners with unknown payload for broad compatibility
    this.listeners.get(event)!.add(callback as (data: unknown) => void);
  }

  off<E extends keyof SwEventPayloads>(
    event: E,
    callback: (data: SwEventPayloads[E]) => void
  ): void;
  off(event: string, callback: (data?: unknown) => void): void;
  off(event: string, callback: (data?: unknown) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback as (data: unknown) => void);
    }
  }

  private emit<E extends keyof SwEventPayloads>(event: E, data: SwEventPayloads[E]): void {
    const eventListeners = this.listeners.get(event as string);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          // Listeners are stored as (unknown) => void; pass the typed payload
          (callback as (d: SwEventPayloads[E]) => void)(data);
        } catch (error) {
          logError(`[SW Manager] Error in event listener for ${String(event)}:`, error);
        }
      });
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();

      if (result) {
        this.status.isRegistered = false;
        this.status.isActive = false;
        this.registration = null;
        this.emit('unregistered', this.status);
        logDebug('[SW Manager] Service worker unregistered');
      }

      return result;
    } catch (error) {
      logError('[SW Manager] Failed to unregister service worker:', error);
      return false;
    }
  }
}

// Export lazy-loaded singleton instance to prevent SSR errors
let _serviceWorkerManager: ServiceWorkerManager | null = null;

// Create the stub object outside the function to avoid circular reference
const createStub = (): ServiceWorkerPublicAPI => {
  const defaultConfig: ServiceWorkerConfig = {
    enabled: false,
    updateCheckInterval: 60000,
    cacheStrategy: 'conservative',
    offlineSupport: false,
    backgroundSync: false,
    pushNotifications: false,
  };

  return {
    initialize: () => Promise.resolve(false),
    updateServiceWorker: () => Promise.resolve(false),
    getCacheInfo: () => Promise.resolve([]),
    clearCaches: () => Promise.resolve(false),
    queueForSync: () => Promise.resolve(false),
    getStatus: () => ({
      isSupported: false,
      isRegistered: false,
      isActive: false,
      hasUpdate: false,
      isOffline: false,
      cacheSize: 0,
      lastUpdate: null,
    }),
    getConfig: () => ({ ...defaultConfig }),
    updateConfig: () => {
      /* no-op on server */
    },
    // Provide generic implementations that satisfy the typed signatures
    on: () => {
      /* no-op on server */
    },
    off: () => {
      /* no-op on server */
    },
    unregister: () => Promise.resolve(false),
  };
};

export const serviceWorkerManager: ServiceWorkerPublicAPI = (() => {
  // Enhanced SSR protection - check for both window and self
  if (typeof window === 'undefined' || typeof self === 'undefined') {
    // Return a mock object during SSR
    return createStub();
  }

  // Only create the manager if we're in a browser environment
  if (!_serviceWorkerManager && typeof window !== 'undefined') {
    try {
      _serviceWorkerManager = new ServiceWorkerManager();
    } catch (error) {
      logWarn('[ServiceWorkerManager] Failed to initialize:', { error: error instanceof Error ? error.message : String(error) });
      // Return stub if initialization fails
      return createStub();
    }
  }
  return _serviceWorkerManager || createStub(); // Fallback to stub
})();

// Export class for custom instances
export { ServiceWorkerManager };
