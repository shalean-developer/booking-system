'use client';

import { motion } from 'framer-motion';
import { ScheduleSection } from '@/components/admin/schedule-section';

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

