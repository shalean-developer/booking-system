'use client';

import { Fragment } from 'react';
import { X, Check, Home, Building, Star, Calendar } from 'lucide-react';
import type { ServiceType } from '@/types/booking';
import { cn } from '@/lib/utils';

const services: {
  type: ServiceType;
  label: string;
  checklist: string[];
  icon: typeof Home;
}[] = [
  {
    type: 'Standard',
    label: 'Standard Cleaning',
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
    checklist: [
      'Fresh linen change, beds styled and throw cushions fluffed',
      'Bathroom reset with hotel touches and toiletries replenished',
      'Kitchen tidied with dishes done and surfaces sanitised',
      'Amenities restocked and space lightly staged for arrivals',
    ],
    icon: Calendar,
  },
];

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService: ServiceType | null;
}

export function ChecklistModal({ isOpen, onClose, selectedService }: ChecklistModalProps) {
  const selectedServiceData = services.find(s => s.type === selectedService);
  const ServiceIcon = selectedServiceData?.icon;

  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out',
          'max-h-[85vh] overflow-y-auto'
        )}
      >
        {/* Handle */}
        <div className="sticky top-0 z-10 flex items-center justify-center bg-white pt-4 pb-2">
          <div className="h-1 w-12 rounded-full bg-slate-300" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-8">
          {selectedServiceData ? (
            <>
              {/* Header */}
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  {ServiceIcon && (
                    <ServiceIcon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedServiceData.label}
                  </h2>
                  <p className="text-sm text-slate-600">
                    What's included
                  </p>
                </div>
              </div>

              {/* Checklist */}
              <ul className="space-y-4">
                {selectedServiceData.checklist.map((item, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />
                    </div>
                    <span className="flex-1 text-base leading-relaxed text-slate-700">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="py-12 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Check className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-lg font-semibold text-slate-900">
                Select a service
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Choose a cleaning service to see what's included
              </p>
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
}

