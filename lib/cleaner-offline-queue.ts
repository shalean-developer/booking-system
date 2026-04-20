const STORAGE_KEY = 'cleaner_app_status_queue_v1';

export type QueuedStatusUpdate = {
  bookingId: string;
  status: string;
  queuedAt: number;
};

function readQueue(): QueuedStatusUpdate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedStatusUpdate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedStatusUpdate[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function enqueueCleanerStatusUpdate(bookingId: string, status: string) {
  const q = readQueue().filter(x => !(x.bookingId === bookingId && x.status === status));
  q.push({ bookingId, status, queuedAt: Date.now() });
  writeQueue(q);
}

export function dequeueCleanerStatusUpdate(bookingId: string, status: string) {
  const q = readQueue().filter(x => !(x.bookingId === bookingId && x.status === status));
  writeQueue(q);
}

export function getQueuedCleanerStatusUpdates(): QueuedStatusUpdate[] {
  return readQueue();
}

export async function flushCleanerStatusQueue(
  patch: (bookingId: string, status: string) => Promise<void>,
): Promise<{ ok: number; failed: number }> {
  const items = readQueue();
  let ok = 0;
  let failed = 0;
  for (const item of items) {
    try {
      await patch(item.bookingId, item.status);
      dequeueCleanerStatusUpdate(item.bookingId, item.status);
      ok += 1;
    } catch {
      failed += 1;
    }
  }
  return { ok, failed };
}
