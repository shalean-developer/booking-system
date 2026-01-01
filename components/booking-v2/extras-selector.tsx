'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EXTRA_ICONS } from '@/components/extra-service-icons';
import {
  fallbackAllExtrasList,
  fallbackQuantityExtras,
  DEFAULT_QUANTITY,
  MAX_QUANTITY,
  fallbackExtrasDisplayNames,
} from './booking-constants';

interface ExtrasSelectorProps {
  allowedExtras: string[];
  selectedExtras: string[];
  extrasQuantities: Record<string, number>;
  onToggleExtra: (extra: string) => void;
  onAdjustQuantity: (extra: string, delta: number) => void;
  extrasMeta?: Record<string, { blurb: string }>;
  extrasPrices?: Record<string, number>;
  loading?: boolean;
}

export function ExtrasSelector({
  allowedExtras,
  selectedExtras,
  extrasQuantities,
  onToggleExtra,
  onAdjustQuantity,
  extrasMeta = {},
  extrasPrices = {},
  loading = false,
}: ExtrasSelectorProps) {
  const quantityExtrasSet = new Set(fallbackQuantityExtras);
  
  if (loading) {
    return (
      <section className="space-y-4" aria-labelledby="extra-services">
        <h3 id="extra-services" className="text-base font-semibold text-gray-900">
          Extras
        </h3>
        <div className="grid grid-cols-3 gap-4 pb-2 md:grid-cols-6 md:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  return (
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
          const isSelected = selectedExtras.includes(extra);
          const extraKey = extra as keyof typeof EXTRA_ICONS;
          const IconComponent = EXTRA_ICONS[extraKey];
          const isQuantityExtra = quantityExtrasSet.has(extra);
          const quantity = extrasQuantities[extra] ?? (isSelected ? DEFAULT_QUANTITY : 0);

          return (
            <motion.div
              key={extra}
              onClick={() => onToggleExtra(extra)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onToggleExtra(extra);
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
                          const displayName = fallbackExtrasDisplayNames[extraKey] || extra;
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

              {/* Quantity Selector - Show as badge overlay on icon if selected and quantity extra */}
              {isSelected && isQuantityExtra && (
                <div className="absolute -top-1 -right-1 flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 shadow-md">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (quantity > DEFAULT_QUANTITY) {
                        onAdjustQuantity(extra, -1);
                      }
                    }}
                    onKeyDown={(event) => event.stopPropagation()}
                    disabled={quantity <= DEFAULT_QUANTITY}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-white transition-all",
                      quantity <= DEFAULT_QUANTITY
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-blue-700 active:scale-95"
                    )}
                    aria-label={`Decrease ${extra} quantity`}
                  >
                    <span className="text-xs font-semibold leading-none">−</span>
                  </button>
                  <span className="min-w-[1.25rem] text-center text-xs font-bold text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (quantity < MAX_QUANTITY) {
                        onAdjustQuantity(extra, 1);
                      }
                    }}
                    onKeyDown={(event) => event.stopPropagation()}
                    disabled={quantity >= MAX_QUANTITY}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-white transition-all",
                      quantity >= MAX_QUANTITY
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-blue-700 active:scale-95"
                    )}
                    aria-label={`Increase ${extra} quantity`}
                  >
                    <span className="text-xs font-semibold leading-none">+</span>
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

