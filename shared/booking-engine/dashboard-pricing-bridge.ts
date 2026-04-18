/**
 * Dashboard cart helpers — team size lives in `optimal-team.ts`; shim lives in `dashboard-wizard-shim.ts`.
 */

export { apiServiceToWizardService, buildDashboardWizardShim } from './dashboard-wizard-shim';
export { getDashboardOptimalTeamSize } from './optimal-team';

export function aggregateExtraIdsToQuantities(ids: string[]): Record<string, number> {
  const q: Record<string, number> = {};
  for (const id of ids) {
    q[id] = (q[id] || 0) + 1;
  }
  return q;
}
