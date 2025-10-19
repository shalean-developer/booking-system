import { useEffect, useState } from 'react';

/**
 * Debounce hook that delays updating a value until after a delay
 * Useful for search inputs to avoid excessive API calls
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * const [searchInput, setSearchInput] = useState('');
 * const debouncedSearch = useDebouncedValue(searchInput, 500);
 * 
 * // Use debouncedSearch in your API call
 * useEffect(() => {
 *   fetchData(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

