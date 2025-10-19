/**
 * SWR Fetcher Utility
 * Used for data fetching with SWR caching
 */

export async function fetcher<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { 
    credentials: 'include' 
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch' }));
    throw new Error(error.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  
  return res.json();
}

/**
 * Authenticated fetcher with Bearer token
 * Used when Authorization header is needed
 */
export async function authFetcher<T = any>(url: string, token?: string): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(url, {
    headers,
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch' }));
    throw new Error(error.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  
  return res.json();
}

