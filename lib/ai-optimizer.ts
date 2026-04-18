/**
 * Rule-based “AI” optimization layer: analyzes booking economics and suggests actions.
 * Does not train models and does not change pricing or earnings logic.
 */

import { MAX_HOURLY_RATE, TARGET_HOURLY_RATE } from '@/lib/earnings-config';

/** When true, future automation may propose structural changes for new/pending bookings only (never approved rows). */
export const AUTO_OPTIMIZATION_DEFAULT = false;

export function isAutoOptimizationEnabled(): boolean {
  if (typeof process === 'undefined' || !process.env) return false;
  return process.env.AI_AUTO_OPTIMIZATION === 'true';
}

export type OptimizationInput = {
  booking: {
    total_amount: number;
    company_profit_cents: number;
    earnings_final: number;
    service_type: string;
    team_size: number;
    total_hours: number;
  };
};

export type OptimizationSeverity = 'low' | 'medium' | 'high';

export type OptimizationResult = {
  warnings: string[];
  suggestions: string[];
  severity: OptimizationSeverity;
};

const SEVERITY_RANK: Record<OptimizationSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function maxSeverity(a: OptimizationSeverity, b: OptimizationSeverity): OptimizationSeverity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

function uniq(lines: string[]): string[] {
  return [...new Set(lines.filter(Boolean))];
}

/**
 * Single-booking analysis (amounts in cents; total_hours in whole or fractional hours).
 */
export function analyzeBookingOptimization(input: OptimizationInput): OptimizationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let severity: OptimizationSeverity = 'low';

  const {
    total_amount: totalCents,
    company_profit_cents: profitCents,
    earnings_final: earningsCents,
    service_type: serviceType,
    team_size: rawTeam,
    total_hours: rawHours,
  } = input.booking;

  const total = Math.max(0, Math.round(totalCents));
  const profit = Math.round(profitCents);
  const earnings = Math.max(0, Math.round(earningsCents));
  const teamSize = Math.max(1, Math.round(rawTeam) || 1);
  const totalHours = Math.max(0.25, Number(rawHours) > 0 ? Number(rawHours) : 1);

  if (total <= 0) {
    warnings.push('Missing or zero total_amount — cannot score margin.');
    severity = maxSeverity(severity, 'medium');
  } else {
    const profitMargin = profit / total;

    if (profitMargin < 0.15) {
      suggestions.push('Critical: underpriced job — margin below 15%. Consider raising price or reducing cleaner payout on comparable future jobs.');
      severity = maxSeverity(severity, 'high');
    } else if (profitMargin < 0.25) {
      suggestions.push('Increase pricing — company margin is below 25%.');
      severity = maxSeverity(severity, 'medium');
    }
  }

  const idealTeamSize = Math.max(1, Math.ceil(totalHours / 8));
  if (teamSize > idealTeamSize) {
    suggestions.push(
      `Reduce cleaners — team size (${teamSize}) exceeds ideal (${idealTeamSize}) for ~${totalHours.toFixed(1)}h job.`
    );
    severity = maxSeverity(severity, 'medium');
  } else if (teamSize < idealTeamSize) {
    suggestions.push(
      `Add cleaner to improve efficiency — ideal team size is ${idealTeamSize} for ~${totalHours.toFixed(1)}h (8h per cleaner baseline).`
    );
    severity = maxSeverity(severity, 'low');
  }

  const hourlyPerCleaner = earnings / teamSize / totalHours;
  if (hourlyPerCleaner < TARGET_HOURLY_RATE) {
    warnings.push(
      `Cleaner underpaid — implied ~R${(hourlyPerCleaner / 100).toFixed(2)}/h per cleaner vs target R${(TARGET_HOURLY_RATE / 100).toFixed(2)}/h.`
    );
    severity = maxSeverity(severity, 'high');
  } else if (hourlyPerCleaner > MAX_HOURLY_RATE) {
    warnings.push(
      `Cleaner overpaid risk — implied ~R${(hourlyPerCleaner / 100).toFixed(2)}/h per cleaner exceeds cap R${(MAX_HOURLY_RATE / 100).toFixed(2)}/h.`
    );
    severity = maxSeverity(severity, 'medium');
  }

  return {
    warnings: uniq(warnings),
    suggestions: uniq(suggestions),
    severity,
  };
}

export type ServiceMarginRow = {
  serviceType: string;
  revenueCents: number;
  profitCents: number;
  marginPct: number | null;
};

/** Minimum revenue (cents) before suggesting a service-wide price move. */
const MIN_REVENUE_CENTS_FOR_SERVICE_RULE = 50_000;

/**
 * Aggregated service performance: flags services with average margin consistently below 25%.
 */
export function analyzeServicePortfolioOptimization(rows: ServiceMarginRow[]): OptimizationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let severity: OptimizationSeverity = 'low';

  for (const row of rows) {
    const m = row.marginPct;
    if (m == null || row.revenueCents < MIN_REVENUE_CENTS_FOR_SERVICE_RULE) continue;
    if (m < 25) {
      suggestions.push(
        `Increase base price for “${row.serviceType}” — average margin ${m.toFixed(1)}% on R${(row.revenueCents / 100).toLocaleString('en-ZA')} revenue in this period.`
      );
      severity = maxSeverity(severity, m < 15 ? 'high' : 'medium');
    }
  }

  return {
    warnings: uniq(warnings),
    suggestions: uniq(suggestions),
    severity,
  };
}

export function mergeOptimizationResults(results: OptimizationResult[]): OptimizationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let severity: OptimizationSeverity = 'low';

  for (const r of results) {
    warnings.push(...r.warnings);
    suggestions.push(...r.suggestions);
    severity = maxSeverity(severity, r.severity);
  }

  return {
    warnings: uniq(warnings),
    suggestions: uniq(suggestions),
    severity,
  };
}

/**
 * Policy: approved bookings are never mutated. Auto-fix hooks (when added) apply only to new/pending flows.
 * With `AI_AUTO_OPTIMIZATION=false`, no automatic structural changes run.
 */
export function describeAutoOptimizationPolicy(): string {
  return (
    'Auto-optimization is off by default. When enabled, only non-approved booking pipelines may receive automated ' +
    'structural suggestions; approved earnings and pricing remain immutable.'
  );
}

/** Structured log line for observability (call from server when computing dashboard insights). */
export function formatOptimizationLogLine(result: OptimizationResult, context?: string): string {
  const prefix = context ? `[ai-optimizer] ${context}` : '[ai-optimizer]';
  return `${prefix} severity=${result.severity} warnings=${result.warnings.length} suggestions=${result.suggestions.length}`;
}
