/**
 * Enhanced fetch utility with caching and retry logic
 */

interface FetchOptions extends RequestInit {
  cache?: RequestCache;
  retries?: number;
  retryDelay?: number;
}

interface CachedResponse<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = 30 * 1000; // 30 seconds default cache
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

/**
 * Check if response is from network error
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  if (error instanceof Error) {
    return error.message.includes('network') || error.message.includes('Failed to fetch');
  }
  return false;
}

/**
 * Fetch with caching and retry logic
 */
export async function fetchWithCache<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    cache = 'default',
    retries = MAX_RETRIES,
    retryDelay = RETRY_DELAY,
    ...fetchOptions
  } = options;

  // Check cache for GET requests
  if (fetchOptions.method === 'GET' || !fetchOptions.method) {
    const cacheKey = `fetch_cache_${url}`;
    const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
    
    if (cached) {
      try {
        const parsed: CachedResponse<T> = JSON.parse(cached);
        const now = Date.now();
        
        // Return cached data if not expired
        if (now < parsed.expiresAt) {
          return new Response(JSON.stringify(parsed.data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          // Remove expired cache
          localStorage.removeItem(cacheKey);
        }
      } catch {
        // Invalid cache, remove it
        if (typeof window !== 'undefined') {
          localStorage.removeItem(cacheKey);
        }
      }
    }
  }

  // Retry logic
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        cache,
      });

      // Cache successful GET responses
      if ((fetchOptions.method === 'GET' || !fetchOptions.method) && response.ok) {
        try {
          const clonedResponse = response.clone();
          const text = await clonedResponse.text();
          const trimmedText = text.trim();
          
          // Check if response is HTML (don't cache HTML responses)
          if (!trimmedText.startsWith('<!DOCTYPE') && !trimmedText.startsWith('<html') && !trimmedText.startsWith('<!')) {
            try {
              const data = JSON.parse(text);
              const cacheKey = `fetch_cache_${url}`;
              const cached: CachedResponse<T> = {
                data,
                timestamp: Date.now(),
                expiresAt: Date.now() + CACHE_DURATION,
              };
              if (typeof window !== 'undefined') {
                localStorage.setItem(cacheKey, JSON.stringify(cached));
              }
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
      lastError = error;
      
      // Don't retry on non-network errors
      if (!isNetworkError(error)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  // All retries failed
  throw new Error(
    isNetworkError(lastError)
      ? 'Network error: Please check your internet connection and try again.'
      : lastError instanceof Error
      ? lastError.message
      : 'An error occurred'
  );
}

/**
 * Clear cache for a specific URL or all cache
 */
export function clearCache(url?: string) {
  if (typeof window === 'undefined') return;
  
  if (url) {
    localStorage.removeItem(`fetch_cache_${url}`);
  } else {
    // Clear all fetch caches
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('fetch_cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

