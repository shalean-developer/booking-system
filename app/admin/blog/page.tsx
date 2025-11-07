'use client';

import { motion } from 'framer-motion';
import { BlogSection } from '@/components/admin/blog-section';

export default function BlogPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
        <p className="text-gray-600 mt-1">Manage your blog content</p>
      </div>

      {/* Blog Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <BlogSection />
      </motion.div>
    </div>
  );
}

