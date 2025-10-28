'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function BookingFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-200 h-20 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Promotional Section - Left */}
          <div className="hidden md:flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-gray-900 whitespace-nowrap">
                Book regularly and save
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 bg-white hover:bg-gray-50 text-gray-900 font-medium h-7 text-xs px-3"
                onClick={() => {
                  // Can link to a loyalty/rewards page or show more info
                  console.log('Loyalty rewards clicked');
                }}
              >
                Learn More
              </Button>
            </div>
            <p className="text-[10px] text-gray-500 whitespace-nowrap">
              Terms and conditions apply
            </p>
          </div>

          {/* Copyright - Right */}
          <div className="flex items-center justify-end flex-shrink-0">
            <p className="text-sm text-gray-600">
              © 2025 Shalean (Pty) Ltd, all rights reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
