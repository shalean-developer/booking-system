'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Tag,
  LayoutGrid,
  Gift,
  Loader2,
  SlidersHorizontal,
  Boxes,
  Users,
  Percent,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { pricingStore, type PromoCode } from './pricingStore';
import { stagger, fadeUp, InlineToast, type ToastState } from './pricing-shared';
import {
  ServicesSection,
  RulesSection,
  ExtrasSection,
  CleanerPricingSection,
  PromoCodesSection,
  BathroomsSection,
  ExtraRoomsSection,
} from './pricing-sections';
import { DynamicPricingRulesSection } from './dynamic-pricing-rules-section';
import { PricingEnginePanel } from './PricingEnginePanel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

function pickPricingSlices(d: ReturnType<typeof pricingStore.getData>) {
  return {
    services: JSON.stringify(d.services),
    rules: JSON.stringify(d.rules),
    bathroomRules: JSON.stringify(d.bathroomRules),
    extraRooms: JSON.stringify(d.extraRooms),
    extras: JSON.stringify(d.extras),
    cleanerPricing: JSON.stringify(d.cleanerPricing),
    promoCodes: JSON.stringify(d.promoCodes),
  };
}

function EngineSection({
  title,
  tooltip,
  dirty,
  children,
}: {
  title: string;
  tooltip?: string;
  dirty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'space-y-4 rounded-2xl bg-white p-6 shadow-sm transition-shadow',
        dirty && 'ring-2 ring-blue-500/80 ring-offset-2'
      )}
    >
      <h2 className="text-xl font-semibold text-gray-900" title={tooltip}>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

type ServicePricing = {
  service_type: string;
  service_name: string;
  base: { id: string; price: number } | null;
  bedroom: { id: string; price: number } | null;
  bathroom: { id: string; price: number } | null;
  extra_room: { id: string; price: number } | null;
};

type ExtraPricing = {
  id: string;
  item_name: string;
  price: number;
  is_active?: boolean;
};

type PricingManageResponse = {
  ok: boolean;
  pricing?: {
    services: ServicePricing[];
    extras: ExtraPricing[];
  };
  error?: string;
};

type AdminServicesResponse = {
  ok: boolean;
  services?: Array<{
    service_type: string;
    is_active: boolean;
  }>;
};

type PricingPageConfigResponse = {
  ok: boolean;
  cleanerPricing?: Array<{
    id: string;
    cleaner_type: 'individual' | 'team';
    base_rate: number;
    additional_cleaner_rate: number;
    label: string;
    description: string | null;
    is_active: boolean;
  }>;
  bathroomRules?: Array<{
    id: string;
    label: string;
    price: number;
    description: string | null;
    is_active: boolean;
    sort_order: number;
  }>;
  extraRoomRules?: Array<{
    id: string;
    name: string;
    price: number;
    description: string | null;
    icon: string | null;
    is_active: boolean;
    sort_order: number;
  }>;
  promoCodes?: Array<{
    id: string;
    code: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_purchase_amount: number;
    usage_limit: number | null;
    usage_count: number | null;
    is_active: boolean;
    valid_until: string | null;
    applicable_services: string | string[] | null;
  }>;
};

const SERVICE_ID_MAP: Record<string, string> = {
  standard: 'standard',
  deep: 'deep',
  'move in/out': 'movein',
  movein: 'movein',
  office: 'office',
  window: 'window',
  airbnb: 'airbnb',
  carpet: 'carpet',
};

function toServiceId(serviceType: string): string {
  const key = serviceType.trim().toLowerCase();
  return SERVICE_ID_MAP[key] ?? key.replace(/[^a-z0-9]+/g, '-');
}

function normalizePromoAppliesTo(value: string | string[] | null | undefined): PromoCode['appliesTo'] {
  if (value === 'all' || value == null) {
    return 'all';
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  const parsed = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length ? parsed : 'all';
}

export function PricingPage() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [data, setData] = useState(() => pricingStore.getData());
  const [loadingLivePrices, setLoadingLivePrices] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const handleToast = useCallback((t: ToastState) => {
    setToast(t);
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const baselineRef = useRef<ReturnType<typeof pickPricingSlices> | null>(null);
  const [sectionDirty, setSectionDirty] = useState({
    base: false,
    adjustments: false,
    extras: false,
    labor: false,
    promos: false,
  });
  const [engineVersion, setEngineVersion] = useState<number | null>(null);
  const [engineUpdatedAt, setEngineUpdatedAt] = useState<string | null>(null);
  const [publishBusy, setPublishBusy] = useState(false);

  const refreshEngineMeta = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pricing/config', {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = (await res.json()) as {
        ok?: boolean;
        config?: { version: number; updatedAt: string };
      };
      if (res.ok && json.ok && json.config) {
        setEngineVersion(json.config.version);
        setEngineUpdatedAt(json.config.updatedAt);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshEngineMeta();
  }, [refreshEngineMeta]);

  useEffect(() => {
    const sync = () => {
      const b = baselineRef.current;
      if (!b) return;
      const cur = pickPricingSlices(pricingStore.getData());
      setSectionDirty({
        base: cur.services !== b.services || cur.rules !== b.rules,
        adjustments: cur.bathroomRules !== b.bathroomRules || cur.extraRooms !== b.extraRooms,
        extras: cur.extras !== b.extras,
        labor: cur.cleanerPricing !== b.cleanerPricing,
        promos: cur.promoCodes !== b.promoCodes,
      });
    };
    sync();
    return pricingStore.subscribe(sync);
  }, []);

  const handlePublish = useCallback(async () => {
    setPublishBusy(true);
    try {
      const res = await fetch('/api/admin/pricing/config', {
        method: 'POST',
        credentials: 'include',
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        config?: { version: number; updatedAt: string };
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to publish');
      }
      if (json.config) {
        setEngineVersion(json.config.version);
        setEngineUpdatedAt(json.config.updatedAt);
      } else {
        await refreshEngineMeta();
      }
      baselineRef.current = pickPricingSlices(pricingStore.getData());
      setSectionDirty({
        base: false,
        adjustments: false,
        extras: false,
        labor: false,
        promos: false,
      });
      handleToast({ type: 'success', message: 'Live pricing cache refreshed — workers pick up changes.' });
    } catch (e) {
      handleToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Publish failed',
      });
    } finally {
      setPublishBusy(false);
    }
  }, [handleToast, refreshEngineMeta]);

  useEffect(() => pricingStore.subscribe(() => setData(pricingStore.getData())), []);

  useEffect(() => {
    let cancelled = false;
    const hydrateFromDb = async () => {
      try {
        setLoadingLivePrices(true);
        setLoadError(null);
        const response = await fetch('/api/admin/pricing/manage', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });
        const result = (await response.json()) as PricingManageResponse;
        if (!response.ok || !result.ok || !result.pricing) {
          throw new Error(result.error || 'Failed to load live pricing');
        }
        const servicesResponse = await fetch('/api/admin/services?limit=200&offset=0', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });
        const pageConfigResponse = await fetch('/api/admin/pricing/page-config', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });
        const servicesResult = (await servicesResponse.json()) as AdminServicesResponse;
        const pageConfig = (await pageConfigResponse.json()) as PricingPageConfigResponse;
        const activeMap = new Map<string, boolean>();
        if (servicesResponse.ok && servicesResult.ok && Array.isArray(servicesResult.services)) {
          servicesResult.services.forEach((service) => {
            activeMap.set(String(service.service_type || '').trim().toLowerCase(), service.is_active !== false);
          });
        }

        const current = pricingStore.getData();
        const serviceById = new Map(current.services.map((svc) => [svc.id, svc]));
        const mappedServices = result.pricing.services.map((svc) => {
          const serviceId = toServiceId(svc.service_type);
          const existing = serviceById.get(serviceId);
          const dbActive = activeMap.get(String(svc.service_type).trim().toLowerCase());
          return {
            id: serviceId,
            name: svc.service_name || existing?.name || serviceId,
            basePrice: Number(svc.base?.price) || 0,
            priceType: existing?.priceType ?? 'per_room',
            duration: existing?.duration ?? '—',
            description: existing?.description ?? 'Configured from live pricing',
            color: existing?.color ?? '#4F46E5',
            active: dbActive ?? existing?.active ?? true,
          };
        });

        const mappedRules = result.pricing.services.flatMap((svc) => {
          const serviceId = toServiceId(svc.service_type);
          return [
            { id: String(svc.base?.id || `${serviceId}-base`), serviceId, label: 'Base', price: Number(svc.base?.price) || 0 },
            {
              id: String(svc.bedroom?.id || `${serviceId}-bedroom`),
              serviceId,
              label: 'Per Bedroom',
              price: Number(svc.bedroom?.price) || 0,
            },
            {
              id: String(svc.bathroom?.id || `${serviceId}-bathroom`),
              serviceId,
              label: 'Per Bathroom',
              price: Number(svc.bathroom?.price) || 0,
            },
            {
              id: String(svc.extra_room?.id || `${serviceId}-extra-room`),
              serviceId,
              label: 'Per Extra Room',
              price: Number(svc.extra_room?.price) || 0,
            },
          ];
        });

        const mappedExtras = result.pricing.extras.map((extra) => ({
          id: String(extra.id),
          name: extra.item_name,
          price: Number(extra.price) || 0,
          pricingType: 'fixed' as const,
          active: extra.is_active !== false,
          icon: '✨',
        }));
        const extraCleanerAliases = [
          'Extra Cleaner',
          'Carpet extra cleaner',
          'Carpet occupied property',
          'Carpet property occupied',
        ];
        const existingExtraCleaner = mappedExtras.find((extra) =>
          extraCleanerAliases.some(
            (alias) => alias.trim().toLowerCase() === extra.name.trim().toLowerCase()
          )
        );
        if (!existingExtraCleaner) {
          mappedExtras.push({
            id: 'virtual-extra-cleaner',
            name: 'Extra Cleaner',
            price: 0,
            pricingType: 'fixed',
            active: true,
            icon: '✨',
          });
        } else if (existingExtraCleaner.name !== 'Extra Cleaner') {
          existingExtraCleaner.name = 'Extra Cleaner';
        }

        const cleanerPricing = (pageConfig.cleanerPricing ?? []).map((row) => ({
          id: row.id,
          type: row.cleaner_type,
          baseRate: Number(row.base_rate) || 0,
          additionalCleanerRate: Number(row.additional_cleaner_rate) || 0,
          label: row.label || 'Cleaner pricing',
          description: row.description || '',
        }));

        const bathroomRules = (pageConfig.bathroomRules ?? []).map((row) => ({
          id: row.id,
          label: row.label,
          price: Number(row.price) || 0,
          description: row.description || '',
          active: row.is_active !== false,
        }));

        const extraRooms = (pageConfig.extraRoomRules ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          price: Number(row.price) || 0,
          description: row.description || '',
          active: row.is_active !== false,
          icon: row.icon || '✨',
        }));

        const promoCodes: PromoCode[] = (pageConfig.promoCodes ?? []).map((row) => ({
          id: row.id,
          code: row.code,
          description: row.description || '',
          discountType: row.discount_type,
          discountValue: Number(row.discount_value) || 0,
          minOrderValue: Number(row.min_purchase_amount) || 0,
          maxUses: row.usage_limit,
          usedCount: Number(row.usage_count) || 0,
          active: row.is_active !== false,
          expiresAt: row.valid_until,
          appliesTo: normalizePromoAppliesTo(row.applicable_services),
        }));

        pricingStore.replaceData({
          ...current,
          services: mappedServices,
          rules: mappedRules,
          extras: mappedExtras,
          cleanerPricing: cleanerPricing.length ? cleanerPricing : current.cleanerPricing,
          bathroomRules: bathroomRules.length ? bathroomRules : current.bathroomRules,
          extraRooms: extraRooms.length ? extraRooms : current.extraRooms,
          promoCodes: promoCodes.length ? promoCodes : current.promoCodes,
        });
        baselineRef.current = pickPricingSlices(pricingStore.getData());
        setSectionDirty({
          base: false,
          adjustments: false,
          extras: false,
          labor: false,
          promos: false,
        });
        try {
          const cfgRes = await fetch('/api/admin/pricing/config', {
            credentials: 'include',
            cache: 'no-store',
          });
          const cfgJson = (await cfgRes.json()) as {
            ok?: boolean;
            config?: { version: number; updatedAt: string };
          };
          if (cfgRes.ok && cfgJson.ok && cfgJson.config) {
            setEngineVersion(cfgJson.config.version);
            setEngineUpdatedAt(cfgJson.config.updatedAt);
          }
        } catch {
          /* ignore */
        }
      } catch (error) {
        console.error('Failed to hydrate pricing page from database:', error);
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load live pricing');
        }
      } finally {
        if (!cancelled) {
          setLoadingLivePrices(false);
        }
      }
    };

    hydrateFromDb();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Pricing Engine</h1>
          <p className="mt-1 text-base text-gray-500">
            Control centre for catalogue pricing, labour, surges, and promos — same engine as checkout.
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-base text-gray-500">
              Live version:{' '}
              <span className="font-mono tabular-nums text-gray-800">
                {engineVersion ?? '—'}
              </span>
            </span>
            <button
              type="button"
              disabled={publishBusy || loadingLivePrices}
              onClick={() => void handlePublish()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-base font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:pointer-events-none disabled:opacity-50"
              title="Clears server pricing cache so all workers use the latest DB config"
            >
              {publishBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Publish changes
            </button>
          </div>
          <div className="flex items-center justify-end gap-2">
            <div className="hidden items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 sm:flex">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-sm font-bold text-green-700">Live DB pricing</span>
            </div>
            {loadingLivePrices && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" aria-hidden />}
          </div>
        </div>
      </motion.div>

      {loadError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center justify-between gap-3">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-red-700"
            >
              Reload
            </button>
          </div>
        </div>
      )}

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4"
      >
        {[
          {
            label: 'Active Services',
            value: String(data.services.filter((s) => s.active !== false).length),
            color: '#4F46E5',
            bg: '#EEF2FF',
            icon: <Sparkles className="h-4 w-4" />,
          },
          {
            label: 'Active Extras',
            value: String(data.extras.filter((e) => e.active !== false).length),
            color: '#059669',
            bg: '#ECFDF5',
            icon: <Tag className="h-4 w-4" />,
          },
          {
            label: 'Extra Rooms',
            value: String(data.extraRooms.filter((r) => r.active !== false).length),
            color: '#7C3AED',
            bg: '#F5F3FF',
            icon: <LayoutGrid className="h-4 w-4" />,
          },
          {
            label: 'Active Promos',
            value: String(
              data.promoCodes.filter(
                (p) => p.active && (p.expiresAt === null || new Date(p.expiresAt) >= new Date())
              ).length
            ),
            color: '#BE185D',
            bg: '#FDF2F8',
            icon: <Gift className="h-4 w-4" />,
          },
        ].map((kpi) => (
          <motion.div
            key={kpi.label}
            variants={fadeUp}
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: kpi.bg, color: kpi.color }}
            >
              {kpi.icon}
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{kpi.value}</p>
              <p className="text-sm text-gray-500">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {!loadingLivePrices && !loadError && (
        <div className="grid grid-cols-1 gap-8 pb-8 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-8 min-w-0">
            <EngineSection
              title="Base pricing"
              tooltip="Service catalogue base and per-room line items that feed the engine"
              dirty={sectionDirty.base}
            >
              <ServicesSection onToast={handleToast} />
              <RulesSection onToast={handleToast} />
            </EngineSection>

            <Accordion
              type="multiple"
              defaultValue={['adjustments', 'extras', 'labour']}
              className="space-y-4"
            >
              <AccordionItem
                value="adjustments"
                className="rounded-2xl border border-gray-100 bg-white px-2 shadow-sm"
              >
                <AccordionTrigger className="px-4 py-3 text-xl font-semibold hover:no-underline [&[data-state=open]]:pb-2">
                  <span className="flex items-center gap-2 text-left">
                    <SlidersHorizontal className="h-5 w-5 shrink-0 text-violet-600" aria-hidden />
                    Adjustments
                    {sectionDirty.adjustments ? (
                      <span className="text-sm font-normal text-blue-600">(unsaved edits)</span>
                    ) : null}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 px-4 pb-4">
                  <BathroomsSection onToast={handleToast} />
                  <ExtraRoomsSection onToast={handleToast} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="extras"
                className="rounded-2xl border border-gray-100 bg-white px-2 shadow-sm"
              >
                <AccordionTrigger className="px-4 py-3 text-xl font-semibold hover:no-underline [&[data-state=open]]:pb-2">
                  <span className="flex items-center gap-2 text-left">
                    <Boxes className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                    Extras
                    {sectionDirty.extras ? (
                      <span className="text-sm font-normal text-blue-600">(unsaved edits)</span>
                    ) : null}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <ExtrasSection onToast={handleToast} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="labour"
                className="rounded-2xl border border-gray-100 bg-white px-2 shadow-sm"
              >
                <AccordionTrigger className="px-4 py-3 text-xl font-semibold hover:no-underline [&[data-state=open]]:pb-2">
                  <span className="flex items-center gap-2 text-left">
                    <Users className="h-5 w-5 shrink-0 text-sky-600" aria-hidden />
                    Labour
                    {sectionDirty.labor ? (
                      <span className="text-sm font-normal text-blue-600">(unsaved edits)</span>
                    ) : null}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <CleanerPricingSection onToast={handleToast} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="dynamic"
                className="rounded-2xl border border-gray-100 bg-white px-2 shadow-sm"
              >
                <AccordionTrigger className="px-4 py-3 text-xl font-semibold hover:no-underline [&[data-state=open]]:pb-2">
                  <span className="flex items-center gap-2 text-left">
                    <Zap className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
                    Dynamic rules
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <DynamicPricingRulesSection onToast={handleToast} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="discounts"
                className="rounded-2xl border border-gray-100 bg-white px-2 shadow-sm"
              >
                <AccordionTrigger className="px-4 py-3 text-xl font-semibold hover:no-underline [&[data-state=open]]:pb-2">
                  <span className="flex items-center gap-2 text-left">
                    <Percent className="h-5 w-5 shrink-0 text-rose-600" aria-hidden />
                    Discounts
                    {sectionDirty.promos ? (
                      <span className="text-sm font-normal text-blue-600">(unsaved edits)</span>
                    ) : null}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <PromoCodesSection onToast={handleToast} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="min-w-0 xl:max-w-none">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] space-y-4 overflow-y-auto pr-2">
              <PricingEnginePanel engineVersion={engineVersion} engineUpdatedAt={engineUpdatedAt} />
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {toast && <InlineToast key="toast" toast={toast} onDone={clearToast} />}
      </AnimatePresence>
    </div>
  );
}
