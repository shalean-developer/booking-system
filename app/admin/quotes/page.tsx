'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const QuotesSection = dynamic(
  () => import('@/components/admin/quotes-section').then((mod) => ({ default: mod.QuotesSection })),
  {
    ssr: false,
    loading: () => <div className="py-12 text-center text-gray-500">Loading quotes...</div>,
  }
);

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
        <p className="text-gray-600 mt-1">View and manage all quote requests</p>
      </div>

      {/* Quotes Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <QuotesSection />
      </motion.div>
    </div>
  );
}

