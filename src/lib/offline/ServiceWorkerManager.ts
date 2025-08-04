/**
 * PosalPro MVP2 - Service Worker Manager
 * Handles service worker registration, updates, and offline capabilities
 */

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

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig;
  private status: ServiceWorkerStatus;
  private listeners: Map<string, Set<(data?: unknown) => void>> = new Map();

  constructor(config: Partial<ServiceWorkerConfig> = {}) {
    this.config = {
      enabled: true,
      updateCheckInterval: 60000, // 1 minute
      cacheStrategy: 'conservative',
      offlineSupport: true,
      backgroundSync: true,
      pushNotifications: false,
      ...config
    };

    this.status = {
      isSupported: this.isServiceWorkerSupported(),
      isRegistered: false,
      isActive: false,
      hasUpdate: false,
      isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
      cacheSize: 0,
      lastUpdate: null
    };

    this.setupEventListeners();
  }

  /**
   * Initialize and register the service worker
   */
  async initialize(): Promise<boolean> {
    if (!this.config.enabled || !this.status.isSupported) {
      console.log('[SW Manager] Service worker not enabled or supported');
      return false;
    }

    try {
      console.log('[SW Manager] Registering service worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
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
      console.log('[SW Manager] Service worker initialized successfully');
      
      return true;
    } catch (error) {
      console.error('[SW Manager] Failed to register service worker:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Check if service workers are supported
   */
  private isServiceWorkerSupported(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'caches' in window;
  }

  /**
   * Setup event listeners for online/offline status
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.status.isOffline = false;
      this.emit('online', this.status);
      console.log('[SW Manager] Back online');
    });

    window.addEventListener('offline', () => {
      this.status.isOffline = true;
      this.emit('offline', this.status);
      console.log('[SW Manager] Gone offline');
    });
  }

  /**
   * Setup service worker registration event listeners
   */
  private setupRegistrationListeners(): void {
    if (!this.registration) return;

    this.registration.addEventListener('updatefound', () => {
      console.log('[SW Manager] Service worker update found');
      this.status.hasUpdate = true;
      this.emit('updatefound', this.status);

      const installingWorker = this.registration!.installing;
      if (installingWorker) {
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('[SW Manager] New service worker available');
              this.emit('updateavailable', this.status);
            } else {
              console.log('[SW Manager] Service worker installed for first time');
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
    const { data } = event;
    
    if (data && typeof data === 'object' && 'type' in data) {
      if (data.type === 'CACHE_UPDATED' && 'size' in data) {
        this.status.cacheSize = data.size as number;
        this.emit('cacheupdated', { size: data.size });
      } else if (data.type === 'OFFLINE_READY') {
        console.log('[SW Manager] Offline functionality ready');
        this.emit('offlineready', this.status);
      }
    }
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
          console.error('[SW Manager] Update check failed:', error);
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
        await (this.registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('background-sync');
        console.log('[SW Manager] Background sync registered');
      }
    } catch (error) {
      console.error('[SW Manager] Background sync registration failed:', error);
    }
  }

  /**
   * Update the service worker
   */
  async updateServiceWorker(): Promise<boolean> {
    if (!this.registration) {
      console.warn('[SW Manager] No registration available for update');
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
      console.error('[SW Manager] Service worker update failed:', error);
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
      console.error('[SW Manager] Failed to get cache info:', error);
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
      console.log('[SW Manager] All caches cleared');
      
      return true;
    } catch (error) {
      console.error('[SW Manager] Failed to clear caches:', error);
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
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(`sw-queue-${queueData.id}`, JSON.stringify(queueData));
      
      // Register for background sync
      if ('sync' in this.registration) {
        await (this.registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('background-sync');
      }
      
      console.log('[SW Manager] Action queued for background sync:', action);
      return true;
    } catch (error) {
      console.error('[SW Manager] Failed to queue action for sync:', error);
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
  on(event: string, callback: (data?: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data?: unknown) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string, data?: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[SW Manager] Error in event listener for ${event}:`, error);
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
        console.log('[SW Manager] Service worker unregistered');
      }
      
      return result;
    } catch (error) {
      console.error('[SW Manager] Failed to unregister service worker:', error);
      return false;
    }
  }
}

// Export lazy-loaded singleton instance to prevent SSR errors
let _serviceWorkerManager: ServiceWorkerManager | null = null;

export const serviceWorkerManager = (() => {
  if (typeof window === 'undefined') {
    // Return a mock object during SSR
    return {
      register: () => Promise.resolve(),
      unregister: () => Promise.resolve(),
      getStatus: () => ({
        isSupported: false,
        isRegistered: false,
        isActive: false,
        hasUpdate: false,
        isOffline: false,
        cacheSize: 0,
        lastUpdate: null
      }),
      getConfig: () => ({}),
      addEventListener: () => {},
      removeEventListener: () => {},
      updateCache: () => Promise.resolve(),
      clearCache: () => Promise.resolve(),
      forceUpdate: () => Promise.resolve(),
      queueAction: () => Promise.resolve(false)
    } as any;
  }
  
  if (!_serviceWorkerManager) {
    _serviceWorkerManager = new ServiceWorkerManager();
  }
  return _serviceWorkerManager;
})();

// Export class for custom instances
export { ServiceWorkerManager };
