/**
 * Rate limiting feedback utilities
 * Handles rate limit errors and provides user feedback
 */

export interface RateLimitInfo {
  retryAfter?: number; // seconds
  limit?: number;
  remaining?: number;
  reset?: number; // timestamp
}

export function extractRateLimitInfo(response: Response): RateLimitInfo | null {
  const retryAfter = response.headers.get('retry-after');
  const rateLimitLimit = response.headers.get('x-ratelimit-limit');
  const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
  const rateLimitReset = response.headers.get('x-ratelimit-reset');

  if (!retryAfter && !rateLimitLimit) {
    return null;
  }

  return {
    retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
    limit: rateLimitLimit ? parseInt(rateLimitLimit, 10) : undefined,
    remaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined,
    reset: rateLimitReset ? parseInt(rateLimitReset, 10) : undefined,
  };
}

export function formatRateLimitMessage(info: RateLimitInfo): string {
  if (info.retryAfter) {
    const minutes = Math.ceil(info.retryAfter / 60);
    return `Rate limit exceeded. Please try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`;
  }

  if (info.remaining !== undefined && info.remaining === 0) {
    return 'Rate limit reached. Please wait a moment before trying again.';
  }

  return 'Too many requests. Please slow down and try again.';
}

export function isRateLimitError(response: Response): boolean {
  return response.status === 429 || response.status === 503;
}
