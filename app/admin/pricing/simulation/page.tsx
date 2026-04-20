'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';
import type { ServiceType } from '@/types/booking';
import type { PricingMode } from '@/lib/pricing-mode';
import type { FinalPriceBreakdown } from '@/lib/pricing/final-pricing';
import { cn } from '@/lib/utils';

type SimulateForm = {
  date: string;
  time: string;
  area: string;
  service: ServiceType;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  numberOfCleaners: number;
  pricingMode: PricingMode;
  promo_code: string;
  customerEmail: string;
  use_points: string;
};

const SERVICE_OPTIONS: ServiceType[] = [
  'Standard',
  'Deep',
  'Move In/Out',
  'Airbnb',
  'Carpet',
];

const DEFAULT_CARPET = {
  hasFittedCarpets: true,
  hasLooseCarpets: false,
  numberOfRooms: 2,
  numberOfLooseCarpets: 0,
  roomStatus: 'empty' as const,
};

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type SimulateSuccess = {
  ok: true;
  price_zar: number;
  total_amount_cents: number;
  breakdown: FinalPriceBreakdown;
};

export default function PricingSimulationPage() {
  const [form, setForm] = useState<SimulateForm>({
    date: todayIsoDate(),
    time: '10:00',
    area: 'Sandton',
    service: 'Standard',
    bedrooms: 2,
    bathrooms: 2,
    extraRooms: 0,
    numberOfCleaners: 1,
    pricingMode: 'premium',
    promo_code: '',
    customerEmail: '',
    use_points: '',
  });

  const [result, setResult] = useState<SimulateSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const payload = useMemo(() => {
    const usePts = form.use_points.trim() === '' ? undefined : Math.max(0, Math.floor(Number(form.use_points)));
    return {
      service: form.service,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      extraRooms: form.extraRooms,
      extras: [] as string[],
      extrasQuantities: {} as Record<string, number>,
      frequency: 'one-time' as const,
      tipAmount: 0,
      discountAmount: 0,
      numberOfCleaners: form.numberOfCleaners,
      provideEquipment: false,
      pricingMode: form.pricingMode,
      date: form.date.trim(),
      time: form.time.trim() || '10:00',
      address: {
        suburb: form.area.trim() || 'Sandton',
        city: BOOKING_DEFAULT_CITY,
      },
      ...(form.promo_code.trim()
        ? { promo_code: form.promo_code.trim().toUpperCase() }
        : {}),
      ...(form.customerEmail.trim() ? { customerEmail: form.customerEmail.trim() } : {}),
      ...(usePts !== undefined && !Number.isNaN(usePts) ? { use_points: usePts } : {}),
      ...(form.service === 'Carpet' ? { carpetDetails: DEFAULT_CARPET } : {}),
      isSimulation: true,
    };
  }, [form]);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/pricing/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as SimulateSuccess & { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || `Request failed (${res.status})`);
        return;
      }
      setResult(data as SimulateSuccess);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const unified = result?.breakdown.unified;
  const adjustments = result?.breakdown.adjustments;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <Link
          href="/admin/pricing"
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          ← Pricing admin
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">Pricing simulation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Run authoritative server pricing for a scenario — no booking is created.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scenario</CardTitle>
          <CardDescription>Date, time, and area drive surge and dynamic rules for Standard &amp; Airbnb.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sim-date">Date (YYYY-MM-DD)</Label>
              <Input
                id="sim-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sim-time">Time (HH:mm)</Label>
              <Input
                id="sim-time"
                placeholder="10:00"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sim-area">Area (suburb)</Label>
            <Input
              id="sim-area"
              placeholder="Suburb for surge / dynamic pricing"
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Service</Label>
              <Select
                value={form.service}
                onValueChange={(v) => setForm((f) => ({ ...f, service: v as ServiceType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pricing mode</Label>
              <Select
                value={form.pricingMode}
                onValueChange={(v) => setForm((f) => ({ ...f, pricingMode: v as PricingMode }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium (engine)</SelectItem>
                  <SelectItem value="basic">Quick Clean (basic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(
              [
                ['bedrooms', 'Bedrooms', form.bedrooms],
                ['bathrooms', 'Bathrooms', form.bathrooms],
                ['extraRooms', 'Extra rooms', form.extraRooms],
                ['numberOfCleaners', 'Cleaners', form.numberOfCleaners],
              ] as const
            ).map(([key, label, val]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`sim-${key}`}>{label}</Label>
                <Input
                  id={`sim-${key}`}
                  type="number"
                  min={0}
                  value={val}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      [key]: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
            <div className="space-y-2">
              <Label htmlFor="sim-promo">Promo code (optional)</Label>
              <Input
                id="sim-promo"
                placeholder="e.g. SAVE20"
                value={form.promo_code}
                onChange={(e) => setForm((f) => ({ ...f, promo_code: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sim-email">Customer email (optional)</Label>
              <Input
                id="sim-email"
                type="email"
                placeholder="For promo / loyalty context"
                value={form.customerEmail}
                onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sim-points">Use points (optional)</Label>
              <Input
                id="sim-points"
                type="number"
                min={0}
                placeholder="0"
                value={form.use_points}
                onChange={(e) => setForm((f) => ({ ...f, use_points: e.target.value }))}
              />
            </div>
          </div>

          <Button type="button" onClick={runSimulation} disabled={loading || !form.date.trim()} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running…
              </>
            ) : (
              'Run simulation'
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50/80">
          <CardHeader>
            <CardTitle className="text-red-800 text-base">Simulation failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>Server breakdown from <code className="text-xs">computeAuthoritativeBookingPricing</code></CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-6 items-baseline">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Price (ZAR)</p>
                <p className="text-3xl font-bold tabular-nums">R {result.price_zar.toLocaleString('en-ZA')}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total (cents)</p>
                <p className="text-lg font-semibold tabular-nums">{result.total_amount_cents}</p>
              </div>
            </div>

            {unified ? (
              <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
                <p className="text-sm font-semibold">Unified pipeline (Standard / Airbnb)</p>

                <div className="space-y-1 text-sm">
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Demand &amp; supply</p>
                  <p>
                    <span className="text-muted-foreground">Demand:</span>{' '}
                    <span className="font-mono tabular-nums">{unified.demand_score}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Supply:</span>{' '}
                    <span className="font-mono tabular-nums">{unified.supply_score}</span>
                  </p>
                </div>

                <div className="space-y-1 text-sm pt-1 border-t border-gray-200/80">
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Multiplier breakdown</p>
                  <p>
                    <span className="text-muted-foreground">Base Dynamic:</span>{' '}
                    <span className="font-mono tabular-nums">{unified.base_dynamic_multiplier}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Final Multiplier:</span>{' '}
                    <span className="font-mono tabular-nums">{unified.dynamic_multiplier}</span>
                  </p>
                  {unified.effective_multiplier != null && (
                    <p>
                      <span className="text-muted-foreground">Effective:</span>{' '}
                      <span className="font-mono tabular-nums">{unified.effective_multiplier}</span>
                    </p>
                  )}
                  {unified.multiplier_delta != null && (
                    <p>
                      <span className="text-muted-foreground">Delta:</span>{' '}
                      <span className="font-mono tabular-nums">{unified.multiplier_delta}</span>
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-200/80">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Rules applied</p>
                  {unified.admin_rule_applied?.length ? (
                    <ul className="text-sm space-y-1">
                      {unified.admin_rule_applied.map((r) => (
                        <li key={`${r.id}-${r.order}`} className="flex gap-2">
                          <span className="text-muted-foreground w-6">{r.order}.</span>
                          <span className="font-mono text-xs">{r.id}</span>
                          <span className="text-muted-foreground">{r.type ?? '—'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No admin dynamic rules in trace.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground rounded-lg border bg-muted/30 p-4">
                Unified surge/dynamic slice is only populated for <strong>Standard</strong> and <strong>Airbnb</strong> with date/time/area.
                Other services use the cart breakdown below.
              </p>
            )}

            {adjustments && (
              <div className="space-y-1 text-sm rounded-lg border bg-muted/30 p-4">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-2">Admin price caps</p>
                <p>
                  <span className="text-muted-foreground">Min Clamp:</span>{' '}
                  <span className="font-mono tabular-nums">R {adjustments.admin_min_clamp_zar.toLocaleString('en-ZA')}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Max Clamp:</span>{' '}
                  <span className="font-mono tabular-nums">R {adjustments.admin_max_clamp_zar.toLocaleString('en-ZA')}</span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-semibold">Cart total</p>
              <p className="text-lg tabular-nums">
                R {result.breakdown.cart.total.toLocaleString('en-ZA')}{' '}
                <span className="text-muted-foreground text-sm">
                  (subtotal {result.breakdown.cart.subtotal.toLocaleString('en-ZA')})
                </span>
              </p>
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-muted-foreground">Raw breakdown (JSON)</summary>
              <pre
                className={cn(
                  'mt-2 max-h-80 overflow-auto rounded-md border bg-muted/50 p-3 text-[11px] leading-relaxed',
                )}
              >
                {JSON.stringify(result.breakdown, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
