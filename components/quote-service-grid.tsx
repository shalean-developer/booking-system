"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Home, Star, Building, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ServiceType } from '@/types/booking';

// Service options with Lucide icons
const serviceOptions = [
  {
    id: 'Standard' as ServiceType,
    label: 'Standard',
    subLabel: 'Cleaning',
    icon: Home,
    description: 'Regular home cleaning',
  },
  {
    id: 'Deep' as ServiceType,
    label: 'Deep',
    subLabel: 'Cleaning',
    icon: Star,
    description: 'Thorough deep cleaning',
  },
  {
    id: 'Move In/Out' as ServiceType,
    label: 'Moving',
    subLabel: 'Cleaning',
    icon: Building,
    description: 'Moving transition cleaning',
  },
  {
    id: 'Airbnb' as ServiceType,
    label: 'Airbnb',
    subLabel: 'Cleaning',
    icon: Calendar,
    description: 'Airbnb turnover cleaning',
  },
];

interface ServiceGridProps {
  selected: ServiceType | null;
  setSelected: (service: ServiceType) => void;
}

export function ServiceGrid({ selected, setSelected }: ServiceGridProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">2. Select Your Service</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {serviceOptions.map((s) => {
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
                  <div className="text-sm font-medium text-gray-800">{s.subLabel}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
