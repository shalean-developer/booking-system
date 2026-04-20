import 'server-only';

import { getDynamicPricingMultiplier } from '@/lib/pricing/dynamic-data';
import { getAdminPricingRules } from '@/lib/pricing/admin-pricing';
import {
  applyAdminPricingRulesStack,
  type AppliedAdminRule,
} from '@/lib/pricing/admin-pricing-rules-apply';

export type FinalDynamicMultiplierResult = {
  finalMultiplier: number;
  /** Ordered admin rule trace (id, order, type). */
  admin_rule_applied: AppliedAdminRule[];
  demand_score: number;
  supply_score: number;
  base_dynamic_multiplier: number;
  /** Admin stack vs base dynamic (see `applyAdminPricingRulesStack`). */
  effective_multiplier: number;
  /** Multiplier delta from admin rules before global clamp. */
  multiplier_delta: number;
  limits_zar: { min: number | null; max: number | null } | undefined;
};

/**
 * V6.2 — base dynamic → stacked admin rules (override / multiply / cap / disable) → global safety clamp.
 */
export async function getFinalDynamicMultiplier(input: {
  date: string;
  time: string;
  area?: string;
  serviceType: string;
}): Promise<FinalDynamicMultiplierResult> {
  const [base, rules] = await Promise.all([
    getDynamicPricingMultiplier(input),
    getAdminPricingRules({
      serviceType: input.serviceType,
      area: input.area,
      date: input.date,
      time: input.time,
    }),
  ]);

  const applied = applyAdminPricingRulesStack(base.multiplier, rules, new Date());

  return {
    finalMultiplier: applied.finalMultiplier,
    admin_rule_applied: applied.appliedRules,
    demand_score: base.demand_score,
    supply_score: base.supply_score,
    base_dynamic_multiplier: base.multiplier,
    effective_multiplier: applied.effective_multiplier,
    multiplier_delta: applied.multiplier_delta,
    limits_zar: applied.limits_zar,
  };
}
