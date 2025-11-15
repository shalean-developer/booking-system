'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceType } from '@/types/booking';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { PRICING, generateTimeSlots } from '@/lib/pricing';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXTRA_ICONS } from '@/components/extra-service-icons';
import { serviceTypeToSlug } from '@/lib/booking-utils';
import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Building,
  Star,
  Calendar,
  BadgeCheck,
} from 'lucide-react';
import { SuburbModal } from '@/components/booking-v2/suburb-modal';
import { format, startOfToday, addDays, parseISO } from 'date-fns';

const services: {
  type: ServiceType;
  label: string;
  subLabel: string;
  description: string;
  checklist: string[];
  badge?: 'Popular' | 'New';
  icon: LucideIcon;
  image: string;
}[] = [
  {
    type: 'Standard',
    label: 'Standard Cleaning',
    subLabel: 'Weekly or fortnightly upkeep',
    description: 'Kitchen, bathrooms, dusting, floors and tidy-up to keep your home guest ready.',
    badge: 'Popular',
    image: '/images/service-standard-cleaning.jpg',
    checklist: [
      'Kitchen counters, stovetop and appliance fronts wiped',
      'Bathrooms sanitised and mirrors polished',
      'Dusting, vacuuming and mopping throughout the home',
      'Beds made plus general tidy of living spaces',
    ],
    icon: Home,
  },
  {
    type: 'Deep',
    label: 'Deep Cleaning',
    subLabel: 'Once-off refresh',
    description: 'Inside appliances, grout scrub and detailed wipe-downs for seasonal or post-event resets.',
    image: '/images/service-deep-cleaning.jpg',
    checklist: [
      'Inside oven, fridge and cupboards detailed clean',
      'Tile grout, taps and bathroom fittings scrubbed',
      'Baseboards, skirting and door frames wiped down',
      'Built-up grime and limescale treated throughout',
    ],
    icon: Star,
  },
  {
    type: 'Move In/Out',
    label: 'Move In / Out',
    subLabel: 'Make moving day easier',
    description: 'Full top-to-bottom clean including cupboards and surfaces so you can hand over with confidence.',
    image: '/images/move-turnover.jpg',
    checklist: [
      'Cabinets, shelves and wardrobes cleaned inside',
      'Appliances deep cleaned and polished ready for handover',
      'Walls, switches and skirting wiped for scuff marks',
      'Floors vacuumed and mopped in every room',
    ],
    icon: Building,
  },
  {
    type: 'Airbnb',
    label: 'Airbnb Cleaning',
    subLabel: 'For short-term rentals',
    description: 'Quick turnarounds with linen change, staging touches and supply restock between guests.',
    image: '/images/service-airbnb-cleaning.jpg',
    checklist: [
      'Fresh linen change, beds styled and throw cushions fluffed',
      'Bathroom reset with hotel touches and toiletries replenished',
      'Kitchen tidied with dishes done and surfaces sanitised',
      'Amenities restocked and space lightly staged for arrivals',
    ],
    icon: Calendar,
  },
];

const allExtrasList = Object.keys(PRICING.extras) as Array<keyof typeof PRICING.extras>;
const standardAndAirbnbExtras: Array<keyof typeof PRICING.extras> = [
  'Inside Fridge',
  'Inside Oven',
  'Laundry & Ironing',
  'Interior Walls',
  'Interior Windows',
  'Inside Cabinets',
];
const deepAndMoveExtras = allExtrasList.filter(
  (extra) => !standardAndAirbnbExtras.includes(extra)
);
const quantityExtras = new Set<keyof typeof PRICING.extras>([
  'Carpet Cleaning',
  'Couch Cleaning',
  'Ceiling Cleaning',
]);
const DEFAULT_QUANTITY = 1;
const MAX_QUANTITY = 5;

// Display name mapping for extras
const extrasDisplayNames: Partial<Record<keyof typeof PRICING.extras, string>> = {
  'Outside Window Cleaning': 'Exterior Windows',
};

const extrasMeta: Record<keyof typeof PRICING.extras, { blurb: string }> = {
  'Inside Fridge': { blurb: 'Wipe shelves, trays and seals' },
  'Inside Oven': { blurb: 'Remove grease and baked-on mess' },
  'Inside Cabinets': { blurb: 'Empty, dust and reset cupboards' },
  'Interior Windows': { blurb: 'Inside glass, tracks and frames' },
  'Interior Walls': { blurb: 'Spot-clean scuffs and marks' },
  'Laundry & Ironing': { blurb: 'Wash, dry, fold and press 10–15 garments per visit' },
  'Carpet Cleaning': { blurb: 'Deep clean high-traffic carpet zones' },
  'Ceiling Cleaning': { blurb: 'Remove cobwebs and ceiling dust build-up' },
  'Garage Cleaning': { blurb: 'Sweep, dust and organise your garage floor' },
  'Balcony Cleaning': { blurb: 'Wash floors, railings and outdoor furniture' },
  'Couch Cleaning': { blurb: 'Refresh upholstery with fabric-safe cleaner' },
  'Outside Window Cleaning': { blurb: 'Exterior glass and frames washed' },
};

export function StepServiceDetails() {
  const router = useRouter();
  const { state, updateField } = useBookingV2();
  const { getDetailsPath, getSchedulePath } = useBookingPath();
  const [isSuburbModalOpen, setIsSuburbModalOpen] = useState(false);

  const handleServiceSelect = useCallback((serviceType: ServiceType) => {
    updateField('service', serviceType);
    // Update URL to include slug when service is selected
    const slug = serviceTypeToSlug(serviceType);
    const detailsPath = getDetailsPath(serviceType);
    router.push(detailsPath);
  }, [updateField, router, getDetailsPath]);

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
    if (!state.service) return;
    
    // Migrate old "Laundry" and "Ironing" to "Laundry & Ironing"
    const hasLaundry = state.extras.includes('Laundry');
    const hasIroning = state.extras.includes('Ironing');
    const hasLaundryIroning = state.extras.includes('Laundry & Ironing');
    
    let updatedExtras = [...state.extras];
    let updatedQuantities = { ...state.extrasQuantities };
    let needsUpdate = false;
    
    // If user has either Laundry or Ironing (but not the combined), migrate to combined
    if ((hasLaundry || hasIroning) && !hasLaundryIroning) {
      // Remove old extras
      updatedExtras = updatedExtras.filter(extra => extra !== 'Laundry' && extra !== 'Ironing');
      // Add combined extra
      if (!updatedExtras.includes('Laundry & Ironing')) {
        updatedExtras.push('Laundry & Ironing');
      }
      // Combine quantities (if both existed, take the max, otherwise use the one that exists)
      const laundryQty = state.extrasQuantities?.['Laundry'] ?? 1;
      const ironingQty = state.extrasQuantities?.['Ironing'] ?? 1;
      updatedQuantities['Laundry & Ironing'] = Math.max(laundryQty, ironingQty);
      // Remove old quantity entries
      delete updatedQuantities['Laundry'];
      delete updatedQuantities['Ironing'];
      needsUpdate = true;
    } else if ((hasLaundry || hasIroning) && hasLaundryIroning) {
      // If user has both old and new, remove old ones
      updatedExtras = updatedExtras.filter(extra => extra !== 'Laundry' && extra !== 'Ironing');
      delete updatedQuantities['Laundry'];
      delete updatedQuantities['Ironing'];
      needsUpdate = true;
    }
    
    const allowedSet = new Set(allowedExtras);
    const filteredExtras = updatedExtras.filter((extra) => allowedSet.has(extra as keyof typeof PRICING.extras));
    if (filteredExtras.length !== updatedExtras.length || needsUpdate) {
      updateField('extras', filteredExtras);
    }

    const filteredQuantities = Object.entries(updatedQuantities).reduce<Record<string, number>>((acc, [extra, qty]) => {
      if (allowedSet.has(extra as keyof typeof PRICING.extras) && filteredExtras.includes(extra)) {
        acc[extra] = qty;
      }
      return acc;
    }, {});

    if (Object.keys(filteredQuantities).length !== Object.keys(updatedQuantities).length || needsUpdate) {
      updateField('extrasQuantities', filteredQuantities);
    }
  }, [allowedExtras, state.service, state.extras, state.extrasQuantities, updateField]);

  useEffect(() => {
    if (!state.service) return;
    
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
  }, [state.service, state.extras, state.extrasQuantities, updateField]);

  const handleNext = useCallback(() => {
    if (!state.service || state.bathrooms < 1 || !state.date || !state.time) return;
    // Open suburb modal instead of navigating directly
    setIsSuburbModalOpen(true);
  }, [state.service, state.bathrooms, state.date, state.time]);

  const handleSuburbSubmit = useCallback((suburb: string) => {
    // Update suburb in state
    updateField('address', {
      ...state.address,
      suburb: suburb,
    });
    // Close modal
    setIsSuburbModalOpen(false);
    // Navigate to schedule page
    if (state.service) {
      router.push(getSchedulePath(state.service));
    }
  }, [state.address, state.service, updateField, router, getSchedulePath]);

  const handleBedroomChange = useCallback((value: string) => {
    const newValue = parseInt(value);
    updateField('bedrooms', newValue);
  }, [updateField]);

  const handleBathroomChange = useCallback((value: string) => {
    const newValue = parseInt(value);
    updateField('bathrooms', newValue);
  }, [updateField]);

  // Date and time handlers
  const handleDateChange = useCallback((value: string) => {
    updateField('date', value);
    // Clear time if date changes to today and current time is in the past
    if (value === format(startOfToday(), 'yyyy-MM-dd') && state.time) {
      const now = new Date();
      const [hours, minutes] = state.time.split(':').map(Number);
      const selectedTime = new Date();
      selectedTime.setHours(hours, minutes, 0, 0);
      if (selectedTime < now) {
        updateField('time', '');
      }
    }
  }, [updateField, state.time]);

  const handleTimeChange = useCallback((value: string) => {
    updateField('time', value);
  }, [updateField]);

  // Generate date options (90 days)
  const dateOptions = useMemo(() => {
    const today = startOfToday();
    const options: { value: string; label: string }[] = [];
    
    for (let i = 0; i < 90; i++) {
      const date = addDays(today, i);
      const dateValue = format(date, 'yyyy-MM-dd');
      
      let label: string;
      if (i === 0) {
        label = 'Today';
      } else if (i === 1) {
        label = 'Tomorrow';
      } else if (i === 2) {
        label = 'Day after tomorrow';
      } else {
        label = format(date, 'MMM d, yyyy');
      }
      
      options.push({ value: dateValue, label });
    }
    
    return options;
  }, []);

  // Generate time options with filtering
  const timeOptions = useMemo(() => {
    const allSlots = generateTimeSlots();
    const selectedDate = state.date ? format(parseISO(state.date), 'yyyy-MM-dd') : null;
    const today = format(startOfToday(), 'yyyy-MM-dd');
    
    // Filter past times only if today is selected
    if (selectedDate === today) {
      const now = new Date();
      return allSlots.filter((time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(hours, minutes, 0, 0);
        return slotTime >= now;
      });
    }
    
    return allSlots;
  }, [state.date]);

  const toggleExtra = useCallback((extra: string) => {
    const isCurrentlySelected = state.extras.includes(extra);

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

  const isValid = state.service !== null && state.bathrooms >= 1 && !!state.date && !!state.time;
  const validationMessage = 
    !state.service
      ? 'Please select a service type'
      : state.bathrooms < 1 
      ? 'Please select at least 1 bathroom'
      : !state.date
      ? 'Please select a date'
      : !state.time
      ? 'Please select a time'
      : '';

  return (
    <div className="space-y-8 w-full md:max-w-[586px] md:mx-auto">
      {/* Service Selection Section */}
      <div className="space-y-4">
        {/* Mobile: Banking App Style - Horizontal Row */}
        <div
          className="flex gap-2 md:hidden overflow-x-auto pb-2 px-0 scrollbar-hide"
          role="radiogroup"
          aria-label="Cleaning service type"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {services.map((service) => {
            const Icon = service.icon;
            const isSelected = state.service === service.type;

            return (
              <button
                key={service.type}
                onClick={() => handleServiceSelect(service.type)}
                type="button"
                className={cn(
                  'group relative flex flex-col items-center justify-center gap-2 rounded-lg border bg-white p-3 min-w-[70px] flex-1 text-center transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1',
                  isSelected 
                    ? 'border-primary' 
                    : 'border-slate-200'
                )}
                role="radio"
                aria-checked={isSelected}
                aria-labelledby={`service-${service.type}-label`}
              >
                <Icon
                  className={cn(
                    'h-6 w-6 transition-colors',
                    isSelected ? 'text-primary' : 'text-slate-600'
                  )}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <div id={`service-${service.type}-label`}>
                  <p
                    className={cn(
                      'text-[10px] font-medium transition-colors leading-tight',
                      isSelected ? 'text-primary' : 'text-slate-700'
                    )}
                  >
                    {service.label}
                  </p>
                </div>
                {isSelected && (
                  <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop: Grid Style */}
        <div
          className="hidden md:grid md:grid-cols-4 gap-2"
          role="radiogroup"
          aria-label="Cleaning service type"
        >
          {services.map((service) => {
            const Icon = service.icon;
            const isSelected = state.service === service.type;

            return (
              <button
                key={service.type}
                onClick={() => handleServiceSelect(service.type)}
                type="button"
                className={cn(
                  'group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 bg-white p-3 text-center transition-all duration-300',
                  'focus:outline-none focus:ring-4 focus:ring-primary/20 focus:ring-offset-2',
                  isSelected 
                    ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20' 
                    : 'border-slate-200 hover:border-primary/40 hover:shadow-sm'
                )}
                role="radio"
                aria-checked={isSelected}
                aria-labelledby={`service-${service.type}-label-desktop`}
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300',
                    isSelected 
                      ? 'bg-primary/10 scale-110' 
                      : 'bg-slate-50 group-hover:bg-primary/5 group-hover:scale-105'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-6 w-6 transition-colors duration-300',
                      isSelected ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
                    )}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>
                <div className="space-y-1" id={`service-${service.type}-label-desktop`}>
                  <p
                    className={cn(
                      'text-xs font-semibold transition-colors duration-300 leading-tight',
                      isSelected ? 'text-primary' : 'text-slate-900 group-hover:text-primary'
                    )}
                  >
                    {service.label}
                  </p>
                </div>
                {service.badge && !isSelected && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold shadow-sm">
                    <BadgeCheck className="h-3 w-3" />
                  </span>
                )}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Details Form Section - Only show when service is selected */}
      {state.service && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-2xl shadow-md p-4 md:p-6 border border-slate-100 mx-0 md:mx-0"
        >
          <div className="space-y-10">
            <section aria-labelledby="home-size">
              <h3 id="home-size" className="text-base font-semibold text-slate-900 mb-4">
                House details
              </h3>
              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms" className="text-sm font-semibold text-gray-900">
                    Bedrooms
                  </Label>
                  <Select value={state.bedrooms.toString()} onValueChange={handleBedroomChange}>
                    <SelectTrigger id="bedrooms" className="h-11">
                      <SelectValue placeholder="" />
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

                <div className="space-y-2">
                  <Label htmlFor="bathrooms" className="text-sm font-semibold text-gray-900">
                    Bathrooms
                  </Label>
                  <Select value={state.bathrooms.toString()} onValueChange={handleBathroomChange}>
                    <SelectTrigger id="bathrooms" className="h-11">
                      <SelectValue placeholder="" />
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

            <section className="space-y-4" aria-labelledby="extra-services">
              <h3 id="extra-services" className="text-base font-semibold text-gray-900">
                Extras
              </h3>
              <div 
                className="grid grid-cols-3 gap-4 pb-2 md:grid-cols-6 md:gap-5"
                role="group"
                aria-label="Extra services"
              >
                {allowedExtras.map((extra) => {
                  const isSelected = state.extras.includes(extra);
                  const extraKey = extra as keyof typeof PRICING.extras;
                  const IconComponent = EXTRA_ICONS[extraKey];
                  const isQuantityExtra = quantityExtras.has(extraKey);
                  const quantity = state.extrasQuantities[extra] ?? (isSelected ? DEFAULT_QUANTITY : 0);

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
                        'group relative flex flex-col items-center gap-2 p-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:ring-offset-2 rounded-lg cursor-pointer',
                        'transition-all duration-200',
                        'w-full',
                        isSelected
                          ? 'bg-blue-50/50'
                          : 'bg-transparent'
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-labelledby={`extra-${extra}-label`}
                    >
                      {/* Circular Icon Container */}
                      <div
                        className={cn(
                          'flex h-14 w-14 items-center justify-center rounded-full border transition-all flex-shrink-0',
                          isSelected
                            ? 'border-transparent bg-white'
                            : 'border-blue-300 bg-white group-hover:border-blue-400'
                        )}
                      >
                        {IconComponent ? (
                          <IconComponent 
                            className={cn(
                              'h-6 w-6 transition-colors',
                              isSelected ? 'text-blue-600' : 'text-blue-500'
                            )} 
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-blue-200" />
                        )}
                      </div>

                      {/* Label */}
                      <div
                        id={`extra-${extra}-label`}
                        className="text-xs font-normal text-gray-700 text-center leading-tight"
                      >
                        {(() => {
                          const displayName = extrasDisplayNames[extraKey] || extra;
                          return displayName.includes(' & ') ? (
                            <>
                              <span className="block">{displayName.split(' & ')[0]} &</span>
                              <span className="block">{displayName.split(' & ')[1]}</span>
                            </>
                          ) : (
                            displayName.split(' ').map((word, idx) => (
                              <span key={idx} className="block">{word}</span>
                            ))
                          );
                        })()}
                      </div>

                      {/* Quantity Selector - Show below if selected and quantity extra */}
                      {isSelected && isQuantityExtra && (
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              adjustQuantity(extra, -1);
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400/30"
                            aria-label={`Decrease ${extra} quantity`}
                          >
                            <span className="text-base font-normal leading-none">−</span>
                          </button>
                          <span className="min-w-[1.5rem] text-center text-sm font-bold text-gray-900">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              adjustQuantity(extra, 1);
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400/30"
                            aria-label={`Increase ${extra} quantity`}
                          >
                            <span className="text-base font-normal leading-none">+</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Date and Time Selection */}
            <section className="space-y-4" aria-labelledby="schedule-selection">
              <h3 id="schedule-selection" className="text-base font-semibold text-gray-900">
                Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-select" className="text-sm font-semibold text-gray-900">
                    Which day would you like us to come?
                  </Label>
                  <Select value={state.date || ''} onValueChange={handleDateChange}>
                    <SelectTrigger id="date-select" className="h-11">
                      <SelectValue placeholder="Select a date" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-select" className="text-sm font-semibold text-gray-900">
                    What time would you like us to arrive?
                  </Label>
                  <Select 
                    value={state.time || ''} 
                    onValueChange={handleTimeChange}
                    disabled={!state.date}
                  >
                    <SelectTrigger id="time-select" className="h-11">
                      <SelectValue placeholder={state.date ? "Select a time" : "Select date first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.length > 0 ? (
                        timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-gray-500 text-center">
                          No available times for selected date
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-3" aria-labelledby="special-instructions">
              <h3 id="special-instructions" className="text-base font-semibold text-gray-900">
                Special Instructions
              </h3>
              <Textarea
                id="notes"
                placeholder="Add your notes here......"
                value={state.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={4}
                className="resize-none focus:ring-2 focus:ring-primary/30 bg-blue-50/50"
              />
            </section>
          </div>

          <div className="mt-8 space-y-4 border-t pt-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
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
                Continue
              </Button>
            </div>
          </div>

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
      )}

      {/* Suburb Modal */}
      <SuburbModal
        open={isSuburbModalOpen}
        onClose={() => setIsSuburbModalOpen(false)}
        onSubmit={handleSuburbSubmit}
        currentSuburb={state.address.suburb}
      />
    </div>
  );
}

