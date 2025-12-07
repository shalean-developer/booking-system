/**
 * Service Worker for Shalean Cleaning Services
 * Provides offline support and caching for customer and cleaner dashboards
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `shalean-app-${CACHE_VERSION}`;
const RUNTIME_CACHE = `shalean-runtime-${CACHE_VERSION}`;
const DATA_CACHE = `shalean-data-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/dashboard/bookings',
  '/dashboard/settings',
  '/dashboard/profile',
  '/cleaner/login',
  '/cleaner/dashboard',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.svg',
];

// Customer dashboard API routes to cache (with network-first strategy)
const CUSTOMER_API_PATTERNS = [
  '/api/dashboard/bookings',
  '/api/dashboard/stats',
  '/api/dashboard/favorites',
  '/api/dashboard/templates',
  '/api/dashboard/reminders',
  '/api/cleaners/available',
];

// Cleaner API routes to cache
const CLEANER_API_PATTERNS = [
  '/api/cleaner/bookings',
  '/api/cleaner/bookings/available',
  '/api/cleaner/payments',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Failed to cache some assets:', err);
        // Continue even if some assets fail to cache
        return Promise.resolve();
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API routes - Network first, cache fallback
  // Skip admin API routes - they should never be cached
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/admin/')) {
    // Check if it's a customer or cleaner API route
    const isCustomerAPI = CUSTOMER_API_PATTERNS.some(pattern => url.pathname.startsWith(pattern));
    const isCleanerAPI = CLEANER_API_PATTERNS.some(pattern => url.pathname.startsWith(pattern));
    
    if (isCustomerAPI || isCleanerAPI) {
      event.respondWith(networkFirstStrategy(request, DATA_CACHE));
      return;
    }
    
    // For other API routes, use network-first but don't cache
    event.respondWith(networkFirstStrategy(request, null));
    return;
  }
  
  // Skip admin API routes entirely - let them go directly to network
  if (url.pathname.startsWith('/api/admin/')) {
    return;
  }

  // Static assets and pages - Cache first, network fallback
  event.respondWith(cacheFirstStrategy(request));
});

/**
 * Network first strategy - try network, fallback to cache
 * Good for API calls that need fresh data
 */
async function networkFirstStrategy(request, cacheName = RUNTIME_CACHE) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses (if cacheName is provided)
    if (response.ok && cacheName) {
      const cache = await caches.open(cacheName);
      // Clone response before caching (responses can only be read once)
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    
    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add cache header to indicate this is from cache
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Cache', 'HIT');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers,
      });
    }
    
    // If it's an API request and we're offline, return a helpful error
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'You are offline. Please check your connection and try again.',
          offline: true,
        }),
        {
          status: 503,
          headers: { 
            'Content-Type': 'application/json',
            'X-Cache': 'MISS',
          },
        }
      );
    }
    
    throw error;
  }
}

/**
 * Cache first strategy - try cache, fallback to network
 * Good for static assets and pages
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[Service Worker] Fetch failed:', request.url);
    
    // If it's a navigation request and we're offline, show offline page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    throw error;
  }
}

// Background sync for queued actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-dashboard-data') {
    event.waitUntil(syncDashboardData());
  } else if (event.tag.startsWith('sync-booking-')) {
    // Future: Sync individual booking actions
    const bookingId = event.tag.replace('sync-booking-', '');
    console.log('[Service Worker] Syncing booking:', bookingId);
  }
});

// Sync dashboard data when back online
async function syncDashboardData() {
  try {
    // Get all cached dashboard API requests
    const cache = await caches.open(DATA_CACHE);
    const requests = await cache.keys();
    
    // Refresh cached dashboard endpoints
    const dashboardEndpoints = requests.filter(req => {
      const url = new URL(req.url);
      return CUSTOMER_API_PATTERNS.some(pattern => url.pathname.startsWith(pattern));
    });
    
    // Refresh each endpoint
    for (const request of dashboardEndpoints) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
        }
      } catch (error) {
        console.log('[Service Worker] Failed to sync:', request.url);
      }
    }
    
    // Notify clients that sync completed
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now(),
      });
    });
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Push notifications (when implemented)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Shalean Cleaning Services';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/cleaner/dashboard',
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data || '/cleaner/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

