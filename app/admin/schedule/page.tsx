'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const ScheduleSection = dynamic(
  () => import('@/components/admin/schedule-section').then((mod) => ({ default: mod.ScheduleSection })),
  {
    ssr: false,
    loading: () => <div className="py-12 text-center text-gray-500">Loading schedule...</div>,
  }
);

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
        <p className="text-gray-600 mt-1">View and manage upcoming bookings by date</p>
      </div>

      {/* Schedule Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ScheduleSection />
      </motion.div>
    </div>
  );
}

