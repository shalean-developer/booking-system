'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookingV2StepNav } from '@/components/booking-v2/step-nav';
import { useBookingStore, type BookingV2ServiceId } from '@/shared/booking-v2/useBookingStore';
import { buildPricingPreviewBody } from '@/shared/booking-v2/pricing-request';
import { slugifyExtraId } from '@/lib/booking-pricing-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type FormApi = {
  ok: boolean;
  services: Array<{ type: string; label: string; icon?: string }>;
  extras: { all: string[]; standardAndAirbnb: string[]; deepAndMove: string[] };
};

const SERVICES: { id: BookingV2ServiceId; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'deep', label: 'Deep clean' },
  { id: 'move', label: 'Move in / out' },
  { id: 'airbnb', label: 'Airbnb' },
  { id: 'carpet', label: 'Carpet' },
];

function extrasForService(service: BookingV2ServiceId | null, api: FormApi | null): string[] {
  if (!api?.ok || !service) return [];
  if (service === 'standard' || service === 'airbnb') return api.extras.standardAndAirbnb;
  if (service === 'deep' || service === 'move') return api.extras.deepAndMove;
  return api.extras.all;
}

export default function BookingV2Step1Page() {
  const patch = useBookingStore((s) => s.patch);
  const clearPricingLock = useBookingStore((s) => s.clearPricingLock);
  const service = useBookingStore((s) => s.service);
  const rooms = useBookingStore((s) => s.rooms);
  const bathrooms = useBookingStore((s) => s.bathrooms);
  const extras = useBookingStore((s) => s.extras);
  const extrasQuantities = useBookingStore((s) => s.extrasQuantities);
  const date = useBookingStore((s) => s.date);
  const suburb = useBookingStore((s) => s.suburb);
  const basePrice = useBookingStore((s) => s.basePrice);

  const [form, setForm] = useState<FormApi | null>(null);
  const [baseLoading, setBaseLoading] = useState(false);
  const [baseErr, setBaseErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/booking/form-data', { cache: 'no-store' });
        const j = (await res.json()) as FormApi;
        if (!cancelled) setForm(j);
      } catch {
        if (!cancelled) setForm(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const catalogueExtras = useMemo(() => extrasForService(service, form), [service, form]);

  const refreshBasePrice = useCallback(async () => {
    if (!service || !date.trim()) {
      patch({ basePrice: null });
      return;
    }
    setBaseLoading(true);
    setBaseErr(null);
    try {
      const res = await fetch('/api/booking/pricing-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPricingPreviewBody({ service, rooms, bathrooms, extras, extrasQuantities, date, suburb })),
      });
      const j = (await res.json()) as { success?: boolean; data?: { base?: number }; error?: string };
      if (!res.ok || j.success === false) {
        patch({ basePrice: null });
        setBaseErr(j.error || 'Could not estimate base price.');
        return;
      }
      const b = typeof j.data?.base === 'number' && Number.isFinite(j.data.base) ? Math.round(j.data.base) : null;
      patch({ basePrice: b });
    } catch {
      patch({ basePrice: null });
      setBaseErr('Network error.');
    } finally {
      setBaseLoading(false);
    }
  }, [service, rooms, bathrooms, extras, extrasQuantities, date, suburb, patch]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refreshBasePrice();
    }, 400);
    return () => window.clearTimeout(t);
  }, [refreshBasePrice]);

  useEffect(() => {
    clearPricingLock();
  }, [service, rooms, bathrooms, extras, date, suburb, clearPricingLock]);

  const toggleExtra = (name: string) => {
    const id = slugifyExtraId(name);
    const on = extras.includes(id);
    if (on) {
      patch({
        extras: extras.filter((e) => e !== id),
        extrasQuantities: Object.fromEntries(Object.entries(extrasQuantities).filter(([k]) => k !== id)),
      });
    } else {
      patch({ extras: [...extras, id], extrasQuantities: { ...extrasQuantities, [id]: 1 } });
    }
  };

  const canContinue =
    Boolean(service) && rooms >= 1 && bathrooms >= 1 && date.trim().length >= 10 && suburb.trim().length >= 2;

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <Link href="/" className="text-sm font-medium text-violet-600 hover:underline">
            ← Home
          </Link>
          <h1 className="text-lg font-bold text-zinc-900">Book cleaning</h1>
          <span className="w-14" />
        </div>
        <BookingV2StepNav active={0} />
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Service & home</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Service</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => patch({ service: s.id })}
                    className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                      service === s.id ? 'border-violet-600 bg-violet-50 text-violet-900' : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rooms">Bedrooms</Label>
                <Input
                  id="rooms"
                  inputMode="numeric"
                  type="number"
                  min={1}
                  max={20}
                  value={rooms}
                  onChange={(e) => patch({ rooms: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bath">Bathrooms</Label>
                <Input
                  id="bath"
                  inputMode="numeric"
                  type="number"
                  min={1}
                  max={20}
                  value={bathrooms}
                  onChange={(e) => patch({ bathrooms: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => patch({ date: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suburb">Suburb / area</Label>
              <Input
                id="suburb"
                placeholder="e.g. Sea Point"
                value={suburb}
                onChange={(e) => patch({ suburb: e.target.value })}
              />
            </div>

            {catalogueExtras.length ? (
              <div className="space-y-2">
                <Label>Extras</Label>
                <div className="flex flex-wrap gap-2">
                  {catalogueExtras.map((name) => {
                    const id = slugifyExtraId(name);
                    const active = extras.includes(id);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleExtra(name)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          active ? 'border-violet-600 bg-violet-50 text-violet-800' : 'border-zinc-200 bg-white text-zinc-600'
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
              <p className="font-semibold text-zinc-800">Estimated base (excl. slot &amp; fees)</p>
              {baseLoading ? <p className="text-zinc-500">Calculating…</p> : null}
              {!baseLoading && baseErr ? <p className="text-red-600">{baseErr}</p> : null}
              {!baseLoading && !baseErr && basePrice != null ? (
                <p className="text-lg font-bold text-zinc-900">R {basePrice.toLocaleString('en-ZA')}</p>
              ) : null}
              {!baseLoading && !baseErr && basePrice == null && service && date ? (
                <p className="text-zinc-500">Enter details to see a base estimate.</p>
              ) : null}
            </div>

            <Button asChild className="w-full rounded-full" disabled={!canContinue}>
              <Link href="/booking-v2/cleaner">Continue to schedule</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
