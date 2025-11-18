'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { isOnline } from '@/lib/fetch-utils';

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setOnline(isOnline());
    };

    // Check initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      <span>You are currently offline. Some features may not work.</span>
    </div>
  );
}

