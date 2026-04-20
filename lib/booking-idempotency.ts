import type { SupabaseClient } from '@supabase/supabase-js';

export function normalizeIdempotencyKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 128);
}

export async function findBookingByIdempotencyKey(
  supabase: SupabaseClient,
  idempotencyKey: string,
): Promise<{ id: string; price: number | null; total_amount: number | null } | null> {
  const { data } = await supabase
    .from('bookings')
    .select('id, price, total_amount')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  return (data as { id: string; price: number | null; total_amount: number | null } | null) ?? null;
}
