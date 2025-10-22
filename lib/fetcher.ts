/**
 * Generic fetcher function for SWR
 * @param url - The URL to fetch
 * @returns Promise that resolves to the JSON response
 */
export async function fetcher(url: string): Promise<any> {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object
    (error as any).info = await response.json();
    (error as any).status = response.status;
    throw error;
  }
  
  return response.json();
}