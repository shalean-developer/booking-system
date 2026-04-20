import { minutesToTimeHm } from '@/lib/booking-interval';
import { intervalOverlapsExisting } from '@/lib/dispatch/cleaner-dispatch';
import { calculateDistanceKm, estimateTravelMinutes } from '@/lib/scheduling/distance';

type OverlapRow = {
  booking_time: string;
  duration_minutes: number | null;
  expected_end_time: string | null;
};

/** Max scheduled minutes per cleaner per day for auto-assignment (9h). */
export const MAX_ASSIGNMENT_MINUTES_PER_DAY = 540;

export type Booking = {
  start: number;
  end: number;
  latitude?: number | null;
  longitude?: number | null;
};

/** Cleaner home / last reported position (WGS-84). */
export type Cleaner = {
  id: string;
  latitude: number;
  longitude: number;
  bookings: Booking[];
  /** Optional denormalized value; load is derived from `bookings` when scoring. */
  total_minutes_today?: number;
  /** Optional — future: score -= rating * 10 */
  rating?: number;
  /** Optional — future extension */
  reliability_score?: number;
};

export type AssignmentSlot = {
  start: number;
  end: number;
};

export type GeoPoint = { latitude: number; longitude: number };

export class AssignmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssignmentError';
  }
}

function bookingsToOverlapRows(bookings: Booking[]): OverlapRow[] {
  return bookings.map((b) => ({
    booking_time: minutesToTimeHm(b.start),
    duration_minutes: Math.max(0, b.end - b.start),
    expected_end_time: minutesToTimeHm(b.end),
  }));
}

export function calculateCleanerLoad(cleaner: Cleaner): number {
  return cleaner.bookings.reduce((sum, b) => sum + Math.max(0, b.end - b.start), 0);
}

export function validBookingGeo(p: GeoPoint | null | undefined): boolean {
  if (!p) return false;
  return (
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude) &&
    !(p.latitude === 0 && p.longitude === 0)
  );
}

/**
 * Latest job ending at or before `slotStartMin`; else home (`cleaner.latitude/longitude`).
 * Uses prior job coordinates when present on the booking row.
 */
export function getDepartureForTravel(
  cleaner: Cleaner,
  slotStartMin: number
): { lat: number; lng: number; lastEndMin: number } {
  const prior = [...cleaner.bookings]
    .filter((b) => b.end <= slotStartMin)
    .sort((a, b) => b.end - a.end)[0];
  if (prior) {
    const lat =
      prior.latitude != null && Number.isFinite(prior.latitude) ? prior.latitude : cleaner.latitude;
    const lng =
      prior.longitude != null && Number.isFinite(prior.longitude) ? prior.longitude : cleaner.longitude;
    return { lat, lng, lastEndMin: prior.end };
  }
  return { lat: cleaner.latitude, lng: cleaner.longitude, lastEndMin: 0 };
}

export function isTravelFeasible(
  cleaner: Cleaner,
  slot: AssignmentSlot,
  bookingLocation: GeoPoint | null | undefined
): boolean {
  if (!validBookingGeo(bookingLocation)) return true;
  const loc = bookingLocation as GeoPoint;
  const dep = getDepartureForTravel(cleaner, slot.start);
  if (!Number.isFinite(dep.lat) || !Number.isFinite(dep.lng)) return true;
  const dist = calculateDistanceKm(dep.lat, dep.lng, loc.latitude, loc.longitude);
  const travel = estimateTravelMinutes(dist);
  return dep.lastEndMin + travel <= slot.start;
}

export function isCleanerAvailable(
  cleaner: Cleaner,
  slot: AssignmentSlot,
  durationMinutes: number
): boolean {
  const load = calculateCleanerLoad(cleaner);
  if (load + durationMinutes > MAX_ASSIGNMENT_MINUTES_PER_DAY) {
    return false;
  }
  const rows = bookingsToOverlapRows(cleaner.bookings);
  return !intervalOverlapsExisting(slot.start, slot.end, rows);
}

/**
 * Lower = better.
 * Future: optional rating — score -= rating * 10 (not wired yet).
 */
export function scoreCleaner(
  cleaner: Cleaner,
  slot: AssignmentSlot,
  bookingLocation: GeoPoint | null | undefined
): number {
  const loadMinutes = calculateCleanerLoad(cleaner);
  const loadScore = loadMinutes / MAX_ASSIGNMENT_MINUTES_PER_DAY;
  if (!validBookingGeo(bookingLocation)) {
    return loadScore * 100;
  }
  const loc = bookingLocation as GeoPoint;
  const dep = getDepartureForTravel(cleaner, slot.start);
  let distance = 0;
  if (Number.isFinite(dep.lat) && Number.isFinite(dep.lng)) {
    distance = calculateDistanceKm(dep.lat, dep.lng, loc.latitude, loc.longitude);
  }
  const travelTime = estimateTravelMinutes(distance);
  return distance * 2 + travelTime * 1.5 + loadScore * 100;
}

export function getRoutingScoreBreakdown(
  cleaner: Cleaner,
  slot: AssignmentSlot,
  bookingLocation: GeoPoint | null | undefined
): {
  distance_km: number;
  travel_minutes: number;
  load_minutes: number;
  score: number;
} {
  const loadMinutes = calculateCleanerLoad(cleaner);
  const loadScore = loadMinutes / MAX_ASSIGNMENT_MINUTES_PER_DAY;
  if (!validBookingGeo(bookingLocation)) {
    return {
      distance_km: 0,
      travel_minutes: 0,
      load_minutes: loadMinutes,
      score: loadScore * 100,
    };
  }
  const loc = bookingLocation as GeoPoint;
  const dep = getDepartureForTravel(cleaner, slot.start);
  const distance =
    Number.isFinite(dep.lat) && Number.isFinite(dep.lng)
      ? calculateDistanceKm(dep.lat, dep.lng, loc.latitude, loc.longitude)
      : 0;
  const travelTime = estimateTravelMinutes(distance);
  const score = distance * 2 + travelTime * 1.5 + loadScore * 100;
  return {
    distance_km: distance,
    travel_minutes: travelTime,
    load_minutes: loadMinutes,
    score,
  };
}

export type AssignCleanersInput = {
  slot: AssignmentSlot;
  durationMinutes: number;
  team_size: number;
  cleaners: Cleaner[];
  /** When set, enforces travel feasibility and distance-weighted scoring. */
  bookingLocation?: GeoPoint | null;
};

export function assignCleanersToBooking(input: AssignCleanersInput): Cleaner[] {
  const teamSize = Math.max(1, Math.round(input.team_size));
  const durationMinutes = Math.max(1, Math.round(input.durationMinutes));
  const loc = input.bookingLocation ?? null;

  let eligible = input.cleaners.filter((c) => isCleanerAvailable(c, input.slot, durationMinutes));

  if (validBookingGeo(loc)) {
    eligible = eligible.filter((c) => isTravelFeasible(c, input.slot, loc));
  }

  eligible.sort(
    (a, b) => scoreCleaner(a, input.slot, loc) - scoreCleaner(b, input.slot, loc)
  );

  if (process.env.NODE_ENV === 'development') {
    for (const c of eligible) {
      const br = getRoutingScoreBreakdown(c, input.slot, loc);
      console.log('[assignment-routing]', {
        cleaner_id: c.id,
        distance_km: br.distance_km,
        travel_minutes: br.travel_minutes,
        load_minutes: br.load_minutes,
        score: br.score,
      });
    }
  }

  const assigned = eligible.slice(0, teamSize);

  if (assigned.length < teamSize) {
    throw new AssignmentError('Not enough available cleaners');
  }

  return assigned;
}
