import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { ServiceType } from '@/types/booking';

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function todayYmdUtc(): string {
  const dt = new Date();
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Returns up to `count` future dates (YYYY-MM-DD) where `check_date_availability` reports available.
 */
export async function findNextAvailableDates(
  supabase: SupabaseClient<Database>,
  params: { serviceType: ServiceType; maxDays?: number; count?: number }
): Promise<string[]> {
  const maxDays = params.maxDays ?? 21;
  const count = params.count ?? 3;
  const start = todayYmdUtc();
  const out: string[] = [];

  for (let i = 1; i <= maxDays && out.length < count; i++) {
    const date = addDaysYmd(start, i);
    // RPC exists in DB; may be missing from generated `Database` types.
    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: string,
          args: { p_service_type: string; p_booking_date: string }
        ) => Promise<{ data: unknown; error: { message: string } | null }>;
      }
    ).rpc('check_date_availability', {
      p_service_type: params.serviceType,
      p_booking_date: date,
    });

    if (error) {
      console.error('[whatsapp] check_date_availability', error);
      continue;
    }
    const rows = Array.isArray(data) ? data : [];
    const row = rows[0] as { available?: boolean } | undefined;
    if (row?.available === true) {
      out.push(date);
    }
  }

  return out;
}
