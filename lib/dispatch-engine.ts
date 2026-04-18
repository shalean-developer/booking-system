/**
 * Score-based automatic cleaner dispatch for solo and team bookings.
 * Uses area + day eligibility, slot overlap + daily load (from `cleaner-dispatch`),
 * then ranks by distance, rating, availability load, and weekly job fairness.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { timeHmToMinutes } from '@/lib/booking-interval';
import type { Database } from '@/types/database';
import {
  MAX_MINUTES_PER_DAY,
  calculateCleanerLoad,
  fetchEligibleCleanersForAreas,
  groupByCleaner,
  intervalOverlapsExisting,
  loadBookingsForOverlap,
} from '@/lib/dispatch/cleaner-dispatch';

type CleanerRow = Database['public']['Tables']['cleaners']['Row'];

/** Weighted blend for final ranking (sum = 1). */
export const DISPATCH_WEIGHT_DISTANCE = 0.4;
export const DISPATCH_WEIGHT_RATING = 0.3;
export const DISPATCH_WEIGHT_AVAILABILITY = 0.2;
export const DISPATCH_WEIGHT_FAIRNESS = 0.1;

const MAX_DISTANCE_KM = 80;
const RATING_BAND_LOW = 3.5;
const RATING_BAND_HIGH = 5.0;
const FAIRNESS_MAX_JOBS_WEEK = 25;
const DEFAULT_TEAM_EARNINGS_CENTS = 25_000;

/**
 * Core dispatch request. `location` is used for distance scoring (cleaner `last_location_*`).
 * Scheduling fields are required for database-backed availability and persistence.
 */
export type DispatchInput = {
  bookingId: string;
  serviceType: string;
  location: { lat: number; lng: number };
  /** HH:MM (24h) */
  startTime: string;
  /** How many cleaners to assign (1 = solo). */
  teamSize: number;
  /** YYYY-MM-DD */
  bookingDate: string;
  durationMinutes: number;
  /** Suburb / city strings matching `cleaners.areas` (same as `/api/cleaners/available`). */
  areas: string[];
};

export type ScoredCleaner = {
  cleanerId: string;
  name: string;
  distanceScore: number;
  ratingScore: number;
  availabilityScore: number;
  fairnessScore: number;
  finalScore: number;
};

export type DispatchEngineResult = {
  ranked: ScoredCleaner[];
  selectedCleanerIds: string[];
  partialTeam: boolean;
  needsAdminReview: boolean;
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/** 0–100: closer to job location = higher. Missing cleaner GPS → neutral. */
export function distanceScoreForCleaner(
  jobLat: number,
  jobLng: number,
  cleaner: CleanerRow
): number {
  if (!isValidLatLng(jobLat, jobLng)) return 50;
  const cLat = cleaner.last_location_lat;
  const cLng = cleaner.last_location_lng;
  if (cLat == null || cLng == null || !Number.isFinite(cLat) || !Number.isFinite(cLng)) {
    return 50;
  }
  const km = haversineKm(jobLat, jobLng, cLat, cLng);
  return Math.max(0, Math.min(100, 100 * (1 - Math.min(km, MAX_DISTANCE_KM) / MAX_DISTANCE_KM)));
}

/** 0–100: emphasize 4.5–5.0 band per product guidance. */
export function ratingScoreNormalized(rating: number | null | undefined): number {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const t = (r - RATING_BAND_LOW) / (RATING_BAND_HIGH - RATING_BAND_LOW);
  return Math.max(0, Math.min(100, t * 100));
}

/**
 * 0–100: more spare capacity left in the day = higher.
 * `loadMinutes` = already scheduled minutes that day (overlap rules applied elsewhere).
 */
export function availabilityScoreFromDayLoad(loadMinutes: number, newJobMinutes: number): number {
  const remaining = MAX_MINUTES_PER_DAY - loadMinutes - newJobMinutes;
  if (remaining <= 0) return 0;
  const ratio = remaining / (MAX_MINUTES_PER_DAY - newJobMinutes);
  return Math.max(0, Math.min(100, ratio * 100));
}

/** 0–100: fewer solo bookings this ISO week = higher. */
export function fairnessScoreFromWeeklyCount(jobCount: number): number {
  const t = Math.min(jobCount, FAIRNESS_MAX_JOBS_WEEK) / FAIRNESS_MAX_JOBS_WEEK;
  return Math.max(0, Math.min(100, (1 - t) * 100));
}

export function combineDispatchScores(input: {
  distanceScore: number;
  ratingScore: number;
  availabilityScore: number;
  fairnessScore: number;
}): number {
  return (
    input.distanceScore * DISPATCH_WEIGHT_DISTANCE +
    input.ratingScore * DISPATCH_WEIGHT_RATING +
    input.availabilityScore * DISPATCH_WEIGHT_AVAILABILITY +
    input.fairnessScore * DISPATCH_WEIGHT_FAIRNESS
  );
}

function mondaySundayUtcRange(anchorIsoDate: string): { monday: string; sunday: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(anchorIsoDate.trim());
  if (!m) {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const iso = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    return mondaySundayUtcRange(iso);
  }
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const day = parseInt(m[3], 10);
  const utc = new Date(Date.UTC(y, mo, day));
  const dow = utc.getUTCDay();
  const offsetMon = (dow + 6) % 7;
  const mon = new Date(utc);
  mon.setUTCDate(utc.getUTCDate() - offsetMon);
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  const fmt = (dt: Date) =>
    `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
  return { monday: fmt(mon), sunday: fmt(sun) };
}

async function fetchWeeklyJobCounts(
  supabase: SupabaseClient,
  cleanerIds: string[],
  weekMonday: string,
  weekSunday: string
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const id of cleanerIds) map.set(id, 0);
  if (cleanerIds.length === 0) return map;

  const { data, error } = await supabase
    .from('bookings')
    .select('cleaner_id')
    .in('cleaner_id', cleanerIds)
    .gte('booking_date', weekMonday)
    .lte('booking_date', weekSunday)
    .neq('status', 'cancelled');

  if (error) {
    console.error('[dispatch-engine] weekly job counts', error);
    return map;
  }
  for (const row of data ?? []) {
    const id = row.cleaner_id as string;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

/**
 * Fetch eligible cleaners, filter to those who can take this interval, score, sort DESC, take top `teamSize`.
 */
export async function runDispatchEngine(
  supabase: SupabaseClient,
  input: DispatchInput
): Promise<DispatchEngineResult> {
  const teamSize = Math.max(1, Math.floor(input.teamSize));
  const empty: DispatchEngineResult = {
    ranked: [],
    selectedCleanerIds: [],
    partialTeam: teamSize > 0,
    needsAdminReview: true,
  };

  const areaList = [...new Set(input.areas.map((a) => a.trim()).filter(Boolean))];
  if (areaList.length === 0) {
    return empty;
  }

  const startMin = timeHmToMinutes(input.startTime);
  const endMin = Math.min(24 * 60, startMin + input.durationMinutes);

  const eligible = await fetchEligibleCleanersForAreas(supabase, input.bookingDate, areaList);
  if (eligible.length === 0) {
    return empty;
  }

  const allRows = await loadBookingsForOverlap(supabase, input.bookingDate);
  const byCleaner = groupByCleaner(allRows);

  const candidates: CleanerRow[] = [];
  for (const c of eligible) {
    const existing = byCleaner.get(c.id) ?? [];
    const load = calculateCleanerLoad(existing);
    if (load + input.durationMinutes > MAX_MINUTES_PER_DAY) continue;
    if (intervalOverlapsExisting(startMin, endMin, existing)) continue;
    candidates.push(c);
  }

  if (candidates.length === 0) {
    return { ...empty, partialTeam: false };
  }

  const { monday, sunday } = mondaySundayUtcRange(input.bookingDate);
  const weeklyCounts = await fetchWeeklyJobCounts(
    supabase,
    candidates.map((c) => c.id),
    monday,
    sunday
  );

  const jobLat = input.location.lat;
  const jobLng = input.location.lng;

  const ranked: ScoredCleaner[] = candidates.map((c) => {
    const existing = byCleaner.get(c.id) ?? [];
    const load = calculateCleanerLoad(existing);
    const dist = distanceScoreForCleaner(jobLat, jobLng, c);
    const rate = ratingScoreNormalized(c.rating);
    const avail = availabilityScoreFromDayLoad(load, input.durationMinutes);
    const fair = fairnessScoreFromWeeklyCount(weeklyCounts.get(c.id) ?? 0);
    const finalScore = combineDispatchScores({
      distanceScore: dist,
      ratingScore: rate,
      availabilityScore: avail,
      fairnessScore: fair,
    });
    return {
      cleanerId: c.id,
      name: c.name,
      distanceScore: dist,
      ratingScore: rate,
      availabilityScore: avail,
      fairnessScore: fair,
      finalScore,
    };
  });

  ranked.sort((a, b) => b.finalScore - a.finalScore);

  const selectedCleanerIds = ranked.slice(0, teamSize).map((r) => r.cleanerId);
  const partialTeam = selectedCleanerIds.length < teamSize;
  const needsAdminReview = partialTeam || selectedCleanerIds.length === 0;

  return {
    ranked,
    selectedCleanerIds,
    partialTeam,
    needsAdminReview,
  };
}

/**
 * Persist assignment: solo → `bookings.cleaner_id` + optional time slot;
 * team → `booking_teams` + `booking_team_members`, clears `cleaner_id`.
 * Sets `dispatch_review_required` when the team is incomplete (requires migration).
 */
export async function persistDispatchAssignment(
  supabase: SupabaseClient,
  input: DispatchInput,
  engine: DispatchEngineResult,
  options?: {
    teamName?: 'Team A' | 'Team B' | 'Team C';
    /** When true, upsert `cleaner_time_slots` for each assigned cleaner (team + solo). */
    markTimeSlotsBusy?: boolean;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ids = engine.selectedCleanerIds;
  if (ids.length === 0) {
    return { ok: false, error: 'No cleaners selected' };
  }

  const teamName = options?.teamName ?? 'Team A';
  const reviewFlag = engine.needsAdminReview;

  try {
    if (input.teamSize <= 1) {
      const cid = ids[0]!;
      const { error } = await supabase
        .from('bookings')
        .update({
          cleaner_id: cid,
          assigned_cleaner_id: cid,
          status: 'assigned',
          dispatch_review_required: reviewFlag,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.bookingId);

      if (error) return { ok: false, error: error.message };

      if (options?.markTimeSlotsBusy) {
        await markDispatchTimeSlotsBooked(supabase, {
          bookingId: input.bookingId,
          date: input.bookingDate,
          startTime: input.startTime,
          cleanerIds: [cid],
        });
      }
      return { ok: true };
    }

    const supervisorId = ids[0]!;

    const { data: existingTeam, error: exErr } = await supabase
      .from('booking_teams')
      .select('id')
      .eq('booking_id', input.bookingId)
      .maybeSingle();

    if (exErr) return { ok: false, error: exErr.message };

    let teamId: string;
    if (existingTeam?.id) {
      teamId = existingTeam.id;
      await supabase
        .from('booking_teams')
        .update({
          team_name: teamName,
          supervisor_id: supervisorId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', teamId);
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('booking_teams')
        .insert({
          booking_id: input.bookingId,
          team_name: teamName,
          supervisor_id: supervisorId,
        })
        .select('id')
        .single();

      if (insErr || !inserted) return { ok: false, error: insErr?.message ?? 'Failed to create team' };
      teamId = inserted.id as string;
    }

    await supabase.from('booking_team_members').delete().eq('booking_team_id', teamId);

    const rows = ids.map((cleanerId) => ({
      booking_team_id: teamId,
      cleaner_id: cleanerId,
      earnings: DEFAULT_TEAM_EARNINGS_CENTS,
    }));

    const { error: memErr } = await supabase.from('booking_team_members').insert(rows);
    if (memErr) return { ok: false, error: memErr.message };

    const { error: bookErr } = await supabase
      .from('bookings')
      .update({
        cleaner_id: null,
        assigned_cleaner_id: null,
        dispatch_review_required: reviewFlag,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.bookingId);

    if (bookErr) return { ok: false, error: bookErr.message };

    if (options?.markTimeSlotsBusy) {
      await markDispatchTimeSlotsBooked(supabase, {
        bookingId: input.bookingId,
        date: input.bookingDate,
        startTime: input.startTime,
        cleanerIds: ids,
      });
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { ok: false, error: msg };
  }
}

/** Optional: reserve standard slot rows for each cleaner (team jobs are not covered by booking trigger on `cleaner_id`). */
export async function markDispatchTimeSlotsBooked(
  supabase: SupabaseClient,
  params: {
    bookingId: string;
    date: string;
    startTime: string;
    cleanerIds: string[];
    durationHours?: number;
  }
): Promise<void> {
  const duration = params.durationHours ?? 3;
  for (const cleanerId of params.cleanerIds) {
    const { error } = await supabase.from('cleaner_time_slots').upsert(
      {
        cleaner_id: cleanerId,
        booking_id: params.bookingId,
        date: params.date,
        time_slot: params.startTime.length === 5 ? `${params.startTime}:00` : params.startTime,
        status: 'booked',
        duration_hours: duration,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'cleaner_id,date,time_slot' }
    );
    if (error) {
      console.warn('[dispatch-engine] time slot upsert', cleanerId, error.message);
    }
  }
}
