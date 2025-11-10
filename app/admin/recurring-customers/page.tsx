'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const RecurringCustomersSection = dynamic(
  () => import('@/components/admin/recurring-customers-section').then((mod) => ({ default: mod.RecurringCustomersSection })),
  {
    ssr: false,
    loading: () => <div className="py-12 text-center text-gray-500">Loading recurring customers...</div>,
  }
);

export default function RecurringCustomersPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recurring Customers</h1>
        <p className="text-gray-600 mt-1">View customers with active recurring booking schedules</p>
      </div>

      {/* Recurring Customers Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <RecurringCustomersSection />
      </motion.div>
    </div>
  );
}







