import { useEffect, useRef, useState } from 'react';
import type { BookingCarpetDetails, ServiceType } from '@/types/booking';

const DEBOUNCE_MS = 400;
const MAX_CACHE_ENTRIES = 64;

const cache = new Map<string, InstantPricingResult>();

function cacheSet(key: string, value: InstantPricingResult) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, value);
}

export type InstantPricingInput = {
  service: ServiceType;
  date: string;
  time: string;
  bedrooms: number;
  bathrooms: number;
  extraRooms?: number;
  extras: string[];
  extrasQuantities?: Record<string, number>;
  pricingMode?: 'basic' | 'premium';
  address?: { suburb?: string; city?: string };
  carpetDetails?: BookingCarpetDetails | null;
  rugs?: number;
  carpets?: number;
};

export type InstantPricingResult = {
  /** Whole ZAR, same as checkout snapshot `price_zar`. */
  finalPriceZar: number;
};

function stableKey(input: InstantPricingInput): string {
  const extras = [...(input.extras ?? [])].sort();
  return JSON.stringify({
    service: input.service,
    date: input.date,
    time: input.time,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    extraRooms: input.extraRooms ?? 0,
    extras,
    extrasQuantities: input.extrasQuantities,
    pricingMode: input.pricingMode ?? 'premium',
    address: input.address,
    carpetDetails: input.carpetDetails,
    rugs: input.rugs,
    carpets: input.carpets,
  });
}

function buildRequestBody(input: InstantPricingInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    date: input.date,
    time: input.time,
    service: input.service,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    extraRooms: input.extraRooms ?? 0,
    extras: input.extras ?? [],
    frequency: 'one-time',
    tipAmount: 0,
    discountAmount: 0,
    numberOfCleaners: 1,
    pricingMode: input.pricingMode ?? 'premium',
    address: input.address ?? { suburb: 'Cape Town', city: 'Cape Town' },
  };
  if (input.extrasQuantities && Object.keys(input.extrasQuantities).length > 0) {
    body.extrasQuantities = input.extrasQuantities;
  }
  if (input.carpetDetails) {
    body.carpetDetails = input.carpetDetails;
  }
  if (input.rugs != null) body.rugs = input.rugs;
  if (input.carpets != null) body.carpets = input.carpets;
  return body;
}

export function useInstantPricing(input: InstantPricingInput | null | undefined) {
  const inputRef = useRef(input);
  inputRef.current = input;

  const cacheKey = input?.service && input.date?.trim() ? stableKey(input) : '';
  const [result, setResult] = useState<InstantPricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!cacheKey) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    const hit = cache.get(cacheKey);
    if (hit) {
      setResult(hit);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const t = window.setTimeout(async () => {
      const snap = inputRef.current;
      if (!snap?.service) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/pricing/create-snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildRequestBody(snap)),
          signal: controller.signal,
        });
        const data = (await res.json()) as {
          ok?: boolean;
          price_zar?: number;
          engine_snapshot?: { result?: { finalPrice?: number } };
          error?: string;
        };
        if (!res.ok || data.ok === false) {
          throw new Error(data.error || 'Failed to fetch pricing');
        }
        const zar =
          typeof data.price_zar === 'number'
            ? data.price_zar
            : typeof data.engine_snapshot?.result?.finalPrice === 'number'
              ? data.engine_snapshot.result.finalPrice
              : null;
        if (zar == null || !Number.isFinite(zar)) {
          throw new Error('Invalid pricing response');
        }
        const out: InstantPricingResult = { finalPriceZar: Math.round(zar) };
        cacheSet(cacheKey, out);
        setResult(out);
        setError(null);
      } catch (err: unknown) {
        const name = err && typeof err === 'object' && 'name' in err ? String((err as { name?: string }).name) : '';
        if (name === 'AbortError') return;
        setError(err instanceof Error ? err : new Error('Pricing request failed'));
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(t);
      controller.abort();
      setLoading(false);
    };
  }, [cacheKey]);

  return { result, loading, error };
}
