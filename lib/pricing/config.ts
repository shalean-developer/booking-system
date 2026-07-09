import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchActivePricing, type PricingData, type ServicePricing } from '@/lib/pricing-db';
import { fetchQuickCleanSettings } from '@/lib/quick-clean-settings';

/**
 * Serializable pricing bundle for versioning + admin UI.
 * Numeric `version` changes when underlying DB pricing rows change (content hash).
 */
export type PricingConfig = {
  version: number;
  updatedAt: string;

  services: Record<string, number>;
  extras: Record<string, number>;

  adjustments: {
    bathroom: number;
    extraRoom: number;
  };

  labor: {
    baseHourlyRate: number;
  };

  rules: {
    surge: {
      enabled: boolean;
      weekendMultiplier: number;
      peakHoursMultiplier: number;
    };
  };

  discounts: {
    promoCodes: Record<string, number>;
  };

  /** Full per-service line items (ZAR) — same as `PricingData.services`. */
  serviceLineItems: Record<string, ServicePricing>;
  serviceFee: number;
};

function stableStringify(value: unknown): string {
  const norm = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(norm);
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      return Object.keys(o)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = norm(o[k]);
          return acc;
        }, {});
    }
    return v;
  };
  return JSON.stringify(norm(value));
}

function hashToVersion(payload: string): number {
  const h = crypto.createHash('sha256').update(payload).digest();
  return h.readUInt32BE(0);
}

/**
 * Build {@link PricingConfig} from live DB state. Safe to call from Route Handlers (service client).
 */
export async function loadPricingEngineConfig(supabase: SupabaseClient): Promise<PricingConfig> {
  const [pricing, qc, bathRow, erRow, promoRows] = await Promise.all([
    fetchActivePricing(),
    fetchQuickCleanSettings(supabase),
    supabase
      .from('pricing_config')
      .select('price, updated_at')
      .eq('price_type', 'bathroom')
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('pricing_config')
      .select('price, updated_at')
      .eq('price_type', 'extra_room')
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('discount_codes')
      .select('code, discount_value')
      .eq('is_active', true)
      .limit(500),
  ]);

  const services: Record<string, number> = {};
  for (const [k, v] of Object.entries(pricing.services)) {
    services[k] = v.base;
  }

  const promoCodes: Record<string, number> = {};
  if (!promoRows.error && promoRows.data) {
    for (const row of promoRows.data) {
      const code = typeof row.code === 'string' ? row.code.trim().toUpperCase() : '';
      if (code) promoCodes[code] = Number(row.discount_value) || 0;
    }
  }

  const versionPayload = stableStringify({
    pricing,
    bath: bathRow.data?.price ?? null,
    er: erRow.data?.price ?? null,
    promos: promoCodes,
  });

  return {
    version: hashToVersion(versionPayload),
    updatedAt: new Date().toISOString(),
    services,
    extras: { ...pricing.extras },
    adjustments: {
      bathroom: Number(bathRow.data?.price) || 0,
      extraRoom: Number(erRow.data?.price) || 0,
    },
    labor: {
      baseHourlyRate: qc.hourlyRateZar,
    },
    rules: {
      surge: {
        enabled: true,
        weekendMultiplier: 1,
        peakHoursMultiplier: 1,
      },
    },
    discounts: {
      promoCodes,
    },
    serviceLineItems: { ...pricing.services },
    serviceFee: pricing.serviceFee,
  };
}

/** Version only — cheap compare for snapshot invalidation. */
export async function getCurrentPricingConfigVersion(supabase: SupabaseClient): Promise<number> {
  const cfg = await loadPricingEngineConfig(supabase);
  return cfg.version;
}

export function pricingDataForEngineDebug(pricing: PricingData): Pick<PricingConfig, 'services' | 'extras'> {
  const services: Record<string, number> = {};
  for (const [k, v] of Object.entries(pricing.services)) {
    services[k] = v.base;
  }
  return { services, extras: { ...pricing.extras } };
}
