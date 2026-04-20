'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import {
  enqueueCleanerStatusUpdate,
  flushCleanerStatusQueue,
  getQueuedCleanerStatusUpdates,
} from '@/lib/cleaner-offline-queue';

type BookingRow = {
  id: string;
  status: string;
  customer_name?: string | null;
  address_line1?: string | null;
  address_suburb?: string | null;
  address_city?: string | null;
  service_type?: string | null;
  booking_date?: string | null;
  booking_time?: string | null;
  expected_end_time?: string | null;
  duration_minutes?: number | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function formatTimeRange(b: BookingRow): string {
  const start = (b.booking_time || '').toString().slice(0, 5);
  const end = (b.expected_end_time || '').toString().slice(0, 5);
  if (start && end) return `${start}–${end}`;
  if (start) return start;
  return '—';
}

function buildAddress(b: BookingRow): string {
  return [b.address_line1, b.address_suburb, b.address_city].filter(Boolean).join(', ') || '—';
}

function mapsSearchUrl(address: string, lat?: number | null, lng?: number | null): string {
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function JobDetailClient({
  bookingId,
  cleanerId,
}: {
  bookingId: string;
  cleanerId: string;
}) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [queuedN, setQueuedN] = useState(0);

  const refreshQueueCount = useCallback(() => {
    setQueuedN(getQueuedCleanerStatusUpdates().length);
  }, []);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/cleaner/jobs/${bookingId}`, { credentials: 'include' });
      const data = await res.json();
      if (res.status === 403) {
        setLoadError('This job is not assigned to you.');
        setBooking(null);
        return;
      }
      if (!data.ok || !data.booking) {
        setLoadError(data.error || 'Could not load job');
        setBooking(null);
        return;
      }
      setBooking(data.booking as BookingRow);
    } catch {
      setLoadError('Network error');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  const patchStatusInner = useCallback(
    async (id: string, status: string) => {
      const res = await fetch(`/api/cleaner/jobs/${id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Update failed');
    },
    [],
  );

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  useEffect(() => {
    void flushCleanerStatusQueue(patchStatusInner).then(() => {
      refreshQueueCount();
    });
  }, [patchStatusInner, refreshQueueCount]);

  useEffect(() => {
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const up = () => {
      setOnline(true);
      void flushCleanerStatusQueue(patchStatusInner).then(() => {
        refreshQueueCount();
        void loadBooking();
      });
    };
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, [refreshQueueCount, loadBooking, patchStatusInner]);

  const runPatchStatus = useCallback(
    async (status: string) => {
      try {
        await patchStatusInner(bookingId, status);
      } catch (e) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          enqueueCleanerStatusUpdate(bookingId, status);
          refreshQueueCount();
          throw e;
        }
        throw e;
      }
    },
    [bookingId, patchStatusInner, refreshQueueCount],
  );

  const acceptFlow = useCallback(async () => {
    setActionBusy(true);
    try {
      const st = booking?.status ?? '';
      if (['pending', 'paid', 'assigned'].includes(st)) {
        await runPatchStatus('accepted');
      } else {
        const res = await fetch(`/api/cleaner/bookings/${bookingId}/claim`, {
          method: 'POST',
          credentials: 'include',
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Claim failed');
      }
      await loadBooking();
    } finally {
      setActionBusy(false);
    }
  }, [booking?.status, bookingId, loadBooking, runPatchStatus]);

  const onAction = useCallback(
    async (status: string) => {
      setActionBusy(true);
      try {
        await runPatchStatus(status);
        await loadBooking();
      } catch (e) {
        console.error(e);
      } finally {
        setActionBusy(false);
      }
    },
    [loadBooking, runPatchStatus],
  );

  const dbStatus = booking?.status ?? '';

  const trackingActive = useMemo(() => {
    return ['on_my_way', 'arrived', 'in-progress'].includes(dbStatus);
  }, [dbStatus]);

  useEffect(() => {
    if (!trackingActive || !cleanerId) return;

    let cancelled = false;
    const send = () => {
      if (cancelled || typeof navigator === 'undefined' || !navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        pos => {
          if (cancelled) return;
          void fetch('/api/cleaners/location', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cleaner_id: cleanerId,
              booking_id: bookingId,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              timestamp: new Date().toISOString(),
            }),
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 12_000 },
      );
    };

    send();
    const t = window.setInterval(send, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [trackingActive, cleanerId, bookingId]);

  const address = booking ? buildAddress(booking) : '';
  const lat = booking?.latitude ?? null;
  const lng = booking?.longitude ?? null;
  const osmEmbed =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012}%2C${lat - 0.008}%2C${lng + 0.012}%2C${lat + 0.008}&layer=mapnik&marker=${lat}%2C${lng}`
      : null;

  if (loading && !booking) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm font-medium text-slate-500">Loading job…</p>
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <p className="text-slate-800 font-semibold">{loadError || 'Job not found'}</p>
        <Link href="/cleaner/dashboard" className="mt-4 inline-block text-sm text-blue-600 font-bold">
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-28 pt-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        {!online ? (
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
            Offline
          </span>
        ) : null}
        {queuedN > 0 ? (
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
            {queuedN} queued
          </span>
        ) : null}
      </div>

      <h1 className="text-xl font-extrabold text-slate-900 mb-1">{booking.service_type || 'Cleaning'}</h1>
      <p className="text-sm text-slate-500 mb-6">
        {formatTimeRange(booking)} · {booking.duration_minutes ? `${booking.duration_minutes} min` : '—'}
      </p>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 mb-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Customer</p>
        <p className="text-lg font-bold text-slate-900">{booking.customer_name || 'Client'}</p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 mb-4">
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Address</p>
            <p className="text-base font-medium text-slate-800 leading-snug">{address}</p>
          </div>
        </div>
        <a
          href={mapsSearchUrl(address, lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-slate-900 text-white text-base font-bold"
        >
          <Navigation className="w-5 h-5" />
          Open in Google Maps
        </a>
      </div>

      {osmEmbed ? (
        <div className="rounded-2xl overflow-hidden border border-slate-200 mb-4 aspect-[16/9] bg-slate-100">
          <iframe title="Map preview" src={osmEmbed} className="w-full h-full border-0" loading="lazy" />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 mb-4">
          Map preview unavailable (no coordinates on file). Use Google Maps above.
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 mb-6">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Notes</p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{booking.notes?.trim() || '—'}</p>
      </div>

      <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 mb-8">
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">Notifications</p>
        <p className="text-sm text-indigo-900 leading-relaxed">
          You will get alerts for new assignments, high demand in your area, and reminders when notification
          settings are enabled in Profile.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-50/95 border-t border-slate-200 backdrop-blur-sm max-w-lg mx-auto">
        <div className="flex flex-col gap-3">
          {['pending', 'paid', 'assigned'].includes(dbStatus) ? (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void acceptFlow()}
              className="w-full py-4 rounded-2xl bg-blue-600 text-white text-base font-extrabold disabled:opacity-60"
            >
              {actionBusy ? '…' : 'Accept Job'}
            </button>
          ) : null}

          {dbStatus === 'accepted' || dbStatus === 'confirmed' ? (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void onAction('on_my_way')}
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-base font-extrabold disabled:opacity-60"
            >
              {actionBusy ? '…' : 'Start Trip'}
            </button>
          ) : null}

          {dbStatus === 'on_my_way' ? (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void onAction('arrived')}
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-base font-extrabold disabled:opacity-60"
            >
              {actionBusy ? '…' : 'Mark Arrived'}
            </button>
          ) : null}

          {dbStatus === 'arrived' ? (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void onAction('in-progress')}
              className="w-full py-4 rounded-2xl bg-blue-600 text-white text-base font-extrabold disabled:opacity-60"
            >
              {actionBusy ? '…' : 'Start Cleaning'}
            </button>
          ) : null}

          {dbStatus === 'in-progress' ? (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void onAction('completed')}
              className="w-full py-4 rounded-2xl bg-emerald-600 text-white text-base font-extrabold disabled:opacity-60"
            >
              {actionBusy ? '…' : 'Complete Job'}
            </button>
          ) : null}

          {dbStatus === 'completed' ? (
            <p className="text-center text-sm font-bold text-emerald-700 py-2">Job completed</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
