'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const CleanersSection = dynamic(
  () => import('@/components/admin/cleaners-section').then((mod) => ({ default: mod.CleanersSection })),
  {
    ssr: false,
    loading: () => <div className="py-12 text-center text-gray-500">Loading cleaners...</div>,
  }
);

export default function CleanersPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cleaners</h1>
        <p className="text-gray-600 mt-1">Manage cleaner profiles, availability, and schedules</p>
      </div>

      {/* Cleaners Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CleanersSection />
      </motion.div>
    </div>
  );
}

