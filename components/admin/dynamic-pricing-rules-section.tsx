'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, Save, Trash2, Zap } from 'lucide-react';
import { fadeUp, type ToastState } from './pricing-shared';
import { cn } from '@/lib/utils';

type PricingRuleRow = {
  id: string;
  rule_type?: string | null;
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
  starts_at?: string | null;
  ends_at?: string | null;
  notes?: string | null;
};

const DAYS: { v: string; l: string }[] = [
  { v: '', l: 'Any day' },
  { v: '0', l: 'Sunday' },
  { v: '1', l: 'Monday' },
  { v: '2', l: 'Tuesday' },
  { v: '3', l: 'Wednesday' },
  { v: '4', l: 'Thursday' },
  { v: '5', l: 'Friday' },
  { v: '6', l: 'Saturday' },
];

const emptyDraft = () => ({
  rule_type: 'override',
  service_type: '' as string,
  area: '',
  day_of_week: '',
  time_start: '',
  time_end: '',
  multiplier_override: '',
  min_price_zar: '',
  max_price_zar: '',
  dynamic_enabled: true,
  priority: '10',
  is_active: true,
  starts_at: '',
  ends_at: '',
  notes: '',
});

export function DynamicPricingRulesSection({ onToast }: { onToast: (t: ToastState) => void }) {
  const [rules, setRules] = useState<PricingRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pricing/rules', { credentials: 'include', cache: 'no-store' });
      const json = (await res.json()) as { ok?: boolean; rules?: PricingRuleRow[]; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to load rules');
      setRules(json.rules ?? []);
    } catch (e) {
      onToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Failed to load dynamic pricing rules',
      });
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const createRule = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/pricing/rules', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_type: draft.rule_type || 'multiplier',
          service_type: draft.service_type.trim() || null,
          area: draft.area.trim() || null,
          day_of_week: draft.day_of_week === '' ? null : Number(draft.day_of_week),
          time_start: draft.time_start === '' ? null : Number(draft.time_start),
          time_end: draft.time_end === '' ? null : Number(draft.time_end),
          multiplier_override: draft.multiplier_override === '' ? null : Number(draft.multiplier_override),
          min_price_zar: draft.min_price_zar === '' ? null : Number(draft.min_price_zar),
          max_price_zar: draft.max_price_zar === '' ? null : Number(draft.max_price_zar),
          dynamic_enabled: draft.dynamic_enabled,
          priority: Number(draft.priority) || 0,
          is_active: draft.is_active,
          starts_at: draft.starts_at.trim()
            ? new Date(draft.starts_at).toISOString()
            : null,
          ends_at: draft.ends_at.trim() ? new Date(draft.ends_at).toISOString() : null,
          notes: draft.notes.trim() || null,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || 'Save failed');
      onToast({ type: 'success', message: 'Rule created' });
      setDraft(emptyDraft());
      await load();
    } catch (e) {
      onToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Could not create rule',
      });
    } finally {
      setSaving(false);
    }
  };

  const patchRule = async (id: string, patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pricing/rules/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || 'Update failed');
      onToast({ type: 'success', message: 'Saved' });
      await load();
    } catch (e) {
      onToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Could not update',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pricing/rules/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || 'Delete failed');
      onToast({ type: 'success', message: 'Rule deleted' });
      await load();
    } catch (e) {
      onToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Could not delete',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.section variants={fadeUp} className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-gray-900">Dynamic pricing rules (V6.2)</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Override multipliers, cap catalogue totals, or turn off dynamic pricing by area, weekday, and hour
            window. Higher priority wins.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading rules…
        </div>
      ) : (
        <>
          <div className="mb-4 overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Pri</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Service</th>
                  <th className="px-3 py-2">Area</th>
                  <th className="px-3 py-2">Day</th>
                  <th className="px-3 py-2">Hours</th>
                  <th className="px-3 py-2">Dyn</th>
                  <th className="px-3 py-2">×</th>
                  <th className="px-3 py-2">Min / Max ZAR</th>
                  <th className="px-3 py-2">Window</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rules.map((r) => (
                  <tr key={r.id} className={cn(!r.is_active && 'opacity-50')}>
                    <td className="px-3 py-2 font-mono text-xs">{r.priority}</td>
                    <td className="px-3 py-2 text-xs font-medium capitalize">{r.rule_type ?? 'multiplier'}</td>
                    <td className="px-3 py-2">{r.service_type ?? '—'}</td>
                    <td className="px-3 py-2">{r.area ?? '—'}</td>
                    <td className="px-3 py-2">
                      {r.day_of_week == null ? 'Any' : DAYS.find((d) => d.v === String(r.day_of_week))?.l}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {r.time_start ?? '—'}–{r.time_end ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void patchRule(r.id, { dynamic_enabled: !r.dynamic_enabled })}
                        className={cn(
                          'rounded px-2 py-0.5 text-xs font-semibold',
                          r.dynamic_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                        )}
                      >
                        {r.dynamic_enabled ? 'On' : 'Off'}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-mono">{r.multiplier_override ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {r.min_price_zar ?? '—'} / {r.max_price_zar ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-[10px] text-gray-500 max-w-[140px] truncate" title={r.notes ?? ''}>
                      {r.starts_at || r.ends_at
                        ? `${r.starts_at ? new Date(r.starts_at).toLocaleDateString() : '…'}→${r.ends_at ? new Date(r.ends_at).toLocaleDateString() : '…'}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void deleteRule(r.id)}
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                        aria-label="Delete rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-3 py-6 text-center text-gray-500">
                      No rules yet — add one below (e.g. cap max price for a suburb on weekends).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4">
            <p className="mb-3 text-sm font-semibold text-indigo-900">New rule</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-medium text-gray-600">
                Rule type
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  value={draft.rule_type}
                  onChange={(e) => setDraft((d) => ({ ...d, rule_type: e.target.value }))}
                >
                  <option value="override">Override (replace labour ×)</option>
                  <option value="multiplier">Multiplier (stack ×)</option>
                  <option value="cap">Cap (min/max ZAR only)</option>
                  <option value="disable">Disable (force ×1)</option>
                </select>
              </label>
              <label className="text-xs font-medium text-gray-600">
                Priority (higher wins first)
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  value={draft.priority}
                  onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Service (blank = any)
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  value={draft.service_type}
                  onChange={(e) => setDraft((d) => ({ ...d, service_type: e.target.value }))}
                >
                  <option value="">Any</option>
                  <option value="Standard">Standard</option>
                  <option value="Airbnb">Airbnb</option>
                </select>
              </label>
              <label className="text-xs font-medium text-gray-600">
                Area (exact match, suburb)
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  placeholder="e.g. Claremont"
                  value={draft.area}
                  onChange={(e) => setDraft((d) => ({ ...d, area: e.target.value }))}
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Day of week
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  value={draft.day_of_week}
                  onChange={(e) => setDraft((d) => ({ ...d, day_of_week: e.target.value }))}
                >
                  {DAYS.map((d) => (
                    <option key={d.l} value={d.v}>
                      {d.l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-gray-600">
                Time start (hour 0–23)
                <input
                  type="number"
                  min={0}
                  max={23}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  value={draft.time_start}
                  onChange={(e) => setDraft((d) => ({ ...d, time_start: e.target.value }))}
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Time end (hour 0–23)
                <input
                  type="number"
                  min={0}
                  max={23}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  value={draft.time_end}
                  onChange={(e) => setDraft((d) => ({ ...d, time_end: e.target.value }))}
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Dynamic pricing
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  value={draft.dynamic_enabled ? '1' : '0'}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, dynamic_enabled: e.target.value === '1' }))
                  }
                >
                  <option value="1">Enabled (use override below if set)</option>
                  <option value="0">Disabled (labour ×1 before override)</option>
                </select>
              </label>
              <label className="text-xs font-medium text-gray-600">
                Multiplier override
                <input
                  type="number"
                  step="0.05"
                  min={0.5}
                  max={2}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  placeholder="e.g. 1.25"
                  value={draft.multiplier_override}
                  onChange={(e) => setDraft((d) => ({ ...d, multiplier_override: e.target.value }))}
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Min price ZAR (catalogue line after frequency)
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  value={draft.min_price_zar}
                  onChange={(e) => setDraft((d) => ({ ...d, min_price_zar: e.target.value }))}
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Max price ZAR
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  value={draft.max_price_zar}
                  onChange={(e) => setDraft((d) => ({ ...d, max_price_zar: e.target.value }))}
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Active from (optional, local)
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  value={draft.starts_at}
                  onChange={(e) => setDraft((d) => ({ ...d, starts_at: e.target.value }))}
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Active until (optional)
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  value={draft.ends_at}
                  onChange={(e) => setDraft((d) => ({ ...d, ends_at: e.target.value }))}
                />
              </label>
              <label className="text-xs font-medium text-gray-600 sm:col-span-2 lg:col-span-3">
                Notes (internal)
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  placeholder="Why this rule exists"
                  value={draft.notes}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void createRule()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add rule
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void load()}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
              >
                <Save className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>
        </>
      )}
    </motion.section>
  );
}
