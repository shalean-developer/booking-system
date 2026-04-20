import type { AppliedAdminRule } from '@/lib/pricing/admin-pricing-rules-apply';

/**
 * Stable string IDs from snapshot/API payloads that may use legacy `string[]`,
 * full `AppliedAdminRule[]`, or mixed entries (e.g. old JSON in `price_snapshot`).
 */
export function getAppliedRuleIds(rules: unknown[] | null | undefined): string[] {
  if (!rules?.length) return [];
  const ids: string[] = [];
  for (const r of rules) {
    if (typeof r === 'string') {
      const t = r.trim();
      if (t) ids.push(t);
    } else if (r && typeof r === 'object' && !Array.isArray(r) && 'id' in r) {
      const id = (r as { id: unknown }).id;
      if (typeof id === 'string' && id.trim()) ids.push(id.trim());
    }
  }
  return ids;
}

/**
 * Normalize admin rule traces from the wire or DB into `AppliedAdminRule[]`.
 * Prefer `raw` when non-empty; otherwise builds from `fallbackRuleIds` (legacy `rule_ids` only).
 */
export function normalizeAppliedAdminRules(
  raw: unknown,
  fallbackRuleIds?: string[]
): AppliedAdminRule[] {
  if (Array.isArray(raw) && raw.length > 0) {
    const out: AppliedAdminRule[] = [];
    let idx = 0;
    for (const item of raw) {
      if (typeof item === 'string') {
        const id = item.trim();
        if (!id) continue;
        idx += 1;
        out.push({ id, order: idx, type: null });
        continue;
      }
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const o = item as Record<string, unknown>;
        const idRaw = o.id;
        const id = idRaw != null ? String(idRaw).trim() : '';
        if (!id) continue;
        idx += 1;
        const order =
          typeof o.order === 'number' && Number.isFinite(o.order) ? Math.floor(o.order) : idx;
        const type =
          o.type === null || o.type === undefined
            ? null
            : typeof o.type === 'string'
              ? o.type
              : null;
        out.push({ id, order, type });
      }
    }
    if (out.length > 0) return out;
  }
  if (fallbackRuleIds?.length) {
    return fallbackRuleIds
      .filter((x) => typeof x === 'string' && x.trim())
      .map((id, i) => ({ id: id.trim(), order: i + 1, type: null }));
  }
  return [];
}

/** Compact line for UI: `"1. override, 2. cap"` — safe for legacy snapshots. */
export function formatAppliedRulesForDisplay(rules: unknown): string {
  const n = normalizeAppliedAdminRules(rules, undefined);
  if (n.length === 0) return '';
  return n
    .map((r) => `${r.order}. ${r.type ?? 'rule'}`)
    .join(', ');
}

/** Structured rows for server logs / analytics. */
export function appliedRulesForLog(rules: unknown): {
  id: string;
  type: string | null;
  order: number;
}[] {
  return normalizeAppliedAdminRules(rules, undefined).map((r) => ({
    id: r.id,
    type: r.type,
    order: r.order,
  }));
}
