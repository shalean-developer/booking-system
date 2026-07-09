export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries: number; delayMs: number; label?: string },
): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (attempt < opts.retries) {
        console.warn(
          `[retry] ${opts.label || 'op'} attempt ${attempt + 1}/${opts.retries + 1}`,
          e instanceof Error ? e.message : e,
        );
        await new Promise((r) => setTimeout(r, opts.delayMs * (attempt + 1)));
      }
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}
