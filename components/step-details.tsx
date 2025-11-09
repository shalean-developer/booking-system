'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceType } from '@/types/booking';
import { useBooking } from '@/lib/useBooking';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { PRICING } from '@/lib/pricing';
import { BadgeCheck, Check, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXTRA_ICONS } from '@/components/extra-service-icons';

const allExtrasList = Object.keys(PRICING.extras) as Array<keyof typeof PRICING.extras>;
const standardAndAirbnbExtras: Array<keyof typeof PRICING.extras> = [
  'Inside Fridge',
  'Inside Oven',
  'Laundry',
  'Interior Walls',
  'Interior Windows',
  'Inside Cabinets',
  'Ironing',
];
const deepAndMoveExtras = allExtrasList.filter(
  (extra) => !standardAndAirbnbExtras.includes(extra)
);
const recommendedExtras = new Set<keyof typeof PRICING.extras>([
  'Inside Oven',
  'Interior Windows',
  'Carpet Cleaning',
  'Outside Window Cleaning',
]);
const quantityExtras = new Set<keyof typeof PRICING.extras>([
  'Carpet Cleaning',
  'Couch Cleaning',
  'Ceiling Cleaning',
]);
const DEFAULT_QUANTITY = 1;
const MAX_QUANTITY = 5;
const extrasMeta: Record<keyof typeof PRICING.extras, { blurb: string }> = {
  'Inside Fridge': { blurb: 'Wipe shelves, trays and seals' },
  'Inside Oven': { blurb: 'Remove grease and baked-on mess' },
  'Inside Cabinets': { blurb: 'Empty, dust and reset cupboards' },
  'Interior Windows': { blurb: 'Inside glass, tracks and frames' },
  'Interior Walls': { blurb: 'Spot-clean scuffs and marks' },
  'Ironing': { blurb: 'Press 10–15 garments per visit' },
  'Laundry': { blurb: 'Wash, dry and fold one load' },
  'Carpet Cleaning': { blurb: 'Deep clean high-traffic carpet zones' },
  'Ceiling Cleaning': { blurb: 'Remove cobwebs and ceiling dust build-up' },
  'Garage Cleaning': { blurb: 'Sweep, dust and organise your garage floor' },
  'Balcony Cleaning': { blurb: 'Wash floors, railings and outdoor furniture' },
  'Couch Cleaning': { blurb: 'Refresh upholstery with fabric-safe cleaner' },
  'Outside Window Cleaning': { blurb: 'Exterior glass and frames washed' },
};

// Helper function to convert ServiceType to URL slug
function serviceTypeToSlug(serviceType: ServiceType): string {
  if (serviceType === 'Move In/Out') {
    return 'move-in-out';
  }
  
  return serviceType
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function StepDetails() {
  const router = useRouter();
  const { state, updateField } = useBooking();
  const stepLabel = useMemo(() => {
    if (!state.service) return 'Step 1 of 3 · Service Setup';
    return `Step 1 of 3 · ${state.service} setup`;
  }, [state.service]);

  const allowedExtras = useMemo(() => {
    switch (state.service) {
      case 'Deep':
      case 'Move In/Out':
        return deepAndMoveExtras;
      case 'Standard':
      case 'Airbnb':
        return standardAndAirbnbExtras;
      default:
        return allExtrasList;
    }
  }, [state.service]);

  useEffect(() => {
    const allowedSet = new Set(allowedExtras);
    const filteredExtras = state.extras.filter((extra) => allowedSet.has(extra as keyof typeof PRICING.extras));
    if (filteredExtras.length !== state.extras.length) {
      updateField('extras', filteredExtras);
    }

    const filteredQuantities = Object.entries(state.extrasQuantities).reduce<Record<string, number>>((acc, [extra, qty]) => {
      if (allowedSet.has(extra as keyof typeof PRICING.extras) && filteredExtras.includes(extra)) {
        acc[extra] = qty;
      }
      return acc;
    }, {});

    if (Object.keys(filteredQuantities).length !== Object.keys(state.extrasQuantities).length) {
      updateField('extrasQuantities', filteredQuantities);
    }
  }, [allowedExtras, state.extras, state.extrasQuantities, updateField]);
  useEffect(() => {
    const updates: Record<string, number> = {};
    let shouldUpdate = false;

    state.extras.forEach((extra) => {
      const extraKey = extra as keyof typeof PRICING.extras;
      if (!quantityExtras.has(extraKey)) {
        return;
      }
      const currentQty = state.extrasQuantities[extra];
      if (!currentQty || currentQty < DEFAULT_QUANTITY) {
        updates[extra] = DEFAULT_QUANTITY;
        shouldUpdate = true;
      }
    });

    if (shouldUpdate) {
      updateField('extrasQuantities', {
        ...state.extrasQuantities,
        ...updates,
      });
    }
  }, [state.extras, state.extrasQuantities, updateField]);
  
  // Diagnostic logging
  useEffect(() => {
    console.log('🏠 StepDetails rendered with state:', {
      bedrooms: state.bedrooms,
      bathrooms: state.bathrooms,
      extras: state.extras,
      extrasCount: state.extras.length
    });
  }, [state.bedrooms, state.bathrooms, state.extras]);

  const handleBack = useCallback(() => {
    // Navigate immediately - step will be updated by the target page's useEffect
    router.push('/booking/service/select');
  }, [router]);

  const handleNext = useCallback(() => {
    // Validate minimum requirements (only bathroom required now)
    if (state.bathrooms < 1) {
      // This validation will be handled by the canProceed check
      return;
    }
    
    if (state.service) {
      const slug = serviceTypeToSlug(state.service);
      // Navigate immediately - step will be updated by the target page's useEffect
      router.push(`/booking/service/${slug}/schedule`);
    }
  }, [state.service, state.bathrooms, router]);

  const handleBedroomChange = useCallback((value: string) => {
    const newValue = parseInt(value);
    console.log('🛏️ Bedroom dropdown changed from', state.bedrooms, 'to', newValue);
    updateField('bedrooms', newValue);
  }, [updateField, state.bedrooms]);

  const handleBathroomChange = useCallback((value: string) => {
    const newValue = parseInt(value);
    console.log('🚿 Bathroom dropdown changed from', state.bathrooms, 'to', newValue);
    updateField('bathrooms', newValue);
  }, [updateField, state.bathrooms]);

  const toggleExtra = useCallback((extra: string) => {
    const isCurrentlySelected = state.extras.includes(extra);
    console.log('⭐ Extra toggled:', extra, 'currently selected:', isCurrentlySelected);

    if (isCurrentlySelected) {
      const newExtras = state.extras.filter((e) => e !== extra);
      const { [extra]: _removed, ...rest } = state.extrasQuantities;
      updateField('extras', newExtras);
      updateField('extrasQuantities', rest);
    } else {
      const newExtras = [...state.extras, extra];
      const extraKey = extra as keyof typeof PRICING.extras;
      const initialQty = quantityExtras.has(extraKey) ? DEFAULT_QUANTITY : 1;
      updateField('extras', newExtras);
      updateField('extrasQuantities', {
        ...state.extrasQuantities,
        [extra]: initialQty,
      });
    }
  }, [state.extras, state.extrasQuantities, updateField]);

  const adjustQuantity = useCallback((extra: string, delta: number) => {
    const extraKey = extra as keyof typeof PRICING.extras;
    if (!quantityExtras.has(extraKey)) return;
    if (!state.extras.includes(extra)) {
      // Select the extra first if not already selected
      toggleExtra(extra);
      return;
    }

    const currentQty = state.extrasQuantities[extra] ?? DEFAULT_QUANTITY;
    const nextQty = Math.min(MAX_QUANTITY, Math.max(DEFAULT_QUANTITY, currentQty + delta));
    if (nextQty === currentQty) return;

    updateField('extrasQuantities', {
      ...state.extrasQuantities,
      [extra]: nextQty,
    });
  }, [state.extras, state.extrasQuantities, toggleExtra, updateField]);

  // Validation: Ensure minimum 1 bathroom
  const isValid = state.bathrooms >= 1;
  const validationMessage = 
    state.bathrooms < 1 
      ? 'Please select at least 1 bathroom' 
      : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl shadow-md p-6 md:p-8 border border-slate-100"
    >
      {/* Header */}
      <div className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <BadgeCheck className="h-3.5 w-3.5" />
          {stepLabel}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Home details
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl">
            This helps us size the team, estimate timing and fine-tune your price instantly. You can adjust anything later.
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-10">
        {/* Bedrooms & Bathrooms */}
        <section aria-labelledby="home-size">
          <div className="mb-4 space-y-1">
            <h3 id="home-size" className="text-base font-semibold text-slate-900">
              Home size
            </h3>
            <p className="text-sm text-slate-500">
              Let us know how many rooms you’d like cleaned this visit.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
          {/* Bedrooms */}
          <div className="space-y-2">
            <Label htmlFor="bedrooms" className="text-sm font-semibold text-gray-900">
              Bedrooms
            </Label>
            <Select value={state.bedrooms.toString()} onValueChange={handleBedroomChange}>
              <SelectTrigger id="bedrooms" className="h-11">
                <SelectValue placeholder="Select bedrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Studio / 0 Bedrooms</SelectItem>
                <SelectItem value="1">1 Bedroom</SelectItem>
                <SelectItem value="2">2 Bedrooms</SelectItem>
                <SelectItem value="3">3 Bedrooms</SelectItem>
                <SelectItem value="4">4 Bedrooms</SelectItem>
                <SelectItem value="5">5+ Bedrooms</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bathrooms */}
          <div className="space-y-2">
            <Label htmlFor="bathrooms" className="text-sm font-semibold text-gray-900">
              Bathrooms
            </Label>
            <Select value={state.bathrooms.toString()} onValueChange={handleBathroomChange}>
              <SelectTrigger id="bathrooms" className="h-11">
                <SelectValue placeholder="Select bathrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Bathroom</SelectItem>
                <SelectItem value="2">2 Bathrooms</SelectItem>
                <SelectItem value="3">3 Bathrooms</SelectItem>
                <SelectItem value="4">4 Bathrooms</SelectItem>
                <SelectItem value="5">5+ Bathrooms</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
        </section>

        {/* Extras */}
        <section className="space-y-4" aria-labelledby="extra-services">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Label id="extra-services" className="text-base font-semibold text-gray-900">
                Extra services
              </Label>
              <p className="text-sm text-gray-600 mt-1 max-w-xl">
                Add-on tasks our clients book most often. We’ll build them into the time estimate and checklist.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Most popular add-ons highlighted
            </div>
          </div>
          
          <div 
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4"
            role="group"
            aria-label="Extra services"
          >
            {allowedExtras.map((extra) => {
              const isSelected = state.extras.includes(extra);
              const extraKey = extra as keyof typeof PRICING.extras;
              const IconComponent = EXTRA_ICONS[extraKey];
              const meta = extrasMeta[extraKey];
              const isRecommended = recommendedExtras.has(extraKey);
              const isQuantityExtra = quantityExtras.has(extraKey);
              const quantity = state.extrasQuantities[extra] ?? (isSelected ? DEFAULT_QUANTITY : 0);
              const unitPrice = PRICING.extras[extraKey];
              const totalPrice = unitPrice * Math.max(quantity || 0, 1);

              return (
                <motion.div
                  key={extra}
                  onClick={() => toggleExtra(extra)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleExtra(extra);
                    }
                  }}
                  tabIndex={0}
                  className={cn(
                    'group relative flex cursor-pointer flex-col items-center gap-4 rounded-2xl border px-4 py-6 text-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2 min-h-[170px]',
                    isSelected
                      ? 'border-primary/50 bg-gradient-to-br from-primary/10 via-white to-white shadow-lg shadow-primary/10 ring-2 ring-primary'
                      : 'border-slate-200 bg-white hover:border-primary/40 hover:shadow-md'
                  )}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-labelledby={`extra-${extra}-label`}
                >
                  <div
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-2xl border-2 bg-slate-50 text-gray-700 shadow-sm transition-all',
                      isSelected
                        ? 'border-primary/60 bg-gradient-to-br from-primary/10 to-transparent text-primary shadow-primary/20'
                        : 'border-slate-200 group-hover:border-primary/30 group-hover:text-primary group-hover:shadow-primary/20'
                    )}
                  >
                    {IconComponent ? (
                      <IconComponent className="h-7 w-7" />
                    ) : (
                      <div className="h-7 w-7 rounded-lg bg-gray-300" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div
                      id={`extra-${extra}-label`}
                      className={cn(
                        'text-sm font-semibold leading-snug',
                        isSelected ? 'text-primary' : 'text-gray-900'
                      )}
                    >
                      {extra}
                    </div>
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-600">
                      {isQuantityExtra ? `+R${unitPrice} each` : `+R${unitPrice}`}
                    </div>
                    {meta && (
                      <p className="text-xs leading-relaxed text-gray-500">
                        {meta.blurb}
                      </p>
                    )}
                  </div>

                  {isSelected && isQuantityExtra && (
                    <div className="mt-1 flex items-center gap-3 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          adjustQuantity(extra, -1);
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        aria-label={`Decrease ${extra} quantity`}
                      >
                        –
                      </button>
                      <span className="min-w-[1.5rem] text-center text-slate-900">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          adjustQuantity(extra, 1);
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        aria-label={`Increase ${extra} quantity`}
                      >
                        +
                      </button>
                    </div>
                  )}

                  {isSelected && (
                    <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {isQuantityExtra && quantity > 1 ? `Total +R${totalPrice}` : 'Added'}
                    </div>
                  )}

                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-sm"
                    >
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    </motion.div>
                  )}

                  {isRecommended && (
                    <span className="pointer-events-none absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border border-primary/20 bg-white px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      Popular
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Special Instructions */}
        <section className="space-y-3" aria-labelledby="special-instructions">
          <Label htmlFor="notes" className="text-sm font-semibold text-gray-900">
            Special Instructions
            <span className="text-gray-500 font-normal ml-2">(Optional)</span>
          </Label>
          <Textarea
            id="notes"
            placeholder="Example: focus on pet hair in lounge, bring eco products, gate code #4582"
            value={state.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={4}
            className="resize-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-xs text-slate-500">
            Sharing specifics helps us brief your cleaning team ahead of time.
          </p>
        </section>
      </div>

      {/* Navigation */}
      <div className="mt-8 space-y-4 border-t pt-6">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            size="lg" 
            className={cn(
              "rounded-full px-4 font-semibold text-slate-600 hover:text-primary",
              "focus:ring-2 focus:ring-primary/30 focus:outline-none",
              "transition-all duration-200 w-full sm:w-auto justify-center sm:justify-start"
            )}
            type="button"
          >
            Back to service
          </Button>
          <Button 
            onClick={handleNext} 
            size="lg" 
            disabled={!isValid}
            className={cn(
              "rounded-full px-8 py-3 font-semibold shadow-lg w-full sm:w-auto justify-center",
              isValid ? "bg-primary hover:bg-primary/90 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed",
              "focus:ring-2 focus:ring-primary/30 focus:outline-none",
              "transition-all duration-200"
            )}
            type="button"
          >
            Continue to schedule
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          You can always tweak these selections in the next steps before confirming your booking.
        </p>
      </div>

      {/* Validation Message */}
      {!isValid && validationMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {validationMessage}
        </motion.div>
      )}
    </motion.div>
  );
}

