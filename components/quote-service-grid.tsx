"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Star, Building, Calendar, LucideIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ServiceType } from '@/types/booking';

// Service type to Lucide icon mapping
const SERVICE_ICON_MAP: Record<string, LucideIcon> = {
  'Standard': Home,
  'Deep': Star,
  'Move In/Out': Building,
  'Airbnb': Calendar,
};

interface ServiceOption {
  id: ServiceType;
  label: string;
  subLabel: string;
  icon: LucideIcon;
  description: string;
}

interface ServiceGridProps {
  selected: ServiceType | null;
  setSelected: (service: ServiceType) => void;
}

interface ApiServiceResponse {
  id: ServiceType;
  label: string;
  subLabel?: string;
  description?: string;
}

export function ServiceGrid({ selected, setSelected }: ServiceGridProps) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch('/api/quote/services');
        const data = await response.json();

        if (data.ok) {
          const transformedServices: ServiceOption[] = (data.services as ApiServiceResponse[]).map((s) => ({
            id: s.id,
            label: s.label,
            subLabel: s.subLabel || '',
            icon: SERVICE_ICON_MAP[s.id] || Home,
            description: s.description || '',
          }));
          setServices(transformedServices);
        } else {
          setServices([]);
        }
      } catch (error) {
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchServices();
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="w-full max-w-[576px]"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">2. Select Your Service</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-gray-600">Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No services available</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {services.map((s) => {
                const isSelected = selected === s.id;
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelected(s.id)}
                    className={`rounded-xl p-4 sm:p-5 text-center cursor-pointer transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      isSelected
                        ? 'ring-2 ring-primary/60 bg-primary/5 border-2 border-primary'
                        : 'border-2 border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="text-sm font-medium text-gray-800">{s.label}</div>
                    {s.subLabel && (
                      <div className="text-xs text-gray-600 mt-0.5">{s.subLabel}</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
