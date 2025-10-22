"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Refrigerator, Flame, Package, Wind, Paintbrush, Shirt, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Extra services with Lucide icons
const extrasList = [
  { id: 'Inside Fridge', label: 'Inside Fridge', icon: Refrigerator },
  { id: 'Inside Oven', label: 'Inside Oven', icon: Flame },
  { id: 'Inside Cabinets', label: 'Inside Cabinets', icon: Package },
  { id: 'Interior Windows', label: 'Interior Windows', icon: Wind },
  { id: 'Interior Walls', label: 'Interior Walls', icon: Paintbrush },
  { id: 'Ironing', label: 'Ironing', icon: Shirt },
  { id: 'Laundry', label: 'Laundry', icon: Plus },
];

interface ExtrasGridProps {
  selectedExtras: string[];
  toggleExtra: (extra: string) => void;
}

export function ExtrasGrid({ selectedExtras, toggleExtra }: ExtrasGridProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">4. Additional Services (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-4">
            {extrasList.map((ex) => {
              const isPressed = selectedExtras.includes(ex.id);
              const Icon = ex.icon;
              const labelWords = ex.label.split(' ');
              return (
                <button
                  key={ex.id}
                  aria-pressed={isPressed}
                  onClick={() => toggleExtra(ex.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    isPressed
                      ? 'bg-primary/5 shadow-md ring-2 ring-primary/40 border-primary'
                      : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${
                    isPressed ? 'bg-primary/10' : 'bg-gray-50'
                  }`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      isPressed ? 'text-primary' : 'text-gray-600'
                    }`} strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    {labelWords.map((word, index) => (
                      <div key={index} className="text-xs font-medium text-gray-700 leading-tight">
                        {word}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
