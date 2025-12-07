/**
 * Enhanced fetch utilities with caching and network failure handling
 */

interface FetchOptions extends RequestInit {
  cacheTime?: number; // Cache duration in milliseconds (default: 0 = no cache)
  retries?: number; // Number of retry attempts (default: 0)
  retryDelay?: number; // Delay between retries in ms (default: 1000)
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache (client-side only)
const cache = new Map<string, CacheEntry>();

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Enhanced fetch with caching and retry logic
 */
export async function cachedFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    cacheTime = 0,
    retries = 0,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  // Check cache first (only for GET requests with cacheTime > 0)
  if (fetchOptions.method === 'GET' || !fetchOptions.method) {
    const cacheKey = `${url}:${JSON.stringify(fetchOptions)}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
      // Return cached response as a Response-like object
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Check network status
  if (!isOnline()) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  // Retry logic
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        // Use revalidate for stale-while-revalidate pattern
        next: cacheTime > 0 ? { revalidate: Math.floor(cacheTime / 1000) } : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Cache successful GET responses
      if ((fetchOptions.method === 'GET' || !fetchOptions.method) && cacheTime > 0) {
        try {
          const clonedResponse = response.clone();
          const text = await clonedResponse.text();
          const trimmedText = text.trim();
          
          // Check if response is HTML (don't cache HTML responses)
          if (!trimmedText.startsWith('<!DOCTYPE') && !trimmedText.startsWith('<html') && !trimmedText.startsWith('<!')) {
            try {
              const data = JSON.parse(text);
              const cacheKey = `${url}:${JSON.stringify(fetchOptions)}`;
              cache.set(cacheKey, {
                data,
                timestamp: Date.now(),
                expiresAt: Date.now() + cacheTime,
              });
            } catch {
              // Not JSON, don't cache
            }
          }
        } catch {
          // Can't read response, don't cache
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on last attempt
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError || new Error('Request failed');
}

/**
 * Clear cache for a specific URL pattern
 */
export function clearCache(urlPattern?: string): void {
  if (!urlPattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(urlPattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Get cache stats (for debugging)
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  };
}
