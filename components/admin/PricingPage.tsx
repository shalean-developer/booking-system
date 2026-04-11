'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Tag, LayoutGrid, Gift } from 'lucide-react';
import { pricingStore } from './pricingStore';
import { stagger, fadeUp, InlineToast, type ToastState } from './pricing-shared';
import {
  ServicesSection,
  RulesSection,
  ExtrasSection,
  CleanerPricingSection,
  PromoCodesSection,
  BathroomsSection,
  ExtraRoomsSection,
  PriceCalculator,
} from './pricing-sections';

export function PricingPage() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [data, setData] = useState(() => pricingStore.getData());
  const handleToast = useCallback((t: ToastState) => {
    setToast(t);
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => pricingStore.subscribe(() => setData(pricingStore.getData())), []);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6 flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Pricing Management</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            <span>Control all service prices, extras, cleaner rates and promo codes dynamically</span>
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 sm:flex">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-xs font-bold text-green-700">Live — changes apply immediately</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4"
      >
        {[
          {
            label: 'Active Services',
            value: String(data.services.filter((s) => s.active !== false).length),
            color: '#4F46E5',
            bg: '#EEF2FF',
            icon: <Sparkles className="h-4 w-4" />,
          },
          {
            label: 'Active Extras',
            value: String(data.extras.filter((e) => e.active !== false).length),
            color: '#059669',
            bg: '#ECFDF5',
            icon: <Tag className="h-4 w-4" />,
          },
          {
            label: 'Extra Rooms',
            value: String(data.extraRooms.filter((r) => r.active !== false).length),
            color: '#7C3AED',
            bg: '#F5F3FF',
            icon: <LayoutGrid className="h-4 w-4" />,
          },
          {
            label: 'Active Promos',
            value: String(
              data.promoCodes.filter(
                (p) => p.active && (p.expiresAt === null || new Date(p.expiresAt) >= new Date())
              ).length
            ),
            color: '#BE185D',
            bg: '#FDF2F8',
            icon: <Gift className="h-4 w-4" />,
          },
        ].map((kpi) => (
          <motion.div
            key={kpi.label}
            variants={fadeUp}
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: kpi.bg, color: kpi.color }}
            >
              {kpi.icon}
            </div>
            <div>
              <p className="text-xl font-extrabold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-400">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="space-y-4 pb-8">
        <ServicesSection onToast={handleToast} />
        <RulesSection onToast={handleToast} />
        <BathroomsSection onToast={handleToast} />
        <ExtraRoomsSection onToast={handleToast} />
        <ExtrasSection onToast={handleToast} />
        <CleanerPricingSection onToast={handleToast} />
        <PromoCodesSection onToast={handleToast} />
        <PriceCalculator />
      </div>

      <AnimatePresence>
        {toast && <InlineToast key="toast" toast={toast} onDone={clearToast} />}
      </AnimatePresence>
    </div>
  );
}
