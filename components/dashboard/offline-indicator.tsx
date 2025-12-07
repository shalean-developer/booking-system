'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { useOffline } from '@/lib/hooks/use-offline';
import { toast } from 'sonner';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOffline({
    onOnline: () => {
      toast.success('Connection restored!', { duration: 3000 });
    },
    onOffline: () => {
      toast.info('You are offline. Some features may be limited.', { duration: 5000 });
    },
  });

  // Don't show indicator if always online
  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white py-2 px-4 shadow-lg"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff className="h-4 w-4" />
            <span>You're offline. Some features may be limited.</span>
          </div>
        </motion.div>
      )}
      {isOnline && wasOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-teal-500 text-white py-2 px-4 shadow-lg"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Wifi className="h-4 w-4" />
            <span>Connection restored!</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
