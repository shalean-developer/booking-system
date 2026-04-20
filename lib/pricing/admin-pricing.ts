import 'server-only';

import { createServiceClient } from '@/lib/supabase-server';
import { dayOfWeekFromIsoDate } from '@/lib/dispatch/cleaner-dispatch';
import {
  isHourInWindow,
  isPricingRuleInScheduleWindow,
} from '@/lib/pricing/pricing-rule-window';

export type PricingRuleRow = {
  id: string;
  service_type: string | null;
  area: string | null;
  day_of_week: number | null;
  time_start: number | null;
  time_end: number | null;
  multiplier_override: number | string | null;
  min_price_zar: number | string | null;
  max_price_zar: number | string | null;
  dynamic_enabled: boolean;
  priority: number;
  is_active: boolean;
  created_at: string;
  rule_type?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  created_by?: string | null;
  notes?: string | null;
};

export type AdminPricingRuleInput = {
  serviceType: string;
  area?: string;
  date: string;
  time: string;
};

function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * All active rules matching optional service, area, weekday, hour window, and **active time window**.
 * Sorted by **priority descending** (apply order in `applyAdminPricingRulesStack`).
 * Uses service client — server only.
 */
export async function getAdminPricingRules(
  input: AdminPricingRuleInput,
  now: Date = new Date()
): Promise<PricingRuleRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.warn('[admin-pricing] fetch pricing_rules', error.message);
    return [];
  }
  if (!data?.length) return [];

  const hourRaw = parseInt(input.time.split(':')[0] ?? '0', 10);
  const hour = Number.isFinite(hourRaw) ? hourRaw : 0;
  const day = dayOfWeekFromIsoDate(input.date);
  const service = input.serviceType.trim();
  const areaIn = (input.area ?? '').trim().toLowerCase();

  const matched = data.filter((rule: PricingRuleRow) => {
    if (!isPricingRuleInScheduleWindow(rule, now)) return false;
    if (rule.service_type?.trim()) {
      if (rule.service_type.trim() !== service) return false;
    }
    if (rule.area?.trim()) {
      if (!areaIn || rule.area.trim().toLowerCase() !== areaIn) return false;
    }
    const ts = num(rule.time_start);
    const te = num(rule.time_end);
    if (!isHourInWindow(hour, ts, te)) return false;
    if (rule.day_of_week != null && rule.day_of_week !== day) return false;
    return true;
  });

  matched.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return matched;
}
