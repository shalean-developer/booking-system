import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  fetchEligibleCleanersForAreas,
  listAvailableCleanersForBooking,
} from '@/lib/dispatch/cleaner-dispatch';
import { computeBookingDurationMinutes } from '@/lib/booking-duration';
import type { AvailableCleanersResponse } from '@/types/booking';

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
      cleaners = await listAvailableCleanersForBooking(supabase, {
        date,
        areas,
        startTime: time,
        durationMinutes,
      });
    }

    console.log('=== FETCHING AVAILABLE CLEANERS (dispatch overlap) ===', {
      date,
      areas,
      time: time || '(default)',
      durationMinutes,
      count: cleaners.length,
    });

    const response: AvailableCleanersResponse = {
      ok: true,
      cleaners,
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
