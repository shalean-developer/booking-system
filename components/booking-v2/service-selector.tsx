'use client';

import type { ServiceType } from '@/types/booking';
import type { LucideIcon } from 'lucide-react';
import { Check, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fallbackServices, iconMap } from './booking-constants';
import type { BookingFormService } from '@/lib/useBookingFormData';

interface ServiceSelectorProps {
  selectedService: ServiceType | null;
  onSelect: (serviceType: ServiceType) => void;
  services?: BookingFormService[];
  loading?: boolean;
}

export function ServiceSelector({ 
  selectedService, 
  onSelect, 
  services = fallbackServices,
  loading = false 
}: ServiceSelectorProps) {
  // Map icon names to components
  const getIconComponent = (iconName: string): LucideIcon => {
    return iconMap[iconName] || iconMap.Home;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 md:hidden overflow-x-auto pb-2 px-0">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[70px] flex-1 h-20 bg-slate-200 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="hidden md:grid md:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile: Banking App Style - Horizontal Row */}
      <div
        className="flex gap-2 md:hidden overflow-x-auto pb-2 px-0 scrollbar-hide"
        role="radiogroup"
        aria-label="Cleaning service type"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {services.map((service) => {
          const Icon = getIconComponent(service.icon);
          const isSelected = selectedService === service.type;

          return (
            <button
              key={service.type}
              onClick={() => onSelect(service.type)}
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
          const Icon = getIconComponent(service.icon);
          const isSelected = selectedService === service.type;

          return (
            <button
              key={service.type}
              onClick={() => onSelect(service.type)}
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
  );
}

