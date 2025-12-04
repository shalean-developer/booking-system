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
    // Add timeout to prevent hanging requests (with feature detection)
    let controller: AbortController | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Check if AbortController is supported
    if (typeof AbortController !== 'undefined') {
      controller = new AbortController();
      timeoutId = setTimeout(() => {
        if (controller) {
          controller.abort();
          console.error('[SWR Fetcher] Request timeout after 30s:', url);
        }
      }, 30000); // 30 second timeout
    }

    const fetchOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // Only add signal if AbortController is supported
    if (controller) {
      fetchOptions.signal = controller.signal;
    }

    const response = await fetch(url, fetchOptions);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }
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
    
    // Extract error information
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorName = error?.name || 'Error';
    const errorStack = error?.stack;
    
    // Log network errors with more detail
    if (error.name === 'AbortError') {
      console.error('[SWR Fetcher] Request timeout:', { 
        url, 
        duration: `${duration}ms`,
        error: errorMessage,
      });
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network connectivity issues
      console.error('[SWR Fetcher] Network connectivity error:', {
        url,
        error: errorMessage,
        name: errorName,
        duration: `${duration}ms`,
        hint: 'Check if the server is running and accessible',
      });
    } else {
      console.error('[SWR Fetcher] Network error:', {
        url,
        error: errorMessage,
        name: errorName,
        duration: `${duration}ms`,
        stack: errorStack,
      });
    }
    
    // Re-throw SWR-compatible errors with better messages
    if (error instanceof Error) {
      // Preserve the original error but ensure it has a message
      if (!error.message || error.message === '') {
        error.message = `Network error: ${errorName}`;
      }
      throw error;
    }
    
    // Create a new error with the extracted information
    const networkError = new Error(errorMessage || `Network error: ${errorName}`);
    (networkError as any).name = errorName;
    throw networkError;
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

