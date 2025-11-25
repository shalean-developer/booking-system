/**
 * SWR Configuration
 * Global configuration for SWR data fetching
 */

import { SWRConfiguration } from 'swr';

// Custom fetcher function
export async function fetcher<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

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
      throw new Error(errorMessage);
    }

    if (!isJson) {
      throw new Error('Response is not JSON');
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
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

