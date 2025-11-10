'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const ApplicationsSection = dynamic(
  () => import('@/components/admin/applications-section').then((mod) => ({ default: mod.ApplicationsSection })),
  {
    ssr: false,
    loading: () => <div className="py-12 text-center text-gray-500">Loading applications...</div>,
  }
);

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-600 mt-1">Review and manage job applications from potential cleaners</p>
      </div>

      {/* Applications Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ApplicationsSection />
      </motion.div>
    </div>
  );
}

