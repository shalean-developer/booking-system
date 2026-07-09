'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookingV2StepNav } from '@/components/booking-v2/step-nav';
import { useBookingStore } from '@/shared/booking-v2/useBookingStore';
import { bookingV2ServiceToApi } from '@/shared/booking-v2/service-map';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BookingV2ReviewPage() {
  const router = useRouter();
  const locked = useBookingStore((s) => s.locked);
  const finalPrice = useBookingStore((s) => s.finalPrice);
  const service = useBookingStore((s) => s.service);
  const date = useBookingStore((s) => s.date);
  const time = useBookingStore((s) => s.time);
  const rooms = useBookingStore((s) => s.rooms);
  const bathrooms = useBookingStore((s) => s.bathrooms);
  const suburb = useBookingStore((s) => s.suburb);
  const customerName = useBookingStore((s) => s.customerName);
  const customerEmail = useBookingStore((s) => s.customerEmail);
  const customerPhone = useBookingStore((s) => s.customerPhone);
  const addressLine1 = useBookingStore((s) => s.addressLine1);
  const addressCity = useBookingStore((s) => s.addressCity);
  const notes = useBookingStore((s) => s.notes);
  const patch = useBookingStore((s) => s.patch);

  useEffect(() => {
    if (!locked || finalPrice == null) router.replace('/booking-v2/cleaner');
  }, [locked, finalPrice, router]);

  const serviceLabel = service ? bookingV2ServiceToApi(service) : '—';

  const canPay =
    customerName.trim().length > 1 &&
    customerEmail.includes('@') &&
    customerPhone.trim().length >= 8 &&
    addressLine1.trim().length > 2;

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <Link href="/booking-v2/cleaner" className="text-sm font-medium text-violet-600 hover:underline">
            ← Schedule
          </Link>
          <h1 className="text-lg font-bold text-zinc-900">Review</h1>
          <span className="w-14" />
        </div>
        <BookingV2StepNav active={2} />
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Booking summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Service" value={serviceLabel} />
            <Row label="When" value={`${date} at ${time}`} />
            <Row label="Home" value={`${rooms} bed · ${bathrooms} bath · ${suburb || '—'}`} />
            <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Total (locked)</p>
              <p className="text-2xl font-bold text-violet-900">
                R {finalPrice != null ? Math.round(finalPrice).toLocaleString('en-ZA') : '—'}
              </p>
              <p className="mt-1 text-xs text-violet-800/80">This amount was fixed when you chose your time.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={customerName} onChange={(e) => patch({ customerName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={customerEmail}
                onChange={(e) => patch({ customerEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={customerPhone} onChange={(e) => patch({ customerPhone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line1">Street address</Label>
              <Input id="line1" value={addressLine1} onChange={(e) => patch({ addressLine1: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={addressCity} onChange={(e) => patch({ addressCity: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes for the team</Label>
              <Input id="notes" value={notes} onChange={(e) => patch({ notes: e.target.value })} />
            </div>

            <Button asChild className="w-full rounded-full" disabled={!canPay}>
              <Link href="/booking-v2/payment">Continue to payment</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-zinc-100 py-2 last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-medium text-zinc-900">{value}</span>
    </div>
  );
}
