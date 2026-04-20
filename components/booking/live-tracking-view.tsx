'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { TrackingStatus } from '@/lib/tracking-status';
import { Loader2, MapPin, Navigation } from 'lucide-react';

type TrackingPayload = {
  ok: boolean;
  status: TrackingStatus | null;
  cleaner: { id: string; name: string; phone: string | null } | null;
  location: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  eta_minutes: number | null;
  eta_time: string | null;
  error?: string;
};

function headlineForStatus(status: TrackingStatus | null): string {
  switch (status) {
    case 'en_route':
      return 'Cleaner is on the way';
    case 'arrived':
      return 'Cleaner has arrived';
    case 'cleaning':
      return 'Cleaning in progress';
    case 'completed':
      return 'Job completed';
    case 'assigned':
      return 'Cleaner assigned';
    default:
      return 'Waiting for cleaner assignment';
  }
}

function formatEta(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function LiveTrackingView({ bookingId }: { bookingId: string }) {
  const [data, setData] = useState<TrackingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [realtimeOk, setRealtimeOk] = useState(true);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const ct =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('ct')
          : null;
      const q = ct ? `?ct=${encodeURIComponent(ct)}` : '';
      const res = await fetch(`/api/bookings/${bookingId}/tracking${q}`, {
        headers,
        cache: 'no-store',
      });
      const json = (await res.json()) as TrackingPayload & { error?: string };
      if (!res.ok || !json.ok) {
        setErr(json.error || 'Could not load tracking');
        setData(null);
        return;
      }
      setErr(null);
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
    const poll = window.setInterval(load, 22000);
    return () => window.clearInterval(poll);
  }, [load]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`booking:${bookingId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'bookings',
            filter: `id=eq.${bookingId}`,
          },
          () => {
            setRealtimeOk(true);
            load();
          }
        )
        .subscribe((status: string) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setRealtimeOk(false);
          }
        });
    } catch {
      setRealtimeOk(false);
    }
    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {
        /* ignore */
      }
    };
  }, [bookingId, load]);

  const mapCenter = data?.location ?? data?.destination ?? null;

  const mapSrc =
    mapCenter &&
    typeof mapCenter.lat === 'number' &&
    typeof mapCenter.lng === 'number' &&
    Number.isFinite(mapCenter.lat) &&
    Number.isFinite(mapCenter.lng)
      ? `https://www.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=14&output=embed`
      : null;

  const dirHref =
    data?.destination &&
    typeof data.destination.lat === 'number' &&
    typeof data.destination.lng === 'number'
      ? `https://www.google.com/maps/dir/?api=1&destination=${data.destination.lat},${data.destination.lng}`
      : null;

  if (loading && !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2 text-gray-600">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Loading live tracking…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <p className="text-red-600 font-medium">{err}</p>
        <p className="text-sm text-gray-500 mt-2">
          Open this page from your confirmation link, or sign in to your account.
        </p>
      </div>
    );
  }

  const status = data?.status ?? null;
  const title = headlineForStatus(status);
  const sub =
    status === 'en_route' && data?.eta_minutes != null ? (
      <p className="text-lg text-gray-800 mt-1">
        Arriving in <span className="font-semibold">{data.eta_minutes}</span> minutes
        {data.eta_time ? (
          <span className="text-gray-500 text-base block sm:inline sm:ml-2">
            (around {formatEta(data.eta_time)})
          </span>
        ) : null}
      </p>
    ) : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {sub}
        {data?.cleaner && (
          <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">
            <span className="font-medium text-gray-800">{data.cleaner.name}</span>
            {data.cleaner.phone && (
              <a href={`tel:${data.cleaner.phone}`} className="text-primary hover:underline">
                {data.cleaner.phone}
              </a>
            )}
          </p>
        )}
        {!realtimeOk && (
          <p className="text-xs text-amber-700 mt-2">Live updates unavailable — refreshing periodically.</p>
        )}
      </div>

      {mapSrc ? (
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100 aspect-[4/3]">
          <iframe
            title="Cleaner location map"
            className="w-full h-full min-h-[240px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapSrc}
            allowFullScreen
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500 text-sm">
          <MapPin className="h-10 w-10 mx-auto mb-2 text-gray-400" aria-hidden />
          Map will appear when the cleaner shares their location.
        </div>
      )}

      {dirHref && (
        <a
          href={dirHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
        >
          <Navigation className="h-4 w-4" aria-hidden />
          Open in Google Maps
        </a>
      )}
    </div>
  );
}
