'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceType } from '@/types/booking';
import type { PricingResult } from '@/lib/pricing/engine';
import type { PricingConfig } from '@/lib/pricing/config';
import { pricingStore } from './pricingStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BEDROOM_OPTIONS = [
  { value: '1', label: '1 Bed' },
  { value: '2', label: '2 Beds' },
  { value: '3', label: '3 Beds' },
  { value: '4', label: '4 Beds' },
  { value: '5', label: '5 Beds' },
  { value: '6', label: '6+ Beds' },
];

const BATHROOM_OPTIONS = [
  { value: '1', label: '1 Bath' },
  { value: '2', label: '2 Baths' },
  { value: '3', label: '3 Baths' },
  { value: '4', label: '4+ Baths' },
];

function mapStoreServiceIdToBookingService(id: string): ServiceType | null {
  switch (id) {
    case 'standard':
      return 'Standard';
    case 'airbnb':
      return 'Airbnb';
    case 'deep':
      return 'Deep';
    case 'movein':
      return 'Move In/Out';
    case 'carpet':
      return 'Carpet';
    default:
      return null;
  }
}

function slugifyExtraNameForEngine(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function isRuleTraceLine(label: string): boolean {
  const t = label.toLowerCase();
  return (
    t.includes('surge') ||
    t.includes('discount') ||
    t.includes('frequency') ||
    t.includes('referral') ||
    t.includes('loyalty') ||
    t.includes('tier') ||
    t.includes('minimum')
  );
}

export type PricingEnginePanelProps = {
  engineVersion: number | null;
  engineUpdatedAt: string | null;
};

function EngineStatusCard({
  displayVersion,
  displayUpdated,
}: {
  displayVersion: number | string | null | undefined;
  displayUpdated: string | null;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-base shadow-sm">
      <div className="flex justify-between">
        <span className="font-medium text-gray-900">Engine</span>
        <span className="text-green-600">● Live</span>
      </div>
      <div className="mt-1 text-sm text-gray-500">
        Version:{' '}
        <span className="font-mono tabular-nums text-gray-800">{displayVersion ?? '—'}</span>
      </div>
      {displayUpdated ? (
        <div className="mt-1 text-sm text-gray-500">
          Updated:{' '}
          {new Date(displayUpdated).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </div>
      ) : null}
    </div>
  );
}

type SimulatorProps = {
  services: ReturnType<typeof pricingStore.getData>['services'];
  extras: ReturnType<typeof pricingStore.getData>['extras'];
  extraRooms: ReturnType<typeof pricingStore.getData>['extraRooms'];
  serviceId: string;
  setServiceId: (id: string) => void;
  bedrooms: string;
  setBedrooms: (v: string) => void;
  bathrooms: string;
  setBathrooms: (v: string) => void;
  selectedExtras: string[];
  setSelectedExtras: React.Dispatch<React.SetStateAction<string[]>>;
  selectedExtraRooms: string[];
  setSelectedExtraRooms: React.Dispatch<React.SetStateAction<string[]>>;
  cleanerCount: string;
  setCleanerCount: React.Dispatch<React.SetStateAction<string>>;
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  result: PricingResult | null;
  loading: boolean;
  error: string | null;
};

function SimulatorSection({
  services,
  extras,
  extraRooms,
  serviceId,
  setServiceId,
  bedrooms,
  setBedrooms,
  bathrooms,
  setBathrooms,
  selectedExtras,
  setSelectedExtras,
  selectedExtraRooms,
  setSelectedExtraRooms,
  cleanerCount,
  setCleanerCount,
  date,
  setDate,
  time,
  setTime,
  result,
  loading,
  error,
}: SimulatorProps) {
  const activeExtras = extras.filter((e) => e.active !== false);
  const activeExtraRooms = extraRooms.filter((r) => r.active !== false);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-purple-600 p-5 text-center text-white shadow-sm">
        <div className="text-sm opacity-80">Estimated Total</div>
        <div className="mt-1 text-3xl font-bold tabular-nums">
          R {result != null ? result.finalPrice.toLocaleString('en-ZA') : '—'}
        </div>
      </div>

      {loading && (
        <div className="text-sm text-gray-500">Updating pricing...</div>
      )}
      {error && (
        <div className="text-sm text-red-500">⚠ Failed to calculate pricing: {error}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Service</label>
          <div className="flex flex-wrap gap-2">
            {services
              .filter((s) => s.active !== false)
              .map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => setServiceId(svc.id)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors',
                    serviceId === svc.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {svc.name}
                </button>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Bedrooms</label>
          <div className="flex flex-wrap gap-2">
            {BEDROOM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBedrooms(opt.value)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-semibold',
                  bedrooms === opt.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                    : 'border-gray-200 text-gray-600'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Bathrooms</label>
          <div className="flex flex-wrap gap-2">
            {BATHROOM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBathrooms(opt.value)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-semibold',
                  bathrooms === opt.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                    : 'border-gray-200 text-gray-600'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {activeExtraRooms.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Extra rooms</label>
            <div className="flex flex-wrap gap-2">
              {activeExtraRooms.map((room) => {
                const isSelected = selectedExtraRooms.includes(room.id);
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() =>
                      setSelectedExtraRooms((prev) =>
                        isSelected ? prev.filter((id) => id !== room.id) : [...prev, room.id]
                      )
                    }
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm font-medium',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                        : 'border-gray-200 text-gray-600'
                    )}
                  >
                    {room.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Extras</label>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {activeExtras.map((extra) => {
              const isSelected = selectedExtras.includes(extra.id);
              return (
                <button
                  key={extra.id}
                  type="button"
                  onClick={() =>
                    setSelectedExtras((prev) =>
                      isSelected ? prev.filter((id) => id !== extra.id) : [...prev, extra.id]
                    )
                  }
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  )}
                >
                  <span className="block truncate">{extra.name}</span>
                  <span className="text-sm text-gray-500">R {extra.price}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Cleaners</span>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-base font-bold text-gray-700"
            onClick={() => setCleanerCount((v) => String(Math.max(1, parseInt(v, 10) - 1)))}
          >
            −
          </button>
          <span className="min-w-[2ch] text-center text-base font-bold">{cleanerCount}</span>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-base font-bold text-gray-700"
            onClick={() => setCleanerCount((v) => String(parseInt(v, 10) + 1))}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function BreakdownSection({
  result,
  loading,
  error,
}: {
  result: PricingResult | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Updating pricing...
      </div>
    );
  }
  if (error) {
    return <div className="text-sm text-red-500">⚠ Failed to calculate pricing: {error}</div>;
  }
  if (!result) {
    return <p className="text-sm text-gray-500">Adjust the simulator to see a breakdown.</p>;
  }

  return (
    <div className="rounded-xl bg-gray-50 p-4 space-y-2">
      {result.breakdown.map((item, i) => (
        <div key={`${item.label}-${i}`} className="flex justify-between text-sm text-gray-800">
          <span>{item.label}</span>
          <span className="tabular-nums">
            {item.amount < 0 ? '−' : ''}R {Math.abs(item.amount).toLocaleString('en-ZA')}
          </span>
        </div>
      ))}
      <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-base font-semibold">
        <span>Total</span>
        <span className="tabular-nums text-indigo-700">
          R {result.finalPrice.toLocaleString('en-ZA')}
        </span>
      </div>
      {result.duration > 0 && (
        <p className="pt-2 text-sm text-gray-500">
          Duration (hours):{' '}
          <span className="font-mono tabular-nums">{result.duration.toFixed(2)}</span>
        </p>
      )}
    </div>
  );
}

function RulesSection({
  result,
  traceLines,
  loading,
  error,
}: {
  result: PricingResult | null;
  traceLines: { label: string; amount: number }[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Updating pricing...
      </div>
    );
  }
  if (error) {
    return <div className="text-sm text-red-500">⚠ Failed to calculate pricing: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-base text-gray-600">
        <p className="font-medium text-gray-800">Calculation order</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          Catalogue base → rooms &amp; extras → surge → discounts / minimums → final ZAR (same as
          checkout).
        </p>
      </div>

      {traceLines.length === 0 ? (
        <p className="text-sm text-gray-500">No surge or discount lines for this scenario.</p>
      ) : (
        <ul className="space-y-2">
          {traceLines.map((rule) => (
            <li key={rule.label} className="flex justify-between text-sm text-gray-800">
              <span>{rule.label}</span>
              <span className="tabular-nums font-medium">
                {rule.amount < 0 ? '−' : ''}R {Math.abs(rule.amount).toLocaleString('en-ZA')}
              </span>
            </li>
          ))}
        </ul>
      )}

      {result && result.breakdown.length > 0 ? (
        <p className="text-sm text-gray-500">
          Full line list is on the <strong className="text-gray-700">Breakdown</strong> tab.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Sticky admin simulator: same authoritative path as checkout via POST /api/admin/pricing/engine-preview
 */
export function PricingEnginePanel({ engineVersion, engineUpdatedAt }: PricingEnginePanelProps) {
  const [services, setServices] = useState(() => pricingStore.getData().services);
  const [extras, setExtras] = useState(() => pricingStore.getData().extras);
  const [extraRooms, setExtraRooms] = useState(() => pricingStore.getData().extraRooms);

  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('1');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedExtraRooms, setSelectedExtraRooms] = useState<string[]>([]);
  const [cleanerCount, setCleanerCount] = useState('1');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('10:00');

  const [result, setResult] = useState<PricingResult | null>(null);
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return pricingStore.subscribe(() => {
      const d = pricingStore.getData();
      setServices(d.services);
      setExtras(d.extras);
      setExtraRooms(d.extraRooms);
    });
  }, []);

  const runEnginePreview = useCallback(async () => {
    const bookingSvc = mapStoreServiceIdToBookingService(serviceId);
    if (!bookingSvc) {
      setResult(null);
      setError('Select a service that maps to the live engine (Standard, Deep, …).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const bedroomNum = Math.max(1, parseInt(bedrooms, 10) || 1);
      const bathroomNum = Math.max(1, parseInt(bathrooms, 10) || 1);
      const extrasForApi = selectedExtras
        .map((xid) => {
          const ex = extras.find((e) => e.id === xid);
          return ex ? slugifyExtraNameForEngine(ex.name) : xid;
        })
        .filter(Boolean);

      const res = await fetch('/api/admin/pricing/engine-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          service: bookingSvc,
          date,
          time,
          bedrooms: bedroomNum,
          bathrooms: bathroomNum,
          extraRooms: selectedExtraRooms.length,
          extras: extrasForApi,
          extrasQuantities: {},
          frequency: 'one-time',
          tipAmount: 0,
          discountAmount: 0,
          numberOfCleaners: Math.max(1, parseInt(cleanerCount, 10) || 1),
          pricingMode: 'premium',
          provideEquipment: false,
          ...(bookingSvc === 'Carpet'
            ? {
                carpetDetails: {
                  hasFittedCarpets: true,
                  hasLooseCarpets: false,
                  numberOfRooms: bedroomNum,
                  numberOfLooseCarpets: 0,
                  roomStatus: 'hasProperty' as const,
                },
              }
            : {}),
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        result?: PricingResult;
        config?: PricingConfig;
      };
      if (!res.ok || !json.ok || !json.result) {
        throw new Error(json.error || 'Engine preview failed');
      }
      setResult(json.result);
      if (json.config) setConfig(json.config);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setLoading(false);
    }
  }, [
    serviceId,
    bedrooms,
    bathrooms,
    selectedExtras,
    selectedExtraRooms,
    cleanerCount,
    date,
    time,
    extras,
    extraRooms,
  ]);

  useEffect(() => {
    let cancelled = false;
    const tid = window.setTimeout(() => {
      void runEnginePreview().then(() => {
        if (cancelled) return;
      });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(tid);
    };
  }, [runEnginePreview]);

  const traceLines = result?.breakdown.filter((row) => isRuleTraceLine(row.label)) ?? [];

  const displayVersion = config?.version ?? engineVersion;
  const displayUpdated = config?.updatedAt ?? engineUpdatedAt;

  const simulatorProps: SimulatorProps = {
    services,
    extras,
    extraRooms,
    serviceId,
    setServiceId,
    bedrooms,
    setBedrooms,
    bathrooms,
    setBathrooms,
    selectedExtras,
    setSelectedExtras,
    selectedExtraRooms,
    setSelectedExtraRooms,
    cleanerCount,
    setCleanerCount,
    date,
    setDate,
    time,
    setTime,
    result,
    loading,
    error,
  };

  return (
    <div className="w-full space-y-4">
      <EngineStatusCard displayVersion={displayVersion} displayUpdated={displayUpdated} />

      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <Tabs defaultValue="simulator" className="w-full">
          <TabsList className="mb-4 grid h-auto w-full grid-cols-3 gap-1 p-1">
            <TabsTrigger value="simulator" className="text-sm">
              Simulator
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="text-sm">
              Breakdown
            </TabsTrigger>
            <TabsTrigger value="rules" className="text-sm">
              Rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simulator" className="mt-0">
            <SimulatorSection {...simulatorProps} />
          </TabsContent>

          <TabsContent value="breakdown" className="mt-0">
            <BreakdownSection result={result} loading={loading} error={error} />
          </TabsContent>

          <TabsContent value="rules" className="mt-0">
            <RulesSection
              result={result}
              traceLines={traceLines}
              loading={loading}
              error={error}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
