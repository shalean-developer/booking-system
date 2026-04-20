import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { findAvailableCleaners } from '@/lib/matching/find-available-cleaners';

export const dynamic = 'force-dynamic';

/**
 * Debug / admin helper: list cleaners matching coverage + availability for a slot.
 * Query: date, area, startTime, endTime, lat?, lng?
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || '';
    const area = searchParams.get('area') || '';
    const startTime = searchParams.get('startTime') || '';
    const endTime = searchParams.get('endTime') || '';
    const latRaw = searchParams.get('lat');
    const lngRaw = searchParams.get('lng');
    const lat = latRaw != null && latRaw !== '' ? Number(latRaw) : null;
    const lng = lngRaw != null && lngRaw !== '' ? Number(lngRaw) : null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !area || !startTime || !endTime) {
      return NextResponse.json(
        { ok: false, error: 'Required: date (YYYY-MM-DD), area, startTime, endTime' },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const cleaners = await findAvailableCleaners(supabase, {
      date,
      area,
      startTime,
      endTime,
      lat: lat != null && Number.isFinite(lat) ? lat : null,
      lng: lng != null && Number.isFinite(lng) ? lng : null,
    });

    return NextResponse.json({
      ok: true,
      count: cleaners.length,
      cleaners: cleaners.map((c) => ({
        id: c.id,
        name: c.name,
        areas: c.areas,
        working_areas: (c as { working_areas?: string[] }).working_areas ?? [],
        coverage_radius_km: (c as { coverage_radius_km?: number }).coverage_radius_km ?? 10,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
