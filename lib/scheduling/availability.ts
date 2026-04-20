import {
  calculateCleanerLoad,
  intervalOverlapsExisting,
  MAX_MINUTES_PER_DAY,
} from '@/lib/dispatch/cleaner-dispatch';
import { calculateBookingUnified } from '@/lib/pricing/calculateBookingUnified';
import type { UnifiedBookingInput } from '@/lib/pricing/types';

export const DEFAULT_WORK_DAY_START_MINUTES = 7 * 60; // 07:00
export const DEFAULT_WORK_DAY_END_MINUTES = 18 * 60; // 18:00

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export type CleanerOverlapRows = Array<{
  booking_time: string;
  duration_minutes: number | null;
  expected_end_time: string | null;
}>;

export type CleanerWithBookings = {
  id: string;
  bookings: CleanerOverlapRows;
};

/**
 * 30-minute start increments; each candidate [start, end) must satisfy end <= WORK_DAY_END_MINUTES.
 * `durationMinutes` is wall-clock per cleaner (from unified `duration`).
 */
export function enumerateHalfHourSlots(
  durationMinutes: number,
  startMinutes: number,
  endMinutes: number
): Array<{ startMin: number; endMin: number }> {
  const slots: Array<{ startMin: number; endMin: number }> = [];
  const d = Math.max(1, Math.round(durationMinutes));
  for (let start = startMinutes; start <= endMinutes; start += 30) {
    const end = start + d;
    if (end <= endMinutes) {
      slots.push({ startMin: start, endMin: end });
    }
  }
  return slots;
}

export function countCleanersAssignableForSlot(
  cleaners: CleanerWithBookings[],
  params: { startMin: number; endMin: number; durationMinutes: number }
): number {
  const { startMin, endMin, durationMinutes } = params;
  let n = 0;
  for (const c of cleaners) {
    const load = calculateCleanerLoad(c.bookings);
    if (load + durationMinutes > MAX_MINUTES_PER_DAY) continue;
    if (intervalOverlapsExisting(startMin, endMin, c.bookings)) continue;
    n++;
  }
  return n;
}

export type SlotAvailabilityRow = {
  start: string;
  end: string;
  startMin: number;
  endMin: number;
  available: boolean;
  assignable_cleaners: number;
  recommended: boolean;
};

/**
 * Full slot list with availability — dispatch rules (daily load cap + travel-buffer overlap).
 * Recommended = available slot with highest assignable_cleaners; ties → earliest start.
 */
export function computeUnifiedSlotAvailability(params: {
  unifiedInput: UnifiedBookingInput;
  cleaners: CleanerWithBookings[];
  window?: { startMinutes: number; endMinutes: number };
}): {
  unified: ReturnType<typeof calculateBookingUnified>;
  durationMinutes: number;
  teamSize: number;
  latestStartMinutes: number;
  windowStartMinutes: number;
  windowEndMinutes: number;
  slots: SlotAvailabilityRow[];
} {
  const unified = calculateBookingUnified(params.unifiedInput);
  const durationMinutes = Math.max(1, Math.round(unified.duration * 60));
  const teamSize = Math.max(1, unified.team_size);
  const startMinutes = params.window?.startMinutes ?? DEFAULT_WORK_DAY_START_MINUTES;
  const endMinutes = params.window?.endMinutes ?? DEFAULT_WORK_DAY_END_MINUTES;
  const latestStartMinutes = endMinutes - durationMinutes;

  const candidates = enumerateHalfHourSlots(durationMinutes, startMinutes, endMinutes);
  const rows: SlotAvailabilityRow[] = [];

  for (const { startMin, endMin } of candidates) {
    const assignable = countCleanersAssignableForSlot(params.cleaners, {
      startMin,
      endMin,
      durationMinutes,
    });
    const available = assignable >= teamSize;

    rows.push({
      start: minutesToTimeString(startMin),
      end: minutesToTimeString(endMin),
      startMin,
      endMin,
      available,
      assignable_cleaners: assignable,
      recommended: false,
    });
  }

  const availableRows = rows.filter((r) => r.available);
  if (availableRows.length > 0) {
    const maxAssignable = Math.max(...availableRows.map((r) => r.assignable_cleaners));
    const ties = availableRows.filter((r) => r.assignable_cleaners === maxAssignable);
    ties.sort((a, b) => a.startMin - b.startMin);
    ties[0]!.recommended = true;
  }

  return {
    unified,
    durationMinutes,
    teamSize,
    latestStartMinutes,
    windowStartMinutes: startMinutes,
    windowEndMinutes: endMinutes,
    slots: rows,
  };
}
