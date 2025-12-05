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
      
      // Check content type before trying to parse
      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, try to get text
          try {
            const text = await response.text();
            // Check if it's HTML (common for 404 pages)
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
              errorMessage = `API endpoint returned HTML (likely 404): ${url}`;
              console.error('[SWR Fetcher] Received HTML instead of JSON:', {
                url,
                status: response.status,
                preview: text.substring(0, 100),
              });
            } else {
              errorMessage = text || response.statusText || errorMessage;
            }
          } catch {
            // If text parsing also fails, use status text
            errorMessage = response.statusText || errorMessage;
          }
        }
      } else {
        // Not JSON - likely HTML error page
        try {
          const text = await response.text();
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            errorMessage = `API endpoint not found or returned HTML (${response.status}): ${url}`;
            console.error('[SWR Fetcher] Received HTML instead of JSON:', {
              url,
              status: response.status,
              preview: text.substring(0, 100),
            });
          } else {
            errorMessage = text || response.statusText || errorMessage;
          }
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
      }
      
      // Log detailed error for 503s and 404s
      if (response.status === 503) {
        console.error('[SWR Fetcher] 503 Service Unavailable:', {
          url,
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`,
        });
      } else if (response.status === 404) {
        console.error('[SWR Fetcher] 404 Not Found:', {
          url,
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`,
          hint: 'Check if the API endpoint exists',
        });
      }
      
      throw new Error(errorMessage);
    }

    // Verify content type before parsing
    if (!isJson) {
      // Try to get a preview of the response to help debug
      try {
        const text = await response.text();
        const preview = text.substring(0, 200);
        console.error('[SWR Fetcher] Response is not JSON:', {
          url,
          contentType,
          preview,
        });
        throw new Error(`API endpoint returned non-JSON response (${contentType || 'unknown'}): ${url}`);
      } catch (textError) {
        throw new Error(`API endpoint returned non-JSON response: ${url}`);
      }
    }

    // Safe to parse as JSON now
    const data = await response.json();
    console.log(`[SWR Fetcher] Success (${duration}ms):`, url);
    return data as T;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Extract error information with better handling for edge cases
    let errorMessage = 'Unknown error';
    let errorName = 'Error';
    let errorStack: string | undefined;
    
    // Safely extract error information
    try {
      if (error) {
        // Handle different error types
        if (error instanceof Error) {
          errorMessage = error.message || error.toString() || 'Unknown error';
          errorName = error.name || 'Error';
          errorStack = error.stack;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (typeof error === 'object') {
          // Try to extract message from various possible properties
          errorMessage = error.message || error.error || error.reason || error.description || 
                        (error.toString && error.toString() !== '[object Object]' ? error.toString() : 'Unknown error');
          errorName = error.name || error.type || 'Error';
          errorStack = error.stack;
        } else {
          errorMessage = String(error) || 'Unknown error';
        }
      }
    } catch (extractError) {
      // If error extraction fails, use fallback
      errorMessage = 'Failed to extract error details';
      console.warn('[SWR Fetcher] Error extracting error details:', extractError);
    }
    
    // Log network errors with more detail
    if (errorName === 'AbortError' || (error instanceof Error && error.name === 'AbortError')) {
      console.error('[SWR Fetcher] Request timeout:', { 
        url, 
        duration: `${duration}ms`,
        error: errorMessage,
      });
    } else if (error instanceof TypeError && (error.message?.includes('fetch') || error.message?.includes('network'))) {
      // Network connectivity issues
      console.error('[SWR Fetcher] Network connectivity error:', {
        url,
        error: errorMessage,
        name: errorName,
        duration: `${duration}ms`,
        hint: 'Check if the server is running and accessible',
      });
    } else {
      // Log with safe error information - build object carefully
      const logData: Record<string, any> = {
        url: url || 'unknown',
        error: errorMessage,
        name: errorName,
        duration: `${duration}ms`,
      };
      
      // Only include stack if it exists and is not empty
      if (errorStack && typeof errorStack === 'string' && errorStack.trim()) {
        logData.stack = errorStack;
      }
      
      console.error('[SWR Fetcher] Network error:', logData);
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

