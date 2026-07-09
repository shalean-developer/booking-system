'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookingV2StepNav } from '@/components/booking-v2/step-nav';
import { useBookingStore } from '@/shared/booking-v2/useBookingStore';
import { buildPendingBookingBody } from '@/shared/booking-v2/pending-payload';
import { bookingV2ServiceToApi } from '@/shared/booking-v2/service-map';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BookingV2PaymentPage() {
  const router = useRouter();
  const locked = useBookingStore((s) => s.locked);
  const finalPrice = useBookingStore((s) => s.finalPrice);
  const service = useBookingStore((s) => s.service);
  const customerEmail = useBookingStore((s) => s.customerEmail);

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!locked || finalPrice == null) router.replace('/booking-v2/cleaner');
  }, [locked, finalPrice, router]);

  useEffect(() => {
    if (!customerEmail.includes('@')) router.replace('/booking-v2/review');
  }, [customerEmail, router]);

  const runCheckout = useCallback(async () => {
    const s = useBookingStore.getState();
    if (!s.service || !s.pricingSnapshotId || !s.pricingHash || !s.pricingLockToken || s.finalPrice == null) {
      setErr('Missing booking or pricing lock.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const body = buildPendingBookingBody({
        service: s.service,
        rooms: s.rooms,
        bathrooms: s.bathrooms,
        extras: s.extras,
        extrasQuantities: s.extrasQuantities,
        date: s.date,
        time: s.time,
        suburb: s.suburb,
        finalPrice: s.finalPrice,
        pricingSnapshotId: s.pricingSnapshotId,
        pricingHash: s.pricingHash,
        pricingLockToken: s.pricingLockToken,
        pricingExpiresAt: s.pricingExpiresAt ?? '',
        pricingVersion: s.pricingVersion ?? '',
        pricingEngineFinalCents: s.pricingEngineFinalCents,
        pricingTotalHours: s.pricingTotalHours,
        pricingTeamSize: s.pricingTeamSize,
        cleanerId: s.cleanerId,
        customerName: s.customerName,
        customerEmail: s.customerEmail,
        customerPhone: s.customerPhone,
        addressLine1: s.addressLine1,
        addressCity: s.addressCity,
        tipAmount: s.tipAmount,
        discountAmount: s.discountAmount,
        promoCode: s.promoCode,
        notes: s.notes,
      });

      const idempotency_key = [s.customerEmail.trim().toLowerCase(), s.service, s.date, s.time].join('|');
      const pendingRes = await fetch('/api/bookings/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(body as unknown as Record<string, unknown>), idempotency_key }),
      });
      const pendingJson = (await pendingRes.json()) as {
        ok?: boolean;
        error?: string;
        bookingId?: string;
        message?: string;
        code?: string;
      };
      if (!pendingRes.ok || !pendingJson.ok || !pendingJson.bookingId) {
        setErr(pendingJson.error || pendingJson.message || 'Could not create booking.');
        return;
      }
      const bookingId = pendingJson.bookingId;

      const initRes = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      const initData = (await initRes.json()) as { ok?: boolean; authorization_url?: string; reference?: string; error?: string };
      if (!initRes.ok || !initData.authorization_url) {
        setErr(initData.error || 'Could not start payment.');
        return;
      }
      try {
        if (initData.reference) localStorage.setItem('paystack_last_reference', initData.reference);
        localStorage.setItem('paystack_last_booking_id', bookingId);
      } catch {
        /* ignore */
      }
      window.location.href = initData.authorization_url;
    } catch {
      setErr('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }, []);

  const title = service ? bookingV2ServiceToApi(service) : 'Booking';

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <Link href="/booking-v2/review" className="text-sm font-medium text-violet-600 hover:underline">
            ← Review
          </Link>
          <h1 className="text-lg font-bold text-zinc-900">Pay</h1>
          <span className="w-14" />
        </div>
        <BookingV2StepNav active={3} />
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-2xl font-bold text-zinc-900">
              R {finalPrice != null ? Math.round(finalPrice).toLocaleString('en-ZA') : '—'}
            </p>
            <p className="text-sm text-zinc-600">
              You will be redirected to our secure payment provider. The total matches your locked quote from the
              previous step — it is not recalculated here.
            </p>
            {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
            <Button type="button" className="w-full rounded-full" disabled={busy} onClick={() => void runCheckout()}>
              {busy ? 'Starting…' : 'Pay securely'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
