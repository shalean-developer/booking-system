/**
 * SWR Configuration
 * Global configuration for SWR data fetching
 */

import { SWRConfiguration } from 'swr';

// Custom fetcher function
export async function fetcher<T>(url: string): Promise<T> {
  const startTime = Date.now();
  console.log('[SWR Fetcher] Fetching:', url);
  
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error('[SWR Fetcher] Request timeout after 30s:', url);
    }, 30000); // 30 second timeout

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    console.log(`[SWR Fetcher] Response: ${response.status} ${response.statusText} (${duration}ms)`, url);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
      }
      
      // Log detailed error for 503s
      if (response.status === 503) {
        console.error('[SWR Fetcher] 503 Service Unavailable:', {
          url,
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`,
        });
      }
      
      throw new Error(errorMessage);
    }

    if (!isJson) {
      throw new Error('Response is not JSON');
    }

    const data = await response.json();
    console.log(`[SWR Fetcher] Success (${duration}ms):`, url);
    return data as T;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Log network errors
    if (error.name === 'AbortError') {
      console.error('[SWR Fetcher] Request timeout:', { url, duration: `${duration}ms` });
    } else {
      console.error('[SWR Fetcher] Network error:', {
        url,
        error: error.message,
        name: error.name,
        duration: `${duration}ms`,
      });
    }
    
    // Re-throw SWR-compatible errors
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
}

// Global SWR configuration
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false, // Don't revalidate when window gets focused
  revalidateOnReconnect: true, // Revalidate when network reconnects
  dedupingInterval: 2000, // Dedupe requests within 2 seconds
  errorRetryCount: 3, // Retry failed requests up to 3 times
  errorRetryInterval: 5000, // Wait 5 seconds between retries
  keepPreviousData: true, // Keep previous data while fetching new data
};

