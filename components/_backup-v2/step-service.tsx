'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Building,
  Star,
  Calendar,
  Check,
  BadgeCheck,
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

interface StepServiceProps {
  selectedService: ServiceType | null;
  onSelect: (serviceType: ServiceType) => void;
  className?: string;
}

export function StepService({ selectedService, onSelect, className }: StepServiceProps) {
  const handleSelect = (serviceType: ServiceType) => {
    onSelect(serviceType);
  };

  return (
    <div
      className={cn(
        'w-full',
        className
      )}
    >
      {/* Mobile: Banking App Style - Horizontal Row */}
      <div
        className="flex gap-2 md:hidden overflow-x-auto pb-2 -mx-2 px-2"
        role="radiogroup"
        aria-label="Cleaning service type"
      >
        {services.map((service) => {
          const Icon = service.icon;
          const isSelected = selectedService === service.type;

          return (
            <button
              key={service.type}
              onClick={() => handleSelect(service.type)}
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
              {/* Outlined Icon - No Background */}
              <Icon
                className={cn(
                  'h-6 w-6 transition-colors',
                  isSelected ? 'text-primary' : 'text-slate-600'
                )}
                strokeWidth={1.5}
                aria-hidden="true"
              />

              {/* Service Name */}
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

              {/* Selected Indicator - Small Dot */}
              {isSelected && (
                <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop: Original Grid Style */}
      <div
        className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-3"
        role="radiogroup"
        aria-label="Cleaning service type"
      >
        {services.map((service) => {
          const Icon = service.icon;
          const isSelected = selectedService === service.type;

          return (
            <button
              key={service.type}
              onClick={() => handleSelect(service.type)}
              type="button"
              className={cn(
                'group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 bg-white p-4 text-center transition-all duration-300',
                'focus:outline-none focus:ring-4 focus:ring-primary/20 focus:ring-offset-2',
                isSelected 
                  ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20' 
                  : 'border-slate-200 hover:border-primary/40 hover:shadow-sm'
              )}
              role="radio"
              aria-checked={isSelected}
              aria-labelledby={`service-${service.type}-label-desktop`}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300',
                  isSelected 
                    ? 'bg-primary/10 scale-110' 
                    : 'bg-slate-50 group-hover:bg-primary/5 group-hover:scale-105'
                )}
              >
                <Icon
                  className={cn(
                    'h-7 w-7 transition-colors duration-300',
                    isSelected ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
                  )}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>

              {/* Service Name */}
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

              {/* Badge */}
              {service.badge && !isSelected && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold shadow-sm">
                  <BadgeCheck className="h-3 w-3" />
                </span>
              )}

              {/* Selected Checkmark */}
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
  );
}
