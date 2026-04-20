import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  fetchEligibleCleanersForAreas,
  groupByCleaner,
  loadBookingsForOverlap,
} from '@/lib/dispatch/cleaner-dispatch';
import {
  computeUnifiedSlotAvailability,
  DEFAULT_WORK_DAY_END_MINUTES,
  DEFAULT_WORK_DAY_START_MINUTES,
  minutesToTimeString,
  type CleanerWithBookings,
} from '@/lib/scheduling/availability';
import type { UnifiedBookingInput, UnifiedServiceType } from '@/lib/pricing/types';
import { UnifiedPricingValidationError } from '@/lib/pricing/calculateBookingUnified';
import { fetchSurgeDemandCounts } from '@/lib/pricing/surge-demand-server';
import { calculateSurgeMultiplier } from '@/lib/pricing/surgeEngine';
import { fetchQuickCleanSettings } from '@/lib/quick-clean-settings';
import { fetchForecastBookingsScalarForSurge } from '@/lib/pricing/forecast-demand-server';

export const dynamic = 'force-dynamic';

type BusinessHourRow = {
  day?: string;
  open?: string;
  close?: string;
  isOpen?: boolean;
};

const DAY_NAMES: ReadonlyArray<string> = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function parseHmToMinutes(value: string | undefined): number | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(mm)) return null;
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return h * 60 + mm;
}

async function resolveDynamicWindow(
  supabase: ReturnType<typeof createServiceClient>,
  dateYmd: string
): Promise<{ startMinutes: number; endMinutes: number; isOpen: boolean }> {
  const { data } = await supabase
    .from('company_settings')
    .select('business_hours')
    .limit(1)
    .maybeSingle();
  const businessHours = data?.business_hours;
  if (!Array.isArray(businessHours)) {
    return {
      startMinutes: DEFAULT_WORK_DAY_START_MINUTES,
      endMinutes: DEFAULT_WORK_DAY_END_MINUTES,
      isOpen: true,
    };
  }

  const dateObj = new Date(`${dateYmd}T00:00:00`);
  const dayName = DAY_NAMES[dateObj.getDay()]!;
  const match = (businessHours as BusinessHourRow[]).find((r) => r?.day === dayName);
  if (!match) {
    return {
      startMinutes: DEFAULT_WORK_DAY_START_MINUTES,
      endMinutes: DEFAULT_WORK_DAY_END_MINUTES,
      isOpen: true,
    };
  }

  const isOpen = match.isOpen !== false;
  const open = parseHmToMinutes(match.open);
  const close = parseHmToMinutes(match.close);
  if (!isOpen || open == null || close == null || close <= open) {
    const start = open ?? DEFAULT_WORK_DAY_START_MINUTES;
    return { startMinutes: start, endMinutes: start, isOpen: false };
  }
  return { startMinutes: open, endMinutes: close, isOpen: true };
}

function parseExtras(body: unknown): string[] {
  if (!body || typeof body !== 'object') return [];
  const ex = (body as { extras?: unknown }).extras;
  if (!Array.isArray(ex)) return [];
  return ex.filter((x): x is string => typeof x === 'string');
}

function parseQuantities(body: unknown): Record<string, number> | null | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const q = (body as { extrasQuantities?: unknown }).extrasQuantities;
  if (q == null) return undefined;
  if (typeof q !== 'object' || Array.isArray(q)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(q as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

function addDaysYmd(dateYmd: string, days: number): string {
  const d = new Date(`${dateYmd}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function findNextAvailableDay(params: {
  supabase: ReturnType<typeof createServiceClient>;
  fromDateYmd: string;
  maxDaysToCheck: number;
  areas: string[];
  unifiedInput: UnifiedBookingInput;
}): Promise<string | null> {
  for (let i = 1; i <= params.maxDaysToCheck; i++) {
    const d = addDaysYmd(params.fromDateYmd, i);
    const window = await resolveDynamicWindow(params.supabase, d);
    if (!window.isOpen || window.endMinutes <= window.startMinutes) continue;
    const eligible = await fetchEligibleCleanersForAreas(params.supabase, d, params.areas);
    const overlapRows = await loadBookingsForOverlap(params.supabase, d);
    const byCleaner = groupByCleaner(overlapRows);
    const cleaners: CleanerWithBookings[] = eligible.map((c) => ({
      id: c.id,
      bookings: byCleaner.get(c.id) ?? [],
    }));
    const result = computeUnifiedSlotAvailability({
      unifiedInput: params.unifiedInput,
      cleaners,
      window,
    });
    if (result.slots.some((s) => s.available)) return d;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const date = typeof body.date === 'string' ? body.date.trim() : '';
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ ok: false, error: 'Invalid or missing date' }, { status: 400 });
    }

    const suburb = typeof body.suburb === 'string' ? body.suburb.trim() : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const areas = [suburb, city].filter(Boolean);
    if (areas.length === 0) {
      return NextResponse.json({ ok: false, error: 'suburb or city is required' }, { status: 400 });
    }

    const serviceType = body.service_type as UnifiedServiceType | undefined;
    if (serviceType !== 'standard' && serviceType !== 'airbnb') {
      return NextResponse.json({ ok: false, error: 'service_type must be standard or airbnb' }, { status: 400 });
    }

    const pricingMode = body.pricing_mode;
    if (pricingMode !== 'quick' && pricingMode !== 'premium') {
      return NextResponse.json({ ok: false, error: 'pricing_mode must be quick or premium' }, { status: 400 });
    }

    const bedrooms = Math.floor(Number(body.bedrooms));
    const bathrooms = Math.floor(Number(body.bathrooms));
    const extraRooms = Math.floor(Number(body.extra_rooms ?? body.extraRooms ?? 0));

    if (!Number.isFinite(bedrooms) || bedrooms < 1) {
      return NextResponse.json({ ok: false, error: 'bedrooms must be >= 1' }, { status: 400 });
    }
    if (!Number.isFinite(bathrooms) || bathrooms < 0) {
      return NextResponse.json({ ok: false, error: 'Invalid bathrooms' }, { status: 400 });
    }

    const hasExtraCleaner = Boolean(body.has_extra_cleaner);

    const unifiedInput: UnifiedBookingInput = {
      service_type: serviceType,
      pricing_mode: pricingMode,
      bedrooms,
      bathrooms,
      extra_rooms: Number.isFinite(extraRooms) && extraRooms >= 0 ? extraRooms : 0,
      extras: parseExtras(body),
      extrasQuantities: parseQuantities(body),
      has_extra_cleaner: hasExtraCleaner,
    };

    const supabase = createServiceClient();
    const window = await resolveDynamicWindow(supabase, date);
    const eligible = await fetchEligibleCleanersForAreas(supabase, date, areas);
    const overlapRows = await loadBookingsForOverlap(supabase, date);
    const byCleaner = groupByCleaner(overlapRows);

    const cleaners: CleanerWithBookings[] = eligible.map((c) => ({
      id: c.id,
      bookings: byCleaner.get(c.id) ?? [],
    }));

    const {
      unified,
      durationMinutes,
      teamSize,
      latestStartMinutes,
      windowStartMinutes,
      windowEndMinutes,
      slots,
    } = computeUnifiedSlotAvailability({
      unifiedInput,
      cleaners,
      window,
    });
    const availableCount = slots.filter((s) => s.available).length;
    const nextAvailableDay =
      availableCount > 0
        ? null
        : await findNextAvailableDay({
            supabase,
            fromDateYmd: date,
            maxDaysToCheck: 14,
            areas,
            unifiedInput,
          });

    const suggestion =
      availableCount > 0
        ? null
        : latestStartMinutes < windowStartMinutes
          ? `This job requires ${Math.round(durationMinutes / 60)}h ${durationMinutes % 60}m and cannot fit in this day's service window. Try another day.`
          : `No slots are available for this day. Try an earlier start time or another day.`;

    if (process.env.NODE_ENV === 'development') {
      console.log('[availability-v2]', {
        duration: unified.duration,
        team_size: teamSize,
        slots_generated: slots.length,
        slots_available: availableCount,
        latest_start: minutesToTimeString(Math.max(windowStartMinutes, latestStartMinutes)),
        window: `${minutesToTimeString(window.startMinutes)}–${minutesToTimeString(window.endMinutes)}`,
        closed_day: !window.isOpen,
      });
    }

    const [surgeCounts, qc] = await Promise.all([
      fetchSurgeDemandCounts(supabase, { date }),
      fetchQuickCleanSettings(supabase),
    ]);
    let forecastBookings: number | null = null;
    if (qc.enableForecastSurge) {
      forecastBookings = await fetchForecastBookingsScalarForSurge(supabase);
    }
    const availForForecast = Math.max(1, surgeCounts.available_cleaners);
    const forecastHighDemand =
      qc.enableForecastSurge &&
      forecastBookings != null &&
      Number.isFinite(forecastBookings) &&
      forecastBookings > availForForecast * 1.2;

    const serviceTypeStr = serviceType === 'airbnb' ? 'airbnb' : 'standard';
    const areaLabel = suburb || city || undefined;

    return NextResponse.json({
      ok: true,
      duration_hours: unified.duration,
      duration_minutes: durationMinutes,
      required_duration_minutes: durationMinutes,
      team_size: teamSize,
      latest_start: minutesToTimeString(Math.max(windowStartMinutes, latestStartMinutes)),
      window_start: minutesToTimeString(windowStartMinutes),
      window_end: minutesToTimeString(windowEndMinutes),
      suggestion,
      next_available_day: nextAvailableDay,
      slots: slots.map((s) => {
        const sm = calculateSurgeMultiplier({
          service_type: serviceTypeStr,
          date,
          time: s.start,
          area: areaLabel,
          active_bookings_count: surgeCounts.active_bookings,
          available_cleaners_count: surgeCounts.available_cleaners,
          required_cleaners: teamSize,
          forecast_high_demand: forecastHighDemand,
          now: new Date(),
        });
        const mult = sm.multiplier;
        let surge_percent: number | null = null;
        if (mult >= 1.003) {
          const rounded = Math.round((mult - 1) * 100);
          surge_percent = rounded < 1 ? 1 : rounded;
        }
        return {
          start: s.start,
          end: s.end,
          available: s.available,
          assignable_cleaners: s.assignable_cleaners,
          recommended: s.recommended,
          surge_percent,
        };
      }),
    });
  } catch (e) {
    if (e instanceof UnifiedPricingValidationError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }
    console.error('[availability-v2]', e);
    return NextResponse.json({ ok: false, error: 'Availability failed' }, { status: 500 });
  }
}
