/**
 * Automatic team size heuristic for booking workload (aligned with pricing-engine `teamSize`).
 */

export const MAX_HOURS_PER_CLEANER = 8;
export const MIN_TEAM_SIZE = 1;
export const MAX_TEAM_SIZE = 6;

export type OptimalTeamResult = {
  teamSize: number;
  hoursPerCleaner: number;
  totalWorkHours: number;
};

/**
 * @param totalWorkHours — estimated wall-clock / billed hours for the job (same basis as pricing `totalHours`).
 * @param serviceType — API service label (`Standard`, `Airbnb`, `Deep`, `Move In/Out`, `Carpet`, …).
 */
export function calculateOptimalTeam(input: {
  totalWorkHours: number;
  serviceType: string;
}): OptimalTeamResult {
  const h = Math.max(0, Number(input.totalWorkHours) || 0);
  const st = (input.serviceType || '').trim();

  let teamSize: number;
  if (st === 'Standard' || st === 'Airbnb') {
    teamSize = h <= MAX_HOURS_PER_CLEANER ? 1 : 2;
  } else {
    teamSize = Math.ceil(h / MAX_HOURS_PER_CLEANER);
  }

  teamSize = Math.min(MAX_TEAM_SIZE, Math.max(MIN_TEAM_SIZE, teamSize));

  const hoursPerCleaner = teamSize > 0 ? h / teamSize : h;

  return {
    teamSize,
    hoursPerCleaner,
    totalWorkHours: h,
  };
}
