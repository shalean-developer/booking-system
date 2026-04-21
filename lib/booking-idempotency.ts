import type { SupabaseClient } from '@supabase/supabase-js';

export function normalizeIdempotencyKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 128);
}

export type BookingIdempotencyRow = {
  id: string;
  price: number | null;
  total_amount: number | null;
  status: string | null;
  paystack_ref: string | null;
  payment_reference: string | null;
};

export async function findBookingByIdempotencyKey(
  supabase: SupabaseClient,
  idempotencyKey: string,
): Promise<BookingIdempotencyRow | null> {
  const { data } = await supabase
    .from('bookings')
    .select('id, price, total_amount, status, paystack_ref, payment_reference')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  return (data as BookingIdempotencyRow | null) ?? null;
}
