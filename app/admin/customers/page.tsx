'use client';

import { motion } from 'framer-motion';
import { CustomersSection } from '@/components/admin/customers-section';

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600 mt-1">View and manage customer accounts and booking history</p>
      </div>

      {/* Customers Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CustomersSection />
      </motion.div>
    </div>
  );
}

