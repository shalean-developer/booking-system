"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  FridgeIcon,
  OvenIcon,
  CabinetsIcon,
  WindowsIcon,
  WallsIcon,
  IroningIcon,
  LaundryIcon,
  EXTRA_ICONS,
} from '@/components/extra-service-icons';

interface ExtraService {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ExtrasGridProps {
  selectedExtras: string[];
  toggleExtra: (extra: string) => void;
}

interface ApiExtraResponse {
  id: string;
  label?: string;
}

export function ExtrasGrid({ selectedExtras, toggleExtra }: ExtrasGridProps) {
  const [extrasList, setExtrasList] = useState<ExtraService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchExtras() {
      try {
        const response = await fetch('/api/quote/services');
        const data = await response.json();

        if (data.ok) {
          // Deduplicate extras by id (case-insensitive, whitespace-normalized, safety check in case API returns duplicates)
          const seenIds = new Set<string>();
          const normalizedIds = new Set<string>();
          const uniqueExtras = (data.extras as ApiExtraResponse[]).filter((ex) => {
            const id = ex.id?.trim() || '';
            if (!id) return false;
            
            // Normalize: trim whitespace, convert to lowercase, and normalize multiple spaces
            const normalizedId = id.toLowerCase().replace(/\s+/g, ' ').trim();
            
            // Check both exact match and normalized match
            if (seenIds.has(id) || normalizedIds.has(normalizedId)) {
              return false;
            }
            
            seenIds.add(id);
            normalizedIds.add(normalizedId);
            return true;
          });

          // Filter out carpet cleaning (it's now a service, not an extra)
          const filteredExtras = uniqueExtras.filter((ex) => {
            const idLower = ex.id.toLowerCase();
            return !idLower.includes('carpet');
          });

          const transformedExtras: ExtraService[] = filteredExtras.map((ex) => {
            // Map database name to icon component
            let IconComponent = EXTRA_ICONS[ex.id as keyof typeof EXTRA_ICONS];
            
            // Handle variations and individual services
            if (!IconComponent) {
              const idLower = ex.id.toLowerCase();
              if (idLower.includes('laundry') && idLower.includes('ironing')) {
                IconComponent = EXTRA_ICONS['Laundry & Ironing'] || LaundryIcon;
              } else if (idLower.includes('ironing')) {
                IconComponent = IroningIcon;
              } else if (idLower.includes('laundry')) {
                IconComponent = LaundryIcon;
              } else if (idLower.includes('fridge')) {
                IconComponent = FridgeIcon;
              } else if (idLower.includes('oven')) {
                IconComponent = OvenIcon;
              } else if (idLower.includes('cabinet')) {
                IconComponent = CabinetsIcon;
              } else if (idLower.includes('window')) {
                IconComponent = WindowsIcon;
              } else if (idLower.includes('wall')) {
                IconComponent = WallsIcon;
              } else {
                // Try to find a partial match in EXTRA_ICONS
                const matchingKey = Object.keys(EXTRA_ICONS).find(key => 
                  key.toLowerCase().includes(idLower) || idLower.includes(key.toLowerCase())
                );
                if (matchingKey) {
                  IconComponent = EXTRA_ICONS[matchingKey as keyof typeof EXTRA_ICONS];
                } else {
                  // Default fallback
                  IconComponent = FridgeIcon;
                }
              }
            }
            
            return {
              id: ex.id.trim(),
              label: ex.label?.trim() || ex.id.trim(),
              icon: IconComponent,
            };
          });

          setExtrasList(transformedExtras);
        } else {
          setExtrasList([]);
        }
      } catch (error) {
        setExtrasList([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExtras();
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="w-full max-w-[576px]"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">4. Additional Services (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-gray-600">Loading extra services...</p>
            </div>
          ) : extrasList.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No extra services available</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
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
                      }`} />
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
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
