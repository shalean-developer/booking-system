import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  fetchEligibleCleanersForAreas,
  listAvailableCleanersForBooking,
} from '@/lib/dispatch/cleaner-dispatch';
import { computeBookingDurationMinutes } from '@/lib/booking-duration';
import type { AvailableCleanersResponse, Cleaner } from '@/types/booking';
import type { Database } from '@/types/database';

type CleanerRow = Database['public']['Tables']['cleaners']['Row'];

/** Public booking API shape; omits `password_hash` and other internal row fields from `select('*')`. */
function mapCleanerRowToCleaner(row: CleanerRow): Cleaner {
  return {
    id: row.id,
    name: row.name,
    photo_url: row.photo_url,
    rating: row.rating,
    areas: row.areas,
    bio: row.bio ?? null,
    years_experience: row.years_experience ?? null,
    specialties: row.specialties ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    is_active: row.is_active,
    completion_rate: row.completion_rate,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function enrichCleanerAggregates(
  supabase: ReturnType<typeof createServiceClient>,
  rows: CleanerRow[]
): Promise<Cleaner[]> {
  const base = rows.map(mapCleanerRowToCleaner);
  const ids = rows.map((r) => r.id).filter(Boolean);
  if (ids.length === 0) return base;

  const reviewsMap = new Map<string, number>();
  const jobsMap = new Map<string, number>();

  const { data: ratingRows } = await supabase
    .from('customer_ratings')
    .select('cleaner_id')
    .in('cleaner_id', ids);
  for (const r of ratingRows ?? []) {
    const id = r.cleaner_id as string;
    reviewsMap.set(id, (reviewsMap.get(id) ?? 0) + 1);
  }

  const { data: jobRows } = await supabase
    .from('bookings')
    .select('cleaner_id')
    .in('cleaner_id', ids)
    .in('status', ['completed', 'paid']);
  for (const j of jobRows ?? []) {
    const id = j.cleaner_id as string | null;
    if (!id) continue;
    jobsMap.set(id, (jobsMap.get(id) ?? 0) + 1);
  }

  return base.map((c) => ({
    ...c,
    reviews_count: reviewsMap.get(c.id) ?? 0,
    completed_jobs_count: jobsMap.get(c.id) ?? 0,
  }));
}

function parseJsonExtras(param: string | null): { extras: string[]; quantities: Record<string, number> } {
  if (!param?.trim()) return { extras: [], quantities: {} };
  try {
    const v = JSON.parse(param) as unknown;
    if (v && typeof v === 'object' && !Array.isArray(v) && 'extras' in v) {
      const o = v as { extras?: unknown; extras_quantities?: unknown };
      const extras = Array.isArray(o.extras) ? o.extras.filter((x) => typeof x === 'string') : [];
      const quantities: Record<string, number> = {};
      if (o.extras_quantities && typeof o.extras_quantities === 'object' && o.extras_quantities !== null) {
        for (const [k, val] of Object.entries(o.extras_quantities as Record<string, unknown>)) {
          if (typeof val === 'number' && Number.isFinite(val)) quantities[k] = val;
        }
      }
      return { extras, quantities };
    }
  } catch {
    /* ignore */
  }
  return { extras: [], quantities: {} };
}

export async function GET(req: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured, returning empty cleaners list');
      return NextResponse.json({
        ok: true,
        cleaners: [],
        message: 'Supabase not configured',
      });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date')?.trim();
    const city = searchParams.get('city')?.trim() ?? '';
    const suburb = searchParams.get('suburb')?.trim() ?? '';
    const time = searchParams.get('time')?.trim() ?? '';

    if (!date || (!city && !suburb)) {
      return NextResponse.json(
        { ok: false, error: 'Date and city or suburb are required' },
        { status: 400 }
      );
    }

    const areas = [...new Set([suburb, city].filter(Boolean))];

    let durationMinutes = parseInt(searchParams.get('duration_minutes') || '', 10);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 30) {
      const bedrooms = Math.max(0, parseInt(searchParams.get('bedrooms') || '2', 10) || 0);
      const bathrooms = Math.max(0, parseInt(searchParams.get('bathrooms') || '2', 10) || 0);
      const { extras, quantities } = parseJsonExtras(searchParams.get('job') || searchParams.get('extras_payload'));
      durationMinutes = computeBookingDurationMinutes({
        bedrooms,
        bathrooms,
        extras,
        extrasQuantities: quantities,
      });
    }

    const supabase = createServiceClient();

    let cleaners;
    if (!time) {
      const all = await fetchEligibleCleanersForAreas(supabase, date, areas);
      cleaners = all.slice(0, 8);
    } else {
      const excludeBookingId = searchParams.get('exclude_booking_id')?.trim() || undefined;
      cleaners = await listAvailableCleanersForBooking(supabase, {
        date,
        areas,
        startTime: time,
        durationMinutes,
        excludeBookingId,
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('=== FETCHING AVAILABLE CLEANERS (dispatch overlap) ===', {
        date,
        areas,
        time: time || '(default)',
        durationMinutes,
        count: cleaners.length,
      });
    }

    const enriched = await enrichCleanerAggregates(supabase, cleaners);

    const response: AvailableCleanersResponse = {
      ok: true,
      cleaners: enriched,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching available cleaners:', error);

    const response: AvailableCleanersResponse = {
      ok: false,
      cleaners: [],
      error: 'Failed to fetch available cleaners',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
