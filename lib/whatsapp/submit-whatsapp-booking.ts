import 'server-only';

import type { BookingState } from '@/types/booking';
import { getInternalAppOrigin } from '@/lib/whatsapp/internal-origin';

type SnapshotOk = {
  ok: true;
  pricing_snapshot_id: string;
  pricing_hash: string;
  pricing_lock_token?: string;
  pricing_expires_at: string;
  pricing_version: string;
  price_zar: number;
};

type SnapshotErr = { ok: false; error: string };

type PendingOk = {
  ok: true;
  bookingId: string;
  totalAmount?: number;
  message?: string;
};

type PendingErr = { ok: false; error?: string };

export async function postCreatePricingSnapshot(
  body: Record<string, unknown>
): Promise<SnapshotOk | SnapshotErr> {
  const origin = getInternalAppOrigin();
  try {
    const res = await fetch(`${origin}/api/pricing/create-snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!json.ok) {
      return { ok: false, error: String(json.error || 'Snapshot failed') };
    }
    return {
      ok: true,
      pricing_snapshot_id: String(json.pricing_snapshot_id),
      pricing_hash: String(json.pricing_hash),
      pricing_lock_token: typeof json.pricing_lock_token === 'string' ? json.pricing_lock_token : undefined,
      pricing_expires_at: String(json.pricing_expires_at),
      pricing_version: String(json.pricing_version),
      price_zar: Number(json.price_zar),
    };
  } catch (e) {
    console.error('[whatsapp] create-snapshot fetch', e);
    return { ok: false, error: e instanceof Error ? e.message : 'Snapshot request failed' };
  }
}

export async function postPendingBooking(body: BookingState): Promise<PendingOk | PendingErr> {
  const origin = getInternalAppOrigin();
  try {
    const res = await fetch(`${origin}/api/bookings/pending`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!json.ok) {
      return { ok: false, error: String(json.error || 'Booking failed') };
    }
    return {
      ok: true,
      bookingId: String(json.bookingId),
      totalAmount: typeof json.totalAmount === 'number' ? json.totalAmount : undefined,
      message: typeof json.message === 'string' ? json.message : undefined,
    };
  } catch (e) {
    console.error('[whatsapp] pending fetch', e);
    return { ok: false, error: e instanceof Error ? e.message : 'Booking request failed' };
  }
}
