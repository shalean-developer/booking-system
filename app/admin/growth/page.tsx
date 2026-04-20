'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Loader2 } from 'lucide-react';

type Metrics = {
  pageViews: number;
  bookingStarted: number;
  bookingCompleted: number;
  seoPageViews: number;
  referralClicks: number;
  bookingConversionRate: number | null;
  funnelBookingStartRate: number | null;
  referralClickThroughRate: number | null;
  adSpendZar30d: number;
  estimatedCacZar: number | null;
};

export default function AdminGrowthPage() {
  const [data, setData] = useState<{
    metrics: Metrics | null;
    note?: string;
    rangeDays: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/admin/growth/metrics');
        const json = (await res.json()) as {
          ok?: boolean;
          metrics?: Metrics | null;
          note?: string;
          rangeDays?: number;
        };
        if (!cancelled && json.ok) {
          setData({
            metrics: json.metrics ?? null,
            note: json.note,
            rangeDays: json.rangeDays ?? 30,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const m = data?.metrics;

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to admin
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Growth</h1>
            <p className="text-sm text-zinc-500">
              Funnel events (last {data?.rangeDays ?? 30} days) · Set{' '}
              <code className="rounded bg-zinc-200/80 px-1 text-xs">GROWTH_AD_SPEND_ZAR_30D</code> for CAC
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : data?.note ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{data.note}</p>
        ) : m ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard label="Page views" value={m.pageViews} hint="SPA routes (consent-gated pixels)" />
            <MetricCard label="Booking started" value={m.bookingStarted} />
            <MetricCard label="Booking completed (events)" value={m.bookingCompleted} hint="Logged on confirmation" />
            <MetricCard label="SEO landings" value={m.seoPageViews} hint="Programmatic local pages" />
            <MetricCard label="Referral clicks" value={m.referralClicks} hint="/signup?ref=…" />
            <MetricCard
              label="Est. CAC (ZAR)"
              value={m.estimatedCacZar != null ? `R${m.estimatedCacZar.toFixed(2)}` : '—'}
              hint={`Ad spend R${m.adSpendZar30d} / completions`}
            />
            <MetricCard
              label="Conversion (complete / views)"
              value={m.bookingConversionRate != null ? `${(m.bookingConversionRate * 100).toFixed(2)}%` : '—'}
            />
            <MetricCard
              label="Funnel start rate"
              value={m.funnelBookingStartRate != null ? `${(m.funnelBookingStartRate * 100).toFixed(2)}%` : '—'}
            />
          </div>
        ) : (
          <p className="text-zinc-500">No data.</p>
        )}

        <p className="mt-10 text-xs text-zinc-400">
          Google Ads / Meta: use GA4 (<code>NEXT_PUBLIC_GA4_MEASUREMENT_ID</code>) and{' '}
          <code>NEXT_PUBLIC_META_PIXEL_ID</code> after cookie consent. Import conversions from GA4 into Google Ads for
          bidding.
        </p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}
