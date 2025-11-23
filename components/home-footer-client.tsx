'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import HomeFooter with SSR disabled to prevent hydration mismatch
const HomeFooter = dynamic(
  () => import('@/components/home-footer').then((mod) => ({ default: mod.HomeFooter })),
  { 
    ssr: false,
    loading: () => (
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-800 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400 text-center md:text-left">
                Copyright © Shalean Cleaning Services. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    )
  }
);

export function HomeFooterClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame to ensure this only runs on client
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  // Return a placeholder on server that matches the structure but without dynamic content
  // This prevents hydration mismatch
  if (!mounted) {
    return (
      <footer className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-800 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400 text-center md:text-left">
                Copyright © Shalean Cleaning Services. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="h-4 w-4" />
                  <span className="hidden sm:inline">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return <HomeFooter />;
}

