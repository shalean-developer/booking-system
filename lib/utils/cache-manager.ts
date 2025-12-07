/**
 * Cache Manager Utilities
 * Helper functions for managing service worker caches
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `shalean-app-${CACHE_VERSION}`;
const RUNTIME_CACHE = `shalean-runtime-${CACHE_VERSION}`;
const DATA_CACHE = `shalean-data-${CACHE_VERSION}`;

export class CacheManager {
  /**
   * Clear all caches
   */
  static async clearAll(): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
    } catch (error) {
      console.error('[CacheManager] Failed to clear caches:', error);
    }
  }

  /**
   * Clear specific cache
   */
  static async clearCache(cacheName: string): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return;
    }

    try {
      await caches.delete(cacheName);
    } catch (error) {
      console.error('[CacheManager] Failed to clear cache:', error);
    }
  }

  /**
   * Get cache size estimate
   */
  static async getCacheSize(cacheName: string): Promise<number> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return 0;
    }

    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      let totalSize = 0;

      for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('[CacheManager] Failed to get cache size:', error);
      return 0;
    }
  }

  /**
   * Get all cache names
   */
  static async getCacheNames(): Promise<string[]> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return [];
    }

    try {
      return await caches.keys();
    } catch (error) {
      console.error('[CacheManager] Failed to get cache names:', error);
      return [];
    }
  }

  /**
   * Preload important resources
   */
  static async preloadResources(urls: string[]): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return;
    }

    try {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        urls.map(url =>
          fetch(url).then(response => {
            if (response.ok) {
              return cache.put(url, response);
            }
          }).catch(() => {
            // Silently fail for preload
          })
        )
      );
    } catch (error) {
      console.error('[CacheManager] Failed to preload resources:', error);
    }
  }

  /**
   * Check if service worker is supported
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'caches' in window;
  }

  /**
   * Get service worker registration
   */
  static async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      return null;
    }

    try {
      return await navigator.serviceWorker.ready;
    } catch (error) {
      console.error('[CacheManager] Failed to get registration:', error);
      return null;
    }
  }

  /**
   * Update service worker
   */
  static async updateServiceWorker(): Promise<void> {
    if (!this.isSupported()) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    } catch (error) {
      console.error('[CacheManager] Failed to update service worker:', error);
    }
  }

  /**
   * Unregister service worker
   */
  static async unregisterServiceWorker(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        return await registration.unregister();
      }
      return false;
    } catch (error) {
      console.error('[CacheManager] Failed to unregister service worker:', error);
      return false;
    }
  }
}
