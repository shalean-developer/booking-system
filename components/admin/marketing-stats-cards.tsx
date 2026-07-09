'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Stats = {
  emailDelivered: number;
  opened: number;
  clicked: number;
  whatsappSent: number;
  openRatePct: number;
  clickRatePct: number;
};

export function MarketingStatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/marketing/stats');
        const data = (await res.json()) as { ok?: boolean; stats?: Stats; error?: string };
        if (!res.ok || !data.ok || !data.stats) {
          setError(data.error || 'Failed to load stats');
          return;
        }
        if (!cancelled) setStats(data.stats);
      } catch {
        if (!cancelled) setError('Network error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="text-sm text-muted-foreground">{error}</p>;
  }
  if (!stats) {
    return <p className="text-sm text-muted-foreground">Loading analytics…</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Sent (email)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">{stats.emailDelivered}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Opened</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">{stats.opened}</p>
          <p className="text-xs text-muted-foreground mt-1">Open rate: {stats.openRatePct}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Clicked</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">{stats.clicked}</p>
          <p className="text-xs text-muted-foreground mt-1">Click rate: {stats.clickRatePct}%</p>
        </CardContent>
      </Card>
      <Card className="sm:col-span-2 lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">WhatsApp sent</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">{stats.whatsappSent}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Users with <code className="text-xs">prefers_whatsapp</code> receive WhatsApp instead of email when
            Twilio is configured.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
