'use client';

import type { GrowthEventPayload } from '@/lib/growth/growthEngine';

/** Sends event to `/api/growth/event` (requires service role on server). */
export async function persistGrowthEvent(payload: GrowthEventPayload): Promise<boolean> {
  try {
    const res = await fetch('/api/growth/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
