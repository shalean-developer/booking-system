'use client';

import { useCallback, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Building,
  Star,
  Calendar,
  Check,
  BadgeCheck,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceType } from '@/types/booking';

const services: {
  type: ServiceType;
  label: string;
  subLabel: string;
  description: string;
  checklist: string[];
  badge?: 'Popular' | 'New';
  icon: LucideIcon;
}[] = [
  {
    type: 'Standard',
    label: 'Standard Cleaning',
    subLabel: 'Weekly or fortnightly upkeep',
    description: 'Kitchen, bathrooms, dusting, floors and tidy-up to keep your home guest ready.',
    badge: 'Popular',
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
    checklist: [
      'Fresh linen change, beds styled and throw cushions fluffed',
      'Bathroom reset with hotel touches and toiletries replenished',
      'Kitchen tidied with dishes done and surfaces sanitised',
      'Amenities restocked and space lightly staged for arrivals',
    ],
    icon: Calendar,
  },
];

interface StepServiceProps {
  selectedService: ServiceType | null;
  onSelect: (serviceType: ServiceType) => void;
  className?: string;
}

export function StepService({ selectedService, onSelect, className }: StepServiceProps) {
  const [hoveredService, setHoveredService] = useState<ServiceType | null>(null);
  const [pinnedService, setPinnedService] = useState<ServiceType | null>(null);

  const handleSelect = (serviceType: ServiceType) => {
    onSelect(serviceType);
  };

  const handleToggleChecklist = useCallback((serviceType: ServiceType) => {
    setPinnedService((current) => {
      if (current === serviceType) {
        setHoveredService((hovered) => (hovered === serviceType ? null : hovered));
        return null;
      }

      setHoveredService(serviceType);
      return serviceType;
    });
  }, []);

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-100 bg-white px-3.5 py-5 shadow-sm transition-all duration-300 ease-out md:px-5 md:py-7',
        className
      )}
    >
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900 md:text-xl">
            Choose your service
          </h2>
          <p className="max-w-2xl text-sm text-gray-600 md:text-base">
            Pick the service that matches your home today. You can adjust the finer details on the next step.
          </p>
        </div>

        <div
          className="grid gap-2.5 md:grid-cols-2 md:gap-3 xl:grid-cols-2"
          role="radiogroup"
          aria-label="Cleaning service type"
        >
          {services.map((service) => {
            const Icon = service.icon;
            const isSelected = selectedService === service.type;
            const isChecklistVisible = hoveredService === service.type || pinnedService === service.type;

            return (
              <button
                key={service.type}
                onClick={() => handleSelect(service.type)}
                type="button"
                className={cn(
                  'group relative flex h-full flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2',
                  isSelected && 'border-primary shadow-lg ring-2 ring-primary/20'
                )}
                role="radio"
                aria-checked={isSelected}
                aria-labelledby={`service-${service.type}-label`}
                onMouseEnter={() => setHoveredService(service.type)}
                onMouseLeave={() => {
                  if (pinnedService !== service.type) {
                    setHoveredService((current) => (current === service.type ? null : current));
                  }
                }}
                onFocus={() => setHoveredService(service.type)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null) && pinnedService !== service.type) {
                    setHoveredService((current) => (current === service.type ? null : current));
                  }
                }}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-primary/10',
                      isSelected && 'bg-primary/10'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-6 w-6 text-slate-600 transition-colors',
                        isSelected && 'text-primary'
                      )}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="flex items-start gap-1.5">
                    {service.badge && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                        <BadgeCheck className="h-3 w-3" />
                        {service.badge === 'Popular' ? 'Most Booked' : service.badge}
                      </span>
                    )}

                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${service.label} checklist`}
                      aria-expanded={isChecklistVisible}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border text-slate-500 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
                        isChecklistVisible
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-slate-200 bg-white hover:border-primary/30 hover:text-primary'
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleChecklist(service.type);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          handleToggleChecklist(service.type);
                        }
                      }}
                      onMouseEnter={() => setHoveredService(service.type)}
                      onMouseLeave={() => {
                        if (pinnedService !== service.type) {
                          setHoveredService((current) => (current === service.type ? null : current));
                        }
                      }}
                      onFocus={(event) => {
                        event.stopPropagation();
                        setHoveredService(service.type);
                      }}
                      onBlur={() => {
                        if (pinnedService !== service.type) {
                          setHoveredService((current) => (current === service.type ? null : current));
                        }
                      }}
                    >
                      <Info className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5" id={`service-${service.type}-label`}>
                  <div className="space-y-1">
                    <p
                      className={cn(
                        'text-sm font-semibold text-slate-900 md:text-base',
                        isSelected && 'text-primary'
                      )}
                    >
                      {service.label}
                    </p>
                    <p className="text-xs text-slate-500 md:text-sm">
                      {service.subLabel}
                    </p>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 md:text-sm">
                    {service.description}
                  </p>
                </div>

                {isChecklistVisible && (
                  <div className="mt-3 w-full rounded-xl border border-primary/20 bg-primary/5 p-3 text-left text-xs text-slate-600 shadow-sm backdrop-blur-sm md:text-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                      Checklist highlights
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {service.checklist.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] text-slate-500">
                      You can customise the full checklist on the next step.
                    </p>
                  </div>
                )}

                {isSelected && (
                  <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
