'use client';

import { Calendar, Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ServiceFrequencyCardSelectorProps {
  value: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' | null;
  onChange: (value: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly') => void;
}

export function ServiceFrequencyCardSelector({ value, onChange }: ServiceFrequencyCardSelectorProps) {
  const isOneTime = value === 'one-time';
  const isRepeat = value === 'weekly' || value === 'bi-weekly' || value === 'monthly';

  return (
    <div className="space-y-6">
      {/* Main Question */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
          How often do you need help?
        </h2>
        <p className="text-base md:text-lg text-gray-700">
          How often do you need the service?
        </p>
      </div>

      {/* Cards Container */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
        {/* One Time Card */}
        <motion.button
          type="button"
          onClick={() => onChange('one-time')}
          className={cn(
            'w-full sm:w-auto min-w-[280px] bg-white rounded-xl shadow-md p-6',
            'border-2 transition-all duration-200',
            'hover:shadow-lg hover:scale-[1.02]',
            'focus:outline-none focus:ring-2 focus:ring-primary/30',
            isOneTime
              ? 'border-primary bg-primary/5 shadow-lg'
              : 'border-gray-200 hover:border-primary/50'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex flex-col space-y-3">
            {/* Icon and Title Row */}
            <div className="flex items-center gap-4">
              {/* Icon with overlay */}
              <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-10 h-10 text-gray-400" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                  <Plus className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900">
                One Time
              </h3>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600">
              For once-off services that will not repeat.
            </p>
          </div>
        </motion.button>

        {/* Repeat Card */}
        <motion.button
          type="button"
          onClick={() => onChange('weekly')}
          className={cn(
            'w-full sm:w-auto min-w-[280px] bg-white rounded-xl shadow-md p-6',
            'border-2 transition-all duration-200',
            'hover:shadow-lg hover:scale-[1.02]',
            'focus:outline-none focus:ring-2 focus:ring-primary/30',
            isRepeat
              ? 'border-primary bg-primary/5 shadow-lg'
              : 'border-gray-200 hover:border-primary/50'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex flex-col space-y-3">
            {/* Icon and Title Row */}
            <div className="flex items-center gap-4">
              {/* Icon with overlay */}
              <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-10 h-10 text-gray-400" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                  <RefreshCw className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900">
                Repeat
              </h3>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600">
              For repeat services every few days / weeks.
            </p>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
