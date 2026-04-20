'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Filter, Lightbulb, SlidersHorizontal, Trophy } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils/formatting';

type PricingAnalyticsMetrics = {
  totalRevenue: number;
  totalBookings: number;
  avgBookingValue: number;
  avgDynamicMultiplier: number;
  avgEffectiveMultiplier: number;
  avgDemand: number;
  avgSupply: number;
};

type RevenueDayRow = {
  date: string;
  revenueCents: number;
  bookings: number;
  avgDynamicMultiplier?: number | null;
  avgEffectiveMultiplier?: number | null;
  avgDemand?: number | null;
  avgSupply?: number | null;
  unifiedBookings?: number;
};

type TrendRow = {
  date: string;
  revenue: number;
  bookings: number;
  avgDynamic: number;
  avgDemand: number;
  avgSupply: number;
};

type DemandPricePoint = { demand: number; priceZar: number };

type RiskStats = {
  unifiedBookings: number;
  bookingsWithCap: number;
  bookingsWithOverride: number;
  capRuleHits: number;
  overrideRuleHits: number;
};

type AnalyticsFiltersPayload = {
  from: string | null;
  to: string | null;
  service: string | null;
  area: string | null;
  applied: {
    created_at_gte: string | null;
    created_at_lte: string | null;
    service_type: string | null;
    address_suburb_ilike: string | null;
  };
};

type PricingAnalyticsOk = {
  ok: true;
  metrics: PricingAnalyticsMetrics;
  ruleUsage: Record<string, number>;
  insights: string[];
  riskAlerts: string[];
  revenueByDay: RevenueDayRow[];
  trend: TrendRow[];
  demandVsPrice: DemandPricePoint[];
  riskStats: RiskStats;
  filters?: AnalyticsFiltersPayload;
};

const SERVICE_ALL = 'all';

const SERVICE_OPTIONS: { value: string; label: string }[] = [
  { value: SERVICE_ALL, label: 'All services' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Deep', label: 'Deep' },
  { value: 'Airbnb', label: 'Airbnb' },
  { value: 'Move In/Out', label: 'Move In/Out' },
  { value: 'Carpet', label: 'Carpet' },
];

const TOP_RULES = 5;

function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function buildSmartInsights(m: PricingAnalyticsMetrics): string[] {
  const insights: string[] = [];
  if (m.avgDemand > 0.8) {
    insights.push('High demand detected → consider increasing base pricing');
  }
  if (m.avgSupply < 0.5) {
    insights.push('Low cleaner supply → pricing may need to increase');
  }
  if (m.avgDynamicMultiplier < 1) {
    insights.push('Frequent discounts → possible underpricing');
  }
  return insights;
}

function isAnalyticsOk(data: unknown): data is PricingAnalyticsOk {
  if (data === null || typeof data !== 'object') return false;
  const o = data as Record<string, unknown>;
  if (o.ok !== true || typeof o.metrics !== 'object' || o.metrics === null) return false;
  if (typeof o.ruleUsage !== 'object' || o.ruleUsage === null) return false;
  if (!Array.isArray(o.insights)) return false;
  if (!Array.isArray(o.riskAlerts)) return false;
  if (!Array.isArray(o.revenueByDay)) return false;
  if (!Array.isArray(o.trend)) return false;
  if (!Array.isArray(o.demandVsPrice)) return false;
  if (typeof o.riskStats !== 'object' || o.riskStats === null) return false;
  return true;
}

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number; name?: string; dataKey?: string; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="text-muted-foreground text-xs">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: p.color }} />
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
}

function TrendRevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number; payload?: TrendRow }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const v = payload[0]?.value;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">
        {typeof v === 'number'
          ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(v)
          : '—'}
      </p>
      {row ? <p className="text-xs text-muted-foreground">{row.bookings} booking{row.bookings === 1 ? '' : 's'}</p> : null}
    </div>
  );
}

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: DemandPricePoint }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground">Demand {p.demand.toFixed(2)}</p>
      <p className="font-medium">
        {new Intl.NumberFormat('en-ZA', {
          style: 'currency',
          currency: 'ZAR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(p.priceZar)}
      </p>
    </div>
  );
}

function buildQuery(params: { from: string; to: string; service: string; area: string }): string {
  const sp = new URLSearchParams();
  if (params.from) sp.set('from', params.from);
  if (params.to) sp.set('to', params.to);
  if (params.service && params.service !== SERVICE_ALL) sp.set('service', params.service);
  if (params.area.trim()) sp.set('area', params.area.trim());
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export default function PricingAnalyticsPage() {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [service, setService] = useState(SERVICE_ALL);
  const [area, setArea] = useState('');

  const [data, setData] = useState<PricingAnalyticsOk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = buildQuery({ from, to, service, area });
    try {
      const res = await fetch(`/api/admin/pricing/analytics${qs}`, { credentials: 'include', cache: 'no-store' });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          json && typeof json === 'object' && 'error' in json && typeof (json as { error: unknown }).error === 'string'
            ? (json as { error: string }).error
            : `Request failed (${res.status})`;
        setError(msg);
        setData(null);
        return;
      }
      if (!isAnalyticsOk(json)) {
        setError('Invalid response');
        setData(null);
        return;
      }
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, service, area]);

  useEffect(() => {
    void load();
  }, [load]);

  const smartInsights = useMemo(() => (data ? buildSmartInsights(data.metrics) : []), [data]);

  const topRules = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.ruleUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_RULES);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Link
          href="/admin/pricing"
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          ← Pricing admin
        </Link>
        <Alert variant="destructive">
          <AlertTitle>Could not load analytics</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const m = data.metrics;
  const rs = data.riskStats;
  const trend = data.trend ?? [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <Link
          href="/admin/pricing"
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          ← Pricing admin
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">Pricing analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Filter bookings, then review revenue, multipliers, demand vs price, and rule usage (V5.2{' '}
          <code className="text-xs">price_snapshot</code>).
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden />
            <CardTitle className="text-base">Filters</CardTitle>
          </div>
          <CardDescription>Date range, service, and area (suburb) narrow all metrics and charts.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="analytics-from">From</Label>
            <Input id="analytics-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="analytics-to">To</Label>
            <Input id="analytics-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Service</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All services" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="analytics-area">Area (suburb)</Label>
            <Input
              id="analytics-area"
              type="text"
              placeholder="e.g. Bantry Bay"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              autoComplete="off"
            />
          </div>
        </CardContent>
        {loading ? (
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" aria-hidden />
              Updating…
            </p>
          </CardContent>
        ) : null}
      </Card>

      {/* Smart insights */}
      {smartInsights.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" aria-hidden />
              <CardTitle className="text-base">Smart insights</CardTitle>
            </div>
            <CardDescription>Heuristics from averages in the current filter window</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {smartInsights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data.riskAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Risk alerts</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {data.riskAlerts.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total revenue</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatCurrency(m.totalRevenue, true)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Scoped by filters · <code className="text-[10px]">total_amount</code></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bookings</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{m.totalBookings}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg booking value</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCurrency(Math.round(m.avgBookingValue * 100), true)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Revenue trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue over time</CardTitle>
          <CardDescription>Daily revenue (ZAR) from <code className="text-xs">trend</code></CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] pt-0">
          {trend.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No bookings in this range.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickMargin={8} minTickGap={20} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat('en-ZA', { notation: 'compact', maximumFractionDigits: 1 }).format(v)
                  }
                />
                <Tooltip content={<TrendRevenueTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue (ZAR)" stroke="#8884d8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Multiplier / demand / supply trends */}
      <Card>
        <CardHeader>
          <CardTitle>Multiplier trends</CardTitle>
          <CardDescription>Daily averages from snapshots (per day, among bookings with V5.2 unified data)</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] pt-0">
          {trend.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No trend rows.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickMargin={8} minTickGap={20} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip content={<RevenueTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="avgDynamic" name="Avg dynamic ×" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="avgDemand" name="Avg demand" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="avgSupply" name="Avg supply" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Demand vs supply snapshot — single chart comparing latest averages is optional; user asked demand vs supply — the line chart above covers time series */}
      <Card>
        <CardHeader>
          <CardTitle>Demand vs price</CardTitle>
          <CardDescription>Scatter: demand score vs quoted price per filtered booking (capped sample)</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] pt-0">
          {data.demandVsPrice.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No demand snapshots in range.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  dataKey="demand"
                  name="Demand"
                  tick={{ fontSize: 11 }}
                  domain={['dataMin - 0.05', 'dataMax + 0.05']}
                />
                <YAxis
                  type="number"
                  dataKey="priceZar"
                  name="Price"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat('en-ZA', { notation: 'compact', maximumFractionDigits: 0 }).format(v)
                  }
                />
                <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Bookings" data={data.demandVsPrice} fill="hsl(var(--primary))" fillOpacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-medium mb-3">Dynamic layer (overall averages)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg dynamic ×</CardDescription>
              <CardTitle className="text-xl tabular-nums">{m.avgDynamicMultiplier.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg effective ×</CardDescription>
              <CardTitle className="text-xl tabular-nums">{m.avgEffectiveMultiplier.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg demand</CardDescription>
              <CardTitle className="text-xl tabular-nums">{m.avgDemand.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg supply</CardDescription>
              <CardTitle className="text-xl tabular-nums">{m.avgSupply.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" aria-hidden />
            <CardTitle>Top rules</CardTitle>
          </div>
          <CardDescription>
            Top {TOP_RULES} by <code className="text-xs">ruleUsage</code> count
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topRules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rule traces in snapshots for this filter.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {topRules.map(([id, count], idx) => (
                <li key={id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <span className="flex items-center gap-3 min-w-0">
                    <Badge variant={idx < 3 ? 'default' : 'secondary'} className="tabular-nums shrink-0">
                      #{idx + 1}
                    </Badge>
                    <span className="font-mono text-xs break-all">{id}</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground shrink-0">{count} uses</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Caps &amp; overrides</CardTitle>
          <CardDescription>From <code className="text-xs">admin_rule_applied[].type</code></CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>
            Unified snapshots: <span className="font-medium text-foreground">{rs.unifiedBookings}</span>
          </p>
          <p>
            Bookings with a cap rule: <span className="font-medium text-foreground">{rs.bookingsWithCap}</span> · rule hits:{' '}
            <span className="font-medium text-foreground">{rs.capRuleHits}</span>
          </p>
          <p>
            Bookings with an override: <span className="font-medium text-foreground">{rs.bookingsWithOverride}</span> ·
            rule hits: <span className="font-medium text-foreground">{rs.overrideRuleHits}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
