/**
 * Pure stacking + safety caps for V6.2 admin pricing (testable without DB).
 * Override rules are terminal (no further multiplier stacking). Caps merge to the tightest band.
 */

export const MAX_TOTAL_MULTIPLIER = 2.0;
export const MIN_TOTAL_MULTIPLIER = 0.7;

/** Max rules examined per booking (priority-sorted list) — limits runaway configs. */
export const MAX_RULES_APPLIED = 10;

export type PricingRuleForApply = {
  id: string;
  rule_type?: string | null;
  dynamic_enabled: boolean;
  multiplier_override?: number | string | null;
  min_price_zar?: number | string | null;
  max_price_zar?: number | string | null;
  priority?: number;
};

/** Ordered trace of rules that affected multiplier or caps (execution order). */
export type AppliedAdminRule = {
  id: string;
  order: number;
  /** Normalized `rule_type`, or `dynamic_off` when `dynamic_enabled === false`. */
  type: string | null;
};

function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function mergeCapLimits(
  current: { min: number | null; max: number | null } | undefined,
  rule: PricingRuleForApply
): { min: number | null; max: number | null } {
  const rMin = num(rule.min_price_zar);
  const rMax = num(rule.max_price_zar);
  let min = current?.min ?? null;
  let max = current?.max ?? null;
  if (rMin != null) min = min == null ? rMin : Math.max(min, rMin);
  if (rMax != null) max = max == null ? rMax : Math.min(max, rMax);
  return { min, max };
}

export type ApplyAdminPricingRulesResult = {
  finalMultiplier: number;
  /** Full ordered trace (ids + types). */
  appliedRules: AppliedAdminRule[];
  /** Convenience: `appliedRules.map((r) => r.id)` — stable for APIs that only need ids. */
  appliedRuleIds: string[];
  limits_zar: { min: number | null; max: number | null } | undefined;
  /** Admin stack effect vs base dynamic: `finalMultiplier / base` when base > 0, else 1. */
  effective_multiplier: number;
  /** Change in multiplier from admin rules **before** global safety clamp (rules-only delta). */
  multiplier_delta: number;
};

function isNoOpRule(rule: PricingRuleForApply): boolean {
  if (rule.dynamic_enabled === false) return false;
  const rt = (rule.rule_type ?? '').trim().toLowerCase();
  if (rt === 'disable') return false;
  const hasMult = num(rule.multiplier_override) != null;
  const hasMin = num(rule.min_price_zar) != null;
  const hasMax = num(rule.max_price_zar) != null;
  return !hasMult && !hasMin && !hasMax;
}

/**
 * Apply all matching rules in **descending priority** (highest first).
 * Global clamp runs **after** all rule processing.
 */
export function applyAdminPricingRulesStack(
  baseDynamicMultiplier: number,
  rules: PricingRuleForApply[],
  _now?: Date
): ApplyAdminPricingRulesResult {
  if (rules.length > MAX_RULES_APPLIED) {
    console.warn('[PRICING RULE LIMIT]', {
      total: rules.length,
      applied: MAX_RULES_APPLIED,
    });
  }

  const relevantRules = rules.filter((r) => !isNoOpRule(r));
  const sorted = [...relevantRules]
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .slice(0, MAX_RULES_APPLIED);

  const multiplier_before_rules = baseDynamicMultiplier;
  let finalMultiplier = baseDynamicMultiplier;
  const appliedRules: AppliedAdminRule[] = [];
  let order = 1;
  let limits: { min: number | null; max: number | null } | undefined;
  let breakLoop = false;

  const pushApplied = (rule: PricingRuleForApply, type: string | null) => {
    appliedRules.push({ id: rule.id, order: order++, type });
  };

  for (const rule of sorted) {
    if (breakLoop) break;

    if (rule.dynamic_enabled === false) {
      finalMultiplier = 1;
      pushApplied(rule, 'dynamic_off');
      continue;
    }

    const rt = (rule.rule_type ?? 'multiplier').trim().toLowerCase();

    switch (rt) {
      case 'override': {
        const ov = num(rule.multiplier_override);
        finalMultiplier = ov ?? finalMultiplier;
        pushApplied(rule, 'override');
        breakLoop = true;
        break;
      }
      case 'multiplier': {
        const ov = num(rule.multiplier_override);
        if (ov != null) {
          finalMultiplier *= ov;
          pushApplied(rule, 'multiplier');
        }
        break;
      }
      case 'cap': {
        limits = mergeCapLimits(limits, rule);
        pushApplied(rule, 'cap');
        break;
      }
      case 'disable':
        finalMultiplier = 1;
        pushApplied(rule, 'disable');
        break;
      default:
        break;
    }
  }

  const multiplier_after_rules = finalMultiplier;
  const multiplier_delta = multiplier_after_rules - multiplier_before_rules;

  const unclampedMultiplier = finalMultiplier;
  finalMultiplier = Math.min(
    Math.max(finalMultiplier, MIN_TOTAL_MULTIPLIER),
    MAX_TOTAL_MULTIPLIER
  );

  if (finalMultiplier !== unclampedMultiplier) {
    console.warn('[PRICING CLAMP]', {
      before: unclampedMultiplier,
      after: finalMultiplier,
    });
  }

  const limits_zar =
    limits && (limits.min != null || limits.max != null) ? limits : undefined;

  const effective_multiplier =
    baseDynamicMultiplier > 0 ? finalMultiplier / baseDynamicMultiplier : 1;

  const appliedRuleIds = appliedRules.map((r) => r.id);

  return {
    finalMultiplier,
    appliedRules,
    appliedRuleIds,
    limits_zar,
    effective_multiplier,
    multiplier_delta,
  };
}
