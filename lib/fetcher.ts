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
    try {
      const clonedResponse = response.clone();
      const text = await clonedResponse.text();
      const trimmedText = text.trim();
      
      // Check if response is HTML (error page)
      if (trimmedText.startsWith('<!DOCTYPE') || trimmedText.startsWith('<html') || trimmedText.startsWith('<!')) {
        (error as any).info = { error: `API endpoint returned HTML (likely ${response.status}): ${url}` };
      } else {
        try {
          (error as any).info = JSON.parse(text);
        } catch {
          (error as any).info = { error: text || response.statusText };
        }
      }
    } catch {
      (error as any).info = { error: response.statusText };
    }
    (error as any).status = response.status;
    throw error;
  }
  
  // Validate response is actually JSON before parsing
  const clonedResponse = response.clone();
  const text = await clonedResponse.text();
  const trimmedText = text.trim();
  
  // Check if response is HTML despite OK status
  if (trimmedText.startsWith('<!DOCTYPE') || trimmedText.startsWith('<html') || trimmedText.startsWith('<!')) {
    throw new Error(`API endpoint returned HTML instead of JSON: ${url}`);
  }
  
  try {
    return JSON.parse(text);
  } catch (parseError) {
    throw new Error(`Invalid JSON response from ${url}: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
}