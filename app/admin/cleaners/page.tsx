'use client';

import { motion } from 'framer-motion';
import { CleanersSection } from '@/components/admin/cleaners-section';

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

