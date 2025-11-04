'use client';

import { motion } from 'framer-motion';
import { QuotesSection } from '@/components/admin/quotes-section';

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

