'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useMemo } from 'react';
import { Sparkles, Users, MapPin, Navigation } from 'lucide-react';
import type { BookingFormData, PropertyType } from '@/components/booking-system-types';
import type { BookingFormData as ApiBookingFormData } from '@/lib/useBookingFormData';
import { slugifyExtraId } from '@/lib/booking-pricing-input';
import { computeLinePricingFromWizard } from '@/shared/booking';
import { computeWizardEnginePricingRow } from '@/shared/booking-engine/wizard-engine-pricing';
import { computeWizardDisplayPricing } from '@/shared/booking-engine/wizard-display-pricing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ServiceCard } from './service-card';
import { StepperInput } from './stepper-input';
import { ToggleChip } from './toggle-chip';
import { DateSelector } from './date-selector';
import { TimeSlotCard } from './time-slot-card';
import { StickyPriceBar } from './sticky-price-bar';

const SLOT_DEFS: {
  time: string;
  period: 'Morning' | 'Afternoon';
  badge: string | null;
}[] = [
  { time: '08:00', period: 'Morning', badge: '🔥 High demand' },
  { time: '09:00', period: 'Morning', badge: '⭐ Recommended' },
  { time: '10:00', period: 'Morning', badge: '💰 Best value' },
  { time: '13:00', period: 'Afternoon', badge: null },
  { time: '14:00', period: 'Afternoon', badge: '⭐ Recommended' },
  { time: '15:00', period: 'Afternoon', badge: null },
];

const CORE_EXTRA_LABELS = [
  'Inside Cabinets',
  'Inside Fridge',
  'Inside Oven',
  'Interior Windows',
  'Ironing',
] as const;

function extraIdFromLabel(label: string) {
  return slugifyExtraId(label);
}

function computeTotalZarForState(wizard: BookingFormData, api: ApiBookingFormData | null): number {
  const lineCalc = computeLinePricingFromWizard(wizard, api);
  const enginePricing = computeWizardEnginePricingRow({
    lineCalc,
    dataService: wizard.service,
    wizard,
    catalogExtraNames: api?.extras.all,
    quickCleanSettings: api?.quickCleanSettings,
  });
  const display = computeWizardDisplayPricing({
    data: {
      service: wizard.service,
      bedrooms: wizard.bedrooms,
      bathrooms: wizard.bathrooms,
      extraRooms: wizard.extraRooms,
      tipAmount: wizard.tipAmount,
      promoCode: wizard.promoCode,
      pricingMode: wizard.pricingMode,
      scheduleEquipmentPref: wizard.scheduleEquipmentPref ?? 'bring',
      extras: wizard.extras,
      extrasQuantities: wizard.extrasQuantities,
    },
    lineCalc,
    enginePricing,
    quickCleanSettings: api?.quickCleanSettings,
  });
  return display.total;
}

export type ShaleanStep1BookingProps = {
  data: BookingFormData;
  setData: Dispatch<SetStateAction<BookingFormData>>;
  apiFormData: ApiBookingFormData | null;
  errors: Partial<Record<keyof BookingFormData, string>>;
  pricingLockError?: string;
  isPricingLoading?: boolean;
  /** Clears server snapshot + `data.pricing` when inputs that invalidate the lock change. */
  onClearPricingLock: () => void;
  /** Locks authoritative pricing for the chosen slot (uses date/time overrides on the request). */
  onCommitTimeSlot: (slot: { date: string; time: string }) => Promise<void>;
  onContinue: () => void | Promise<void>;
};

export function ShaleanStep1Booking({
  data,
  setData,
  apiFormData,
  errors,
  pricingLockError,
  isPricingLoading,
  onClearPricingLock,
  onCommitTimeSlot,
  onContinue,
}: ShaleanStep1BookingProps) {
  const wizardBase = useMemo(
    () => ({
      ...data,
      scheduleEquipmentPref: data.scheduleEquipmentPref ?? 'bring',
    }),
    [data],
  );

  const slotTotals = useMemo(() => {
    const date = data.date?.trim();
    if (!date) return null as Record<string, number> | null;
    const out: Record<string, number> = {};
    for (const s of SLOT_DEFS) {
      const w: BookingFormData = { ...wizardBase, date, time: s.time };
      out[s.time] = computeTotalZarForState(w, apiFormData);
    }
    return out;
  }, [wizardBase, data.date, apiFormData]);

  const isServerLocked =
    Boolean(data.pricing_snapshot_id) &&
    Boolean(data.pricingSnapshot?.input) &&
    data.pricingSnapshot!.input.date === data.date &&
    data.pricingSnapshot!.input.time === data.time &&
    Boolean(data.time);

  const stickyPrice =
    isServerLocked && data.pricing?.total != null ? data.pricing.total : data.time && slotTotals?.[data.time] != null ? slotTotals![data.time]! : null;

  const breakdownLines = useMemo(() => {
    const lines: string[] = [];
    lines.push(`${data.bedrooms} bed · ${data.bathrooms} bath`);
    if (data.extraRooms > 0) lines.push(`${data.extraRooms} extra room(s)`);
    const names = CORE_EXTRA_LABELS.filter((l) => data.extras.includes(extraIdFromLabel(l)));
    if (names.length) lines.push(`Extras: ${names.join(', ')}`);
    else lines.push('Extras: none');
    if (data.date && data.time) lines.push(`${data.date} · ${data.time}`);
    else if (data.date) lines.push(`${data.date} · pick a time`);
    else lines.push('Pick a date & time');
    return lines;
  }, [data.bedrooms, data.bathrooms, data.extraRooms, data.extras, data.date, data.time]);

  const setPackage = useCallback(
    (kind: 'basic' | 'premium') => {
      onClearPricingLock();
      setData((prev) => ({
        ...prev,
        service: 'standard',
        pricingMode: kind === 'basic' ? 'basic' : 'premium',
        basicPlannedHours: kind === 'basic' ? (prev.basicPlannedHours ?? 3) : null,
        userHasEdited: true,
      }));
    },
    [onClearPricingLock, setData],
  );

  const toggleExtra = useCallback(
    (label: string) => {
      const id = extraIdFromLabel(label);
      onClearPricingLock();
      setData((prev) => {
        const has = prev.extras.includes(id);
        const extras = has ? prev.extras.filter((e) => e !== id) : [...prev.extras, id];
        const extrasQuantities = { ...prev.extrasQuantities };
        if (has) delete extrasQuantities[id];
        return { ...prev, extras, extrasQuantities, userHasEdited: true };
      });
    },
    [onClearPricingLock, setData],
  );

  const morning = SLOT_DEFS.filter((s) => s.period === 'Morning');
  const afternoon = SLOT_DEFS.filter((s) => s.period === 'Afternoon');

  const errorBanner =
    pricingLockError || errors.workingArea || errors.date || errors.time || errors.service ? (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
        {pricingLockError ||
          errors.workingArea ||
          errors.date ||
          errors.time ||
          errors.service ||
          errors.bedrooms ||
          errors.bathrooms}
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-44 lg:pb-10">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">Shalean Cleaning Services</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Book your clean</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
            Choose everything here — your final price is set before you continue. No surprises later.
          </p>
        </header>

        {errorBanner ? <div className="mb-6">{errorBanner}</div> : null}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="min-w-0 space-y-10">
            {/* 1 Service */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Service</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ServiceCard
                  title="Basic Clean"
                  subtitle="Starts from R199"
                  bullets={['1 cleaner', 'Up to 6 hours']}
                  selected={data.pricingMode === 'basic' && data.service === 'standard'}
                  onSelect={() => setPackage('basic')}
                  icon={<Sparkles className="h-5 w-5" />}
                />
                <ServiceCard
                  title="Premium Clean"
                  subtitle="From R250+"
                  bullets={['Team cleaning', 'Faster completion']}
                  selected={data.pricingMode === 'premium' && data.service === 'standard'}
                  onSelect={() => setPackage('premium')}
                  highlight
                  badge="Best results"
                  icon={<Users className="h-5 w-5" />}
                />
              </div>
            </section>

            {/* 2 Home details */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Home details</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <StepperInput
                  label="Bedrooms"
                  value={Math.max(1, data.bedrooms)}
                  min={1}
                  max={12}
                  helperText="More rooms = more cleaning time"
                  onChange={(n) => {
                    onClearPricingLock();
                    setData((p) => ({ ...p, bedrooms: n, userHasEdited: true }));
                  }}
                />
                <StepperInput
                  label="Bathrooms"
                  value={Math.max(1, data.bathrooms)}
                  min={1}
                  max={12}
                  onChange={(n) => {
                    onClearPricingLock();
                    setData((p) => ({ ...p, bathrooms: n, userHasEdited: true }));
                  }}
                />
              </div>
              <div className="mt-6 max-w-xs">
                <label className="mb-2 block text-sm font-semibold text-gray-900">Property type</label>
                <Select
                  value={data.propertyType}
                  onValueChange={(v) => {
                    onClearPricingLock();
                    setData((p) => ({ ...p, propertyType: v as PropertyType, userHasEdited: true }));
                  }}
                >
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* 3 Location */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Location</h2>
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter your address"
                    value={data.address || data.workingArea || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      onClearPricingLock();
                      setData((p) => ({ ...p, address: v, workingArea: v, userHasEdited: true }));
                    }}
                    className="w-full rounded-2xl border border-gray-200 py-3.5 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
                {(data.workingArea || data.address)?.trim() ? (
                  <p className="text-xs text-gray-600">
                    Area:{' '}
                    <span className="font-semibold text-gray-900">
                      {(data.workingArea || data.address).split(',')[0]?.trim()}
                    </span>
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) return;
                    navigator.geolocation.getCurrentPosition((pos) => {
                      const label = `Near ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`;
                      onClearPricingLock();
                      setData((p) => ({ ...p, address: label, workingArea: label, userHasEdited: true }));
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-violet-300"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Use current location
                </button>
              </div>
            </section>

            {/* 4 Extras */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Cleaning add-ons</h2>
              <p className="mt-1 text-xs text-gray-500">Tap to include — prices update all time slots instantly</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {CORE_EXTRA_LABELS.map((label) => {
                  const id = extraIdFromLabel(label);
                  return (
                    <ToggleChip
                      key={id}
                      label={label}
                      selected={data.extras.includes(id)}
                      onToggle={() => toggleExtra(label)}
                    />
                  );
                })}
              </div>
            </section>

            {/* 5 Date */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Date</h2>
              <div className="mt-4">
                <DateSelector
                  selectedDate={data.date}
                  onSelectDate={(ymd) => {
                    onClearPricingLock();
                    setData((p) => ({ ...p, date: ymd, time: '', userHasEdited: true }));
                  }}
                  count={10}
                />
              </div>
            </section>

            {/* 6 Time slots */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Time</h2>
              {!data.date?.trim() ? (
                <p className="mt-4 text-sm text-gray-500">Select a date to see prices for each slot.</p>
              ) : (
                <div className="mt-6 space-y-8">
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-violet-600">Morning</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {morning.map((s) => (
                        <TimeSlotCard
                          key={s.time}
                          time={s.time}
                          priceZar={slotTotals?.[s.time] ?? 0}
                          badge={s.badge}
                          selected={data.time === s.time}
                          disabled={!slotTotals}
                          onSelect={async () => {
                            setData((p) => ({ ...p, date: data.date, time: s.time, userHasEdited: true }));
                            await onCommitTimeSlot({ date: data.date, time: s.time });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-violet-600">Afternoon</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {afternoon.map((s) => (
                        <TimeSlotCard
                          key={s.time}
                          time={s.time}
                          priceZar={slotTotals?.[s.time] ?? 0}
                          badge={s.badge}
                          selected={data.time === s.time}
                          disabled={!slotTotals}
                          onSelect={async () => {
                            setData((p) => ({ ...p, date: data.date, time: s.time, userHasEdited: true }));
                            await onCommitTimeSlot({ date: data.date, time: s.time });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Extra rooms */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Extra rooms (optional)</h2>
              <div className="mt-4 max-w-xs">
                <StepperInput
                  label="Extra rooms"
                  value={Math.max(0, data.extraRooms)}
                  min={0}
                  max={10}
                  onChange={(n) => {
                    onClearPricingLock();
                    setData((p) => ({ ...p, extraRooms: n, userHasEdited: true }));
                  }}
                />
              </div>
            </section>
          </div>

          {/* Desktop sticky */}
          <aside className="hidden lg:block">
            <StickyPriceBar
              finalPriceZar={stickyPrice}
              locked={isServerLocked}
              breakdownLines={breakdownLines}
              onContinue={onContinue}
              continueDisabled={!isServerLocked}
              isLoading={isPricingLoading}
            />
          </aside>
        </div>
      </div>

      {/* Mobile sticky */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-md lg:hidden">
        <StickyPriceBar
          finalPriceZar={stickyPrice}
          locked={isServerLocked}
          breakdownLines={breakdownLines}
          onContinue={onContinue}
          continueDisabled={!isServerLocked}
          isLoading={isPricingLoading}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>
    </div>
  );
}
