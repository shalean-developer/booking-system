/**
 * Pure supply vs demand evaluation for a single date / time / area slice.
 * Uses V4-style `hours` and `team_size` per booking (cleaner-hours demand).
 */

export type SupplyBookingInput = {
  /** Job hours (V4 `hours` — total labour-hours for the booking). */
  hours: number;
  /** V4 team size; defaults to 1. Demand in cleaner-hours = hours × team_size when weighted. */
  team_size?: number;
};

export type SupplyCleanerInput = {
  id: string;
};

export type EvaluateSupplyDemandInput = {
  date: string;
  time: string;
  /** Display label (suburb, city, or free text) */
  area: string;
  bookings: SupplyBookingInput[];
  cleaners: SupplyCleanerInput[];
  /**
   * Capacity one cleaner contributes in this slot (default 4h).
   * supply_hours = available_cleaners × working_hours_per_slot
   */
  working_hours_per_slot?: number;
  /**
   * If true (default), demand_hours = Σ(hours × max(1, team_size)) (parallel crews).
   * If false, demand_hours = Σ(hours) only.
   */
  weightDemandByTeamSize?: boolean;
};

export type SupplyDemandStatus = 'balanced' | 'shortage' | 'oversupply';

export type EvaluateSupplyDemandResult = {
  demand_hours: number;
  supply_hours: number;
  shortage_hours: number;
  required_cleaners: number;
  available_cleaners: number;
  status: SupplyDemandStatus;
};

const DEFAULT_SLOT_H = 4;
const BALANCED_EPS = 0.25;

function roundUp(n: number): number {
  return Math.ceil(n - 1e-9);
}

/**
 * Evaluate labour demand vs slot supply for one area/time bucket.
 */
export function evaluateSupplyDemand(input: EvaluateSupplyDemandInput): EvaluateSupplyDemandResult {
  const slotCap = Math.max(0.5, Number(input.working_hours_per_slot) || DEFAULT_SLOT_H);
  const weightTeam = input.weightDemandByTeamSize !== false;

  let demand_hours = 0;
  for (const b of input.bookings) {
    const h = Math.max(0, Number(b.hours) || 0);
    const ts = Math.max(1, Math.floor(Number(b.team_size) || 1));
    demand_hours += weightTeam ? h * ts : h;
  }

  const available_cleaners = Math.max(0, input.cleaners.length);
  const supply_hours = available_cleaners * slotCap;

  const shortage_hours = demand_hours - supply_hours;

  const required_cleaners =
    demand_hours <= 0 ? 0 : roundUp(demand_hours / slotCap);

  let status: SupplyDemandStatus;
  if (shortage_hours > BALANCED_EPS) {
    status = 'shortage';
  } else if (shortage_hours < -BALANCED_EPS) {
    status = 'oversupply';
  } else {
    status = 'balanced';
  }

  return {
    demand_hours: Math.round(demand_hours * 1000) / 1000,
    supply_hours: Math.round(supply_hours * 1000) / 1000,
    shortage_hours: Math.round(shortage_hours * 1000) / 1000,
    required_cleaners,
    available_cleaners,
    status,
  };
}
