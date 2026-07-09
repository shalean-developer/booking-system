'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Sparkles,
  Radio,
  FileText,
  CreditCard,
  Receipt,
  Tag,
  BookOpen,
  BarChart2,
  TrendingUp,
  Settings,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Clock,
  Percent,
  AlertCircle,
  Edit2,
  Trash2,
  Home,
  Bath,
  BedDouble,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PricingEngineConfigProvider, usePricingEngineConfig } from '@/components/admin/pricing-engine-config-context';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminPageId =
  | 'customers'
  | 'cleaners'
  | 'channels'
  | 'quotes'
  | 'payments'
  | 'invoices'
  | 'pricing'
  | 'blog'
  | 'reports'
  | 'growth'
  | 'settings';
type PricingTab = 'base' | 'adjustments' | 'extras' | 'labour' | 'dynamic' | 'discounts';
interface ServicePricingRow {
  id: string;
  name: string;
  type: 'Fixed' | 'Per Room' | 'Per Bath';
  basePrice: number;
  active: boolean;
}
interface ExtraCard {
  id: string;
  emoji: string;
  label: string;
  price: number;
  active: boolean;
}
interface PromoCard {
  id: string;
  code: string;
  description: string;
  discount: string;
  uses: number;
  active: boolean;
  expires: string;
  conditions: string;
}
interface RoomChip {
  id: string;
  label: string;
  price: number;
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const ADMIN_NAV: Array<{
  id: AdminPageId;
  label: string;
  icon: React.ElementType;
  badge?: string;
}> = [
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'cleaners', label: 'Cleaners', icon: Sparkles },
  { id: 'channels', label: 'Channels', icon: Radio },
  { id: 'quotes', label: 'Quotes', icon: FileText },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'pricing', label: 'Pricing', icon: Tag, badge: 'Active' },
  { id: 'blog', label: 'Blog Management', icon: BookOpen },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
];
const PRICING_TABS: Array<{
  id: PricingTab;
  label: string;
}> = [
  { id: 'base', label: 'Base Pricing' },
  { id: 'adjustments', label: 'Adjustments' },
  { id: 'extras', label: 'Extras' },
  { id: 'labour', label: 'Labour' },
  { id: 'dynamic', label: 'Dynamic Rules' },
  { id: 'discounts', label: 'Discounts' },
];

// ─── Engine Simulator ─────────────────────────────────────────────────────────

function EngineSimulator() {
  const { config, loading } = usePricingEngineConfig();
  const serviceEntries = useMemo(() => {
    if (!config?.services) return [] as { id: string; label: string; base: number }[];
    return Object.entries(config.services).map(([name, base]) => ({
      id: name,
      label: name,
      base: Math.round(base),
    }));
  }, [config?.services]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  useEffect(() => {
    if (serviceEntries.length && !selectedKey) {
      setSelectedKey(serviceEntries[0].id);
    }
  }, [serviceEntries, selectedKey]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('10:00');
  const selectedBase = serviceEntries.find((s) => s.id === selectedKey)?.base;
  const fee = config?.serviceFee != null ? Math.round(config.serviceFee) : null;
  const illustrativeTotal =
    selectedBase != null && fee != null ? selectedBase + fee : selectedBase ?? null;

  return (
    <div className="sticky top-20 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
        <p className="text-xs font-bold text-gray-900">Engine Simulator</p>
        <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-semibold text-violet-600">
          {loading ? '…' : config ? `v${config.version}` : '—'}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 p-4 text-center">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-violet-200">Catalog base + fee</p>
          <p className="text-4xl font-extrabold leading-none text-white">
            {illustrativeTotal != null ? `R ${illustrativeTotal}` : '—'}
          </p>
          <p className="mt-1.5 text-xs text-violet-200">Illustrative (base + service fee)</p>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Service</p>
          <div className="flex flex-wrap gap-1.5">
            {serviceEntries.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => setSelectedKey(svc.id)}
                className={cn(
                  'rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all',
                  selectedKey === svc.id
                    ? 'border-transparent bg-violet-600 text-white'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-violet-200 hover:text-violet-600',
                )}
              >
                {svc.label}
              </button>
            ))}
            {!loading && serviceEntries.length === 0 ? (
              <span className="text-[11px] text-gray-400">No services in config</span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Date</p>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-gray-700 outline-none"
              />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Time</p>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <Clock className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-gray-700 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Breakdown</p>
          {[
            {
              id: 'bd-base',
              label: 'Base (catalog)',
              value: selectedBase != null ? `R ${selectedBase}` : '—',
            },
            {
              id: 'bd-fee',
              label: 'Service fee',
              value: fee != null ? `R ${fee}` : '—',
            },
          ].map((row) => (
            <div key={row.id} className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">{row.label}</span>
              <span className="text-[11px] font-bold text-gray-700">{row.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-gray-100 pt-2">
            <span className="text-xs font-bold text-gray-900">Illustrative total</span>
            <span className="text-sm font-extrabold text-violet-600">
              {illustrativeTotal != null ? `R ${illustrativeTotal}` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Base Pricing Section ──────────────────────────────────────────────────────

function BasePricingSection() {
  const { config, loading } = usePricingEngineConfig();
  const [services, setServices] = useState<ServicePricingRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'fixed' | 'per_room'>('all');

  useEffect(() => {
    if (!config?.serviceLineItems) {
      setServices([]);
      return;
    }
    setServices(
      Object.entries(config.serviceLineItems).map(([name, line], i) => ({
        id: `svc-${name}-${i}`,
        name,
        type: (line.bedroom > 0 || line.bathroom > 0 ? 'Per Room' : 'Fixed') as ServicePricingRow['type'],
        basePrice: Math.round(line.base),
        active: true,
      })),
    );
  }, [config]);

  const roomChips = useMemo(() => {
    const std = config?.serviceLineItems?.Standard;
    if (!std) return [] as RoomChip[];
    return [1, 2, 3, 4, 5, 6].map((n) => ({
      id: `rc-${n}`,
      label: `${n} bedroom${n > 1 ? 's' : ''}`,
      price: Math.round(std.base + n * std.bedroom + std.bathroom),
    }));
  }, [config?.serviceLineItems]);

  const toggleService = (id: string) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  };
  const filtered = services.filter((s) => {
    if (activeFilter === 'fixed') return s.type === 'Fixed';
    if (activeFilter === 'per_room') return s.type === 'Per Room' || s.type === 'Per Bath';
    return true;
  });
  const filterTabs = [{ id: 'all' as const, label: 'All' }, { id: 'fixed' as const, label: 'Fixed' }, { id: 'per_room' as const, label: 'Room-Based' }];

  if (loading && !config) {
    return <p className="text-sm text-gray-500">Loading pricing…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Services Pricing</h3>
            <p className="mt-0.5 text-xs text-gray-400">Live values from pricing_config (read-only overview)</p>
          </div>
          <div className="flex items-center gap-2">
            {filterTabs.map((ft) => (
              <button
                key={ft.id}
                type="button"
                onClick={() => setActiveFilter(ft.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all',
                  activeFilter === ft.id
                    ? 'border-transparent bg-violet-600 text-white'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-violet-200',
                )}
              >
                {ft.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Service
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Type</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Base Price
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn('transition-colors hover:bg-gray-50/50', i !== filtered.length - 1 && 'border-b border-gray-100')}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-gray-800">{row.name}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[11px] font-bold',
                        row.type === 'Fixed'
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                          : row.type === 'Per Room'
                            ? 'border-blue-200 bg-blue-50 text-blue-600'
                            : 'border-teal-200 bg-teal-50 text-teal-600',
                      )}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="text-sm font-extrabold text-gray-900">R {row.basePrice}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <button type="button" onClick={() => toggleService(row.id)} aria-label="Toggle active">
                      {row.active ? (
                        <ToggleRight className="h-6 w-6 text-violet-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-300" />
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400 transition-colors hover:border-violet-200 hover:text-violet-600"
                        aria-label="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400 transition-colors hover:border-red-200 hover:text-red-500"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            className="flex items-center gap-2 text-xs font-bold text-violet-600 transition-colors hover:text-violet-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-bold text-gray-900">Example totals (Standard)</h3>
          <p className="mt-0.5 text-xs text-gray-400">base + n×bedroom + 1×bathroom — illustrative</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 p-5 sm:grid-cols-3 lg:grid-cols-6">
          {roomChips.length === 0 ? (
            <p className="col-span-full text-center text-sm text-gray-400">No Standard service line in config</p>
          ) : (
            roomChips.map((rc) => (
              <div
                key={rc.id}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-center"
              >
                <BedDouble className="h-4 w-4 text-violet-400" />
                <span className="text-[11px] font-bold leading-tight text-gray-700">{rc.label}</span>
                <span className="text-sm font-extrabold text-violet-600">R{rc.price}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Adjustments Section ─────────────────────────────────────────────────────

function AdjustmentsSection() {
  const { config } = usePricingEngineConfig();
  const bath = config?.adjustments?.bathroom ?? 0;
  const er = config?.adjustments?.extraRoom ?? 0;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
          <Bath className="h-4 w-4 text-violet-500" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">Bathroom add-on (catalog)</h3>
            <p className="text-xs text-gray-400">From active pricing_config bathroom row</p>
          </div>
        </div>
        <div className="p-5">
          <p className="text-2xl font-extrabold text-gray-900">R {Math.round(bath)}</p>
          <p className="mt-2 text-xs text-gray-500">Edit in Supabase pricing_config (price_type bathroom) or admin pricing tools.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
          <Home className="h-4 w-4 text-violet-500" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">Extra room add-on (catalog)</h3>
            <p className="text-xs text-gray-400">From active pricing_config extra_room row</p>
          </div>
        </div>
        <div className="p-5">
          <p className="text-2xl font-extrabold text-gray-900">R {Math.round(er)}</p>
          <p className="mt-2 text-xs text-gray-500">Per extra room line item in pricing_config.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Extras Section ───────────────────────────────────────────────────────────

function ExtrasSection() {
  const { config } = usePricingEngineConfig();
  const [extras, setExtras] = useState<ExtraCard[]>([]);
  useEffect(() => {
    if (!config?.extras) {
      setExtras([]);
      return;
    }
    setExtras(
      Object.entries(config.extras).map(([label, price], i) => ({
        id: `ex-${i}-${label}`,
        emoji: '✨',
        label,
        price: Math.round(price),
        active: true,
      })),
    );
  }, [config]);
  const toggleExtra = (id: string) => {
    setExtras((prev) => prev.map((ex) => (ex.id === id ? { ...ex, active: !ex.active } : ex)));
  };
  const activeCount = extras.filter((e) => e.active).length;
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Extra Services</h3>
          <p className="mt-0.5 text-xs text-gray-400">
            <span className="font-bold text-violet-600">{activeCount} active</span> · Toggle and price add-ons
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600 transition-colors hover:bg-violet-100"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Extra</span>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {extras.map((ex) => (
          <div
            key={ex.id}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all',
              ex.active ? 'border-violet-200 bg-violet-50' : 'border-gray-200 bg-gray-50 opacity-60',
            )}
          >
            <span className="text-2xl leading-none">{ex.emoji}</span>
            <p className="text-[11px] font-bold leading-tight text-gray-700">{ex.label}</p>
            <p className="text-xs font-extrabold text-violet-600">R{ex.price}</p>
            <button type="button" onClick={() => toggleExtra(ex.id)} className="mt-0.5" aria-label="Toggle extra">
              {ex.active ? (
                <ToggleRight className="h-5 w-5 text-violet-600" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-gray-300" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Labour Section ───────────────────────────────────────────────────────────

function LabourSection() {
  const { config } = usePricingEngineConfig();
  const hourly = config?.labor?.baseHourlyRate != null ? Math.round(config.labor.baseHourlyRate) : null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className={cn('flex items-center gap-3 border-b border-gray-100 px-5 py-4')}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <Users className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Quick Clean / hourly (catalog)</h3>
            <p className="text-xs text-gray-400">From quick_clean_settings + engine bundle</p>
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Base hourly rate (ZAR)</p>
            <p className="mt-0.5 text-lg font-extrabold text-gray-900">{hourly != null ? `R ${hourly} / hr` : '—'}</p>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className={cn('flex items-center gap-3 border-b border-gray-100 px-5 py-4')}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Service fee (catalog)</h3>
            <p className="text-xs text-gray-400">Applied on bookings</p>
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Fee (ZAR)</p>
            <p className="mt-0.5 text-lg font-extrabold text-gray-900">
              {config?.serviceFee != null ? `R ${Math.round(config.serviceFee)}` : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dynamic Rules Section ────────────────────────────────────────────────────

function DynamicRulesSection() {
  const { config } = usePricingEngineConfig();
  const surge = config?.rules?.surge;
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-bold text-gray-900">Surge / multipliers (engine config)</h3>
          <p className="mt-0.5 text-xs text-gray-400">Read-only snapshot from loadPricingEngineConfig</p>
        </div>
        <div className="divide-y divide-gray-100 px-5 py-2">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-600">Weekend multiplier</span>
            <span className="text-sm font-extrabold text-gray-900">{surge?.weekendMultiplier ?? '—'}×</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-600">Peak hours multiplier</span>
            <span className="text-sm font-extrabold text-gray-900">{surge?.peakHoursMultiplier ?? '—'}×</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-600">Surge enabled</span>
            <span className="text-sm font-extrabold text-gray-900">{surge?.enabled ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Discounts Section ────────────────────────────────────────────────────────

function DiscountsSection() {
  const { config } = usePricingEngineConfig();
  const [promos, setPromos] = useState<PromoCard[]>([]);
  useEffect(() => {
    const codes = config?.discounts?.promoCodes;
    if (!codes || Object.keys(codes).length === 0) {
      setPromos([]);
      return;
    }
    setPromos(
      Object.entries(codes).map(([code, value], i) => ({
        id: `promo-${i}-${code}`,
        code,
        description: 'Discount code (active)',
        discount: `Value: ${value}`,
        uses: 0,
        active: true,
        expires: '—',
        conditions: 'Managed in discount_codes',
      })),
    );
  }, [config]);
  const togglePromo = (id: string) => {
    setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  };
  const activePromos = promos.filter((p) => p.active);
  const expiredPromos = promos.filter((p) => !p.active);
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Promo Codes</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              <span className="font-bold text-emerald-600">{activePromos.length} active</span>
              <span className="mx-1.5 text-gray-300">·</span>
              <span className="text-gray-400">{expiredPromos.length} inactive</span>
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Promo</span>
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className={cn(
                'flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/50',
                !promo.active && 'opacity-60',
              )}
            >
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 px-1 text-center shadow-sm">
                <span className="text-xs font-extrabold leading-tight text-white">{promo.code}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">{promo.description}</p>
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
                      promo.active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                        : 'border-gray-200 bg-gray-50 text-gray-400',
                    )}
                  >
                    {promo.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-extrabold text-violet-600">{promo.discount}</span>
                  <span className="text-[11px] text-gray-400">· {promo.conditions}</span>
                  <span className="text-[11px] text-gray-400">· {promo.expires}</span>
                  <span className="text-[11px] text-gray-400">· {promo.uses} uses</span>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400 transition-colors hover:border-violet-200 hover:text-violet-600"
                  aria-label="Edit promo"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => togglePromo(promo.id)} aria-label="Toggle promo">
                  {promo.active ? (
                    <ToggleRight className="h-6 w-6 text-violet-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-300" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Pricing Engine Content ───────────────────────────────────────────────────

function PricingEngineContent() {
  const { config, loading, error } = usePricingEngineConfig();
  const statCards = useMemo(() => {
    const nServices = config?.serviceLineItems ? Object.keys(config.serviceLineItems).length : 0;
    const nExtras = config?.extras ? Object.keys(config.extras).length : 0;
    const nPromos = config?.discounts?.promoCodes ? Object.keys(config.discounts.promoCodes).length : 0;
    return [
      {
        id: 'stat-services',
        label: 'Active Services',
        value: nServices,
        color: 'bg-violet-50',
        iconBg: 'bg-violet-100',
        textColor: 'text-violet-700',
        icon: Layers,
      },
      {
        id: 'stat-extras',
        label: 'Catalog extras',
        value: nExtras,
        color: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: Plus,
      },
      {
        id: 'stat-rooms',
        label: 'Service fee (ZAR)',
        value: config?.serviceFee != null ? Math.round(config.serviceFee) : '—',
        color: 'bg-gray-50',
        iconBg: 'bg-gray-100',
        textColor: 'text-gray-600',
        icon: Home,
      },
      {
        id: 'stat-promos',
        label: 'Active promos',
        value: nPromos,
        color: 'bg-emerald-50',
        iconBg: 'bg-emerald-100',
        textColor: 'text-emerald-700',
        icon: Percent,
      },
    ];
  }, [config]);

  const [activeTab, setActiveTab] = useState<PricingTab>('base');
  const [sectionsOpen, setSectionsOpen] = useState<Record<PricingTab, boolean>>({
    base: true,
    adjustments: true,
    extras: true,
    labour: true,
    dynamic: true,
    discounts: true,
  });
  const toggleSection = (tab: PricingTab) => {
    setSectionsOpen((prev) => ({
      ...prev,
      [tab]: !prev[tab],
    }));
  };
  return (
    <div className="min-w-0 flex-1 space-y-5">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1.5 flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-gray-900">Pricing Engine</h1>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span>
                  {loading ? 'Loading…' : config ? `Version: ${config.version} · Live` : 'No config'}
                </span>
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Configure dynamic pricing, extras, discounts and labour rates for all services.
            </p>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-shadow hover:shadow-lg"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Publish changes</span>
          </motion.button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.id} className={cn('flex items-center gap-3 rounded-xl p-3.5', card.color)}>
              <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl', card.iconBg)}>
                <card.icon className={cn('h-4 w-4', card.textColor)} />
              </div>
              <div>
                <p className={cn('text-2xl font-extrabold leading-none', card.textColor)}>{card.value}</p>
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        {PRICING_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-shrink-0 rounded-full border-2 px-4 py-2 text-xs font-bold transition-all duration-200',
              activeTab === tab.id
                ? 'border-transparent bg-violet-600 text-white'
                : 'border-gray-200 bg-white text-gray-500 hover:border-violet-200 hover:text-violet-600',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={() => toggleSection(activeTab)}
          className="mb-3 flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3.5 shadow-sm transition-colors hover:bg-gray-50/50"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">
              {PRICING_TABS.find((t) => t.id === activeTab)?.label}
            </span>
            <span className="rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-600">
              Expanded
            </span>
          </div>
          {sectionsOpen[activeTab] ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        <AnimatePresence mode="wait">
          {sectionsOpen[activeTab] && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'base' && <BasePricingSection />}
              {activeTab === 'adjustments' && <AdjustmentsSection />}
              {activeTab === 'extras' && <ExtrasSection />}
              {activeTab === 'labour' && <LabourSection />}
              {activeTab === 'dynamic' && <DynamicRulesSection />}
              {activeTab === 'discounts' && <DiscountsSection />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Workspace (fits inside existing AdminShell main) ────────────────────────

export function PricingEngineWorkspace() {
  return (
    <PricingEngineConfigProvider>
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <PricingEngineContent />
        <div className="hidden w-full shrink-0 xl:block xl:w-72">
          <EngineSimulator />
        </div>
      </div>
    </PricingEngineConfigProvider>
  );
}

const PORTAL_ROUTES: Partial<Record<AdminPageId, string>> = {
  pricing: '/admin/pricing',
  quotes: '/admin/quotes',
};

export type PricingEngineDashboardProps = {
  initialPage?: AdminPageId;
  /** Render real pages inside the portal shell (e.g. quotes table on `/admin/quotes`). */
  pageOverrides?: Partial<Record<AdminPageId, React.ReactNode>>;
};

// ─── Main Dashboard (full-page with own chrome) ───────────────────────────────

export function PricingEngineDashboard({
  initialPage = 'pricing',
  pageOverrides,
}: PricingEngineDashboardProps) {
  const router = useRouter();
  const [activePage, setActivePage] = useState<AdminPageId>(initialPage);
  const [searchValue, setSearchValue] = useState('');
  const today = new Date().toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return (
    <div className="flex min-h-screen bg-[#f8f9fb]">
      <aside
        className="sticky top-0 hidden min-h-screen w-60 flex-shrink-0 flex-col border-r border-gray-200 bg-white lg:flex"
        aria-label="Admin navigation"
      >
        <div className="border-b border-gray-100 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase leading-none tracking-widest text-gray-400">Shalean</p>
              <p className="text-sm font-bold leading-tight text-gray-900">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {ADMIN_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                const path = PORTAL_ROUTES[item.id];
                if (path) {
                  router.push(path);
                } else {
                  setActivePage(item.id);
                }
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                activePage === item.id ? 'bg-violet-50 text-violet-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
              )}
            >
              <item.icon className={cn('h-4 w-4 flex-shrink-0', activePage === item.id ? 'text-violet-600' : 'text-gray-400')} />
              <span>{item.label}</span>
              {item.badge ? (
                <span className="ml-auto flex-shrink-0 rounded-full bg-violet-600 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                  {item.badge}
                </span>
              ) : null}
              {activePage === item.id && !item.badge ? (
                <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-600" />
              ) : null}
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-bold text-white">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-gray-900">Admin User</p>
              <p className="truncate text-[10px] text-gray-400">admin@shalean.co.za</p>
            </div>
            <div className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
            <div className="flex flex-shrink-0 items-center gap-2.5 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="max-w-md flex-1">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 transition-colors focus-within:border-violet-300">
                <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search bookings, clients..."
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="ml-auto flex flex-shrink-0 items-center gap-3">
              <div className="hidden items-center gap-2 text-xs text-gray-500 sm:flex">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-semibold">{today}</span>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-bold text-white transition-opacity hover:opacity-90"
                aria-label="Admin profile"
              >
                A
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-10">
          {pageOverrides?.[activePage] != null ? (
            <div className="min-w-0 max-w-[1400px]">{pageOverrides[activePage]}</div>
          ) : activePage === 'pricing' ? (
            <PricingEngineConfigProvider>
              <div className="flex items-start gap-6">
                <PricingEngineContent />
                <div className="hidden w-72 flex-shrink-0 xl:block">
                  <EngineSimulator />
                </div>
              </div>
            </PricingEngineConfigProvider>
          ) : (
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="flex min-h-[60vh] items-center justify-center"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50">
                  {(() => {
                    const navItem = ADMIN_NAV.find((n) => n.id === activePage);
                    if (!navItem) return null;
                    return <navItem.icon className="h-7 w-7 text-violet-500" />;
                  })()}
                </div>
                <h2 className="mb-1 text-base font-extrabold text-gray-900">
                  {ADMIN_NAV.find((n) => n.id === activePage)?.label}
                </h2>
                <p className="text-sm text-gray-400">This section is under construction.</p>
              </div>
            </motion.div>
          )}
        </main>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex overflow-x-auto border-t border-gray-200 bg-white lg:hidden"
        aria-label="Mobile navigation"
      >
        {ADMIN_NAV.slice(0, 5).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              const path = PORTAL_ROUTES[item.id];
              if (path) {
                router.push(path);
              } else {
                setActivePage(item.id);
              }
            }}
            className={cn(
              'flex min-w-[60px] flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-all',
              activePage === item.id ? 'text-violet-600' : 'text-gray-400',
            )}
            aria-label={item.label}
          >
            <item.icon className="h-5 w-5" />
            <span
              className={cn(
                'text-[10px] font-bold leading-none',
                activePage === item.id ? 'text-violet-600' : 'text-gray-400',
              )}
            >
              {item.label.split(' ')[0]}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
