'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookingV2StepNav } from '@/components/booking-v2/step-nav';
import { useBookingStore } from '@/shared/booking-v2/useBookingStore';
import { buildCreateSnapshotBody } from '@/shared/booking-v2/pricing-request';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';
import { computeBookingDurationMinutes } from '@/lib/booking-duration';
import type { Cleaner } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Slot = { start: string; available: boolean; recommended?: boolean };

function fallbackSlots(): Slot[] {
  const out: Slot[] = [];
  for (let h = 8; h <= 16; h++) {
    for (const m of [0, 30] as const) {
      if (h === 16 && m === 30) break;
      out.push({ start: `${String(h).padStart(2, '0')}:${m === 0 ? '00' : '30'}`, available: true });
    }
  }
  return out;
}

export default function BookingV2CleanerPage() {
  const router = useRouter();
  const service = useBookingStore((s) => s.service);
  const rooms = useBookingStore((s) => s.rooms);
  const bathrooms = useBookingStore((s) => s.bathrooms);
  const extras = useBookingStore((s) => s.extras);
  const extrasQuantities = useBookingStore((s) => s.extrasQuantities);
  const date = useBookingStore((s) => s.date);
  const suburb = useBookingStore((s) => s.suburb);
  const time = useBookingStore((s) => s.time);
  const locked = useBookingStore((s) => s.locked);
  const finalPrice = useBookingStore((s) => s.finalPrice);
  const cleanerId = useBookingStore((s) => s.cleanerId);
  const tipAmount = useBookingStore((s) => s.tipAmount);
  const discountAmount = useBookingStore((s) => s.discountAmount);
  const promoCode = useBookingStore((s) => s.promoCode);
  const patch = useBookingStore((s) => s.patch);
  const applyPricingLock = useBookingStore((s) => s.applyPricingLock);
  const clearPricingLock = useBookingStore((s) => s.clearPricingLock);

  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [lockErr, setLockErr] = useState<string | null>(null);

  useEffect(() => {
    if (!service || !date.trim()) router.replace('/booking-v2');
  }, [service, date, router]);

  const durationMinutes = useMemo(
    () =>
      computeBookingDurationMinutes({
        bedrooms: rooms,
        bathrooms,
        extras,
        extrasQuantities,
      }),
    [rooms, bathrooms, extras, extrasQuantities],
  );

  const jobParam = useMemo(() => {
    const payload = JSON.stringify({ extras, extras_quantities: extrasQuantities });
    return encodeURIComponent(payload);
  }, [extras, extrasQuantities]);

  useEffect(() => {
    if (!service || !date.trim() || !suburb.trim()) return;
    let cancelled = false;
    void (async () => {
      const city = BOOKING_DEFAULT_CITY;
      const qs = new URLSearchParams({
        date,
        suburb: suburb.trim(),
        city,
        bedrooms: String(rooms),
        bathrooms: String(bathrooms),
        duration_minutes: String(durationMinutes),
        job: jobParam,
      });
      try {
        const res = await fetch(`/api/cleaners/available?${qs.toString()}`, { cache: 'no-store' });
        const j = (await res.json()) as { ok?: boolean; cleaners?: Cleaner[] };
        if (!cancelled && j.ok && Array.isArray(j.cleaners)) setCleaners(j.cleaners);
      } catch {
        if (!cancelled) setCleaners([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [service, date, suburb, rooms, bathrooms, durationMinutes, jobParam]);

  const loadSlots = useCallback(async () => {
    if (!service || !date.trim() || !suburb.trim()) return;
    setSlotLoading(true);
    try {
      if (service === 'standard' || service === 'airbnb') {
        const res = await fetch('/api/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            suburb: suburb.trim(),
            city: BOOKING_DEFAULT_CITY,
            service_type: service === 'airbnb' ? 'airbnb' : 'standard',
            pricing_mode: 'premium',
            bedrooms: rooms,
            bathrooms,
            extra_rooms: 0,
            extras,
            extrasQuantities,
            has_extra_cleaner: extras.some((e) => e === 'extra_cleaner'),
          }),
        });
        const j = (await res.json()) as { ok?: boolean; slots?: Slot[] };
        if (j.ok && Array.isArray(j.slots)) setSlots(j.slots);
        else setSlots(fallbackSlots());
      } else {
        setSlots(fallbackSlots());
      }
    } catch {
      setSlots(fallbackSlots());
    } finally {
      setSlotLoading(false);
    }
  }, [service, date, suburb, rooms, bathrooms, extras, extrasQuantities]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const lockForTime = async (slotTime: string) => {
    if (!service) return;
    setLockLoading(true);
    setLockErr(null);
    clearPricingLock();
    patch({ time: slotTime });
    try {
      const res = await fetch('/api/pricing/create-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildCreateSnapshotBody({
            service,
            rooms,
            bathrooms,
            extras,
            extrasQuantities,
            date,
            suburb,
            time: slotTime,
            tipAmount,
            discountAmount,
            promoCode,
          }),
        ),
      });
      const j = (await res.json()) as {
        ok?: boolean;
        error?: string;
        pricing_snapshot_id?: string;
        pricing_hash?: string;
        pricing_lock_token?: string;
        pricing_expires_at?: string;
        pricing_version?: string;
        price_zar?: number;
        total_amount_cents?: number;
        engine_snapshot?: { result?: { finalPrice?: number; duration?: number } };
      };
      if (!res.ok || j.ok !== true || !j.pricing_snapshot_id || !j.pricing_hash || !j.pricing_lock_token) {
        setLockErr(j.error || 'Could not lock price for this time.');
        return;
      }
      const priceZar = typeof j.price_zar === 'number' && Number.isFinite(j.price_zar) ? j.price_zar : null;
      if (priceZar == null) {
        setLockErr('Invalid price from server.');
        return;
      }
      const eng = j.engine_snapshot?.result;
      const engineCents =
        typeof eng?.finalPrice === 'number' && Number.isFinite(eng.finalPrice)
          ? Math.round(eng.finalPrice * 100)
          : typeof j.total_amount_cents === 'number'
            ? j.total_amount_cents
            : Math.round(priceZar * 100);
      const hours = typeof eng?.duration === 'number' && eng.duration > 0 ? eng.duration : null;
      applyPricingLock({
        finalPrice: Math.round(priceZar),
        pricingSnapshotId: j.pricing_snapshot_id,
        pricingHash: j.pricing_hash,
        pricingLockToken: j.pricing_lock_token,
        pricingExpiresAt: j.pricing_expires_at ?? '',
        pricingVersion: j.pricing_version ?? '',
        totalAmountCents: typeof j.total_amount_cents === 'number' ? j.total_amount_cents : Math.round(priceZar * 100),
        pricingEngineFinalCents: engineCents,
        pricingTotalHours: hours,
        time: slotTime,
      });
    } catch {
      setLockErr('Network error while locking price.');
    } finally {
      setLockLoading(false);
    }
  };

  const canContinue = locked && finalPrice != null && time;

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <Link href="/booking-v2" className="text-sm font-medium text-violet-600 hover:underline">
            ← Details
          </Link>
          <h1 className="text-lg font-bold text-zinc-900">Schedule</h1>
          <span className="w-14" />
        </div>
        <BookingV2StepNav active={1} />
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Choose cleaner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cleaners.length === 0 ? (
              <p className="text-sm text-zinc-600">No cleaners listed for this area yet — you can still lock a time; we will assign the best match.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {cleaners.map((c) => {
                  const active = cleanerId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => patch({ cleanerId: c.id })}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                        active ? 'border-violet-600 bg-violet-50' : 'border-zinc-200 bg-white hover:border-zinc-300',
                      )}
                    >
                      <span className="font-semibold">{c.name}</span>
                      <span className="mt-1 block text-xs text-zinc-500">Rating {c.rating?.toFixed(1) ?? '—'}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pick a time</CardTitle>
            <p className="text-sm text-zinc-500">
              Your final total is set here and will not change on the next steps.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {slotLoading ? <p className="text-sm text-zinc-500">Loading slots…</p> : null}
            {lockErr ? <p className="text-sm font-medium text-red-600">{lockErr}</p> : null}
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => {
                const active = locked && time === slot.start;
                const disabled = lockLoading || !slot.available;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    disabled={disabled}
                    onClick={() => void lockForTime(slot.start)}
                    className={cn(
                      'min-h-[40px] rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                      active ? 'border-violet-600 bg-violet-600 text-white' : 'border-zinc-200 bg-white text-zinc-700',
                      disabled && !active ? 'opacity-40' : '',
                    )}
                  >
                    {slot.start}
                  </button>
                );
              })}
            </div>
            {locked && finalPrice != null ? (
              <p className="text-lg font-bold text-zinc-900">
                Locked total: R {Math.round(finalPrice).toLocaleString('en-ZA')}
              </p>
            ) : (
              <p className="text-sm text-zinc-500">Select a time to lock your quote.</p>
            )}
            {lockLoading ? <p className="text-sm text-violet-600">Locking price…</p> : null}

            <Button asChild className="w-full rounded-full" disabled={!canContinue}>
              <Link href="/booking-v2/review">Continue to review</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
