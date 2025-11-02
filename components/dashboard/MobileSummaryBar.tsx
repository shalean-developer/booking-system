/**
 * Sticky Mobile Summary Bar that minimizes on scroll
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';

export interface MobileSummaryBarProps {
  revenue: number;
  bookings: number;
  cleaners: number;
}

export function MobileSummaryBar({ revenue, bookings, cleaners }: MobileSummaryBarProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Minimize if scrolled down past 100px, expand if scrolled up
      if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setIsMinimized(true);
      } else if (currentScrollY < lastScrollY) {
        setIsMinimized(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Only show on mobile (below md breakpoint)
  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b shadow-sm">
        <motion.div
          animate={{ height: isMinimized ? '48px' : 'auto' }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: isMinimized ? 0 : 1 }}
              className="flex items-center justify-around px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Revenue</div>
                  <div className="font-semibold text-sm">{formatCurrency(revenue, false)}</div>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Bookings</div>
                  <div className="font-semibold text-sm">{bookings}</div>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Cleaners</div>
                  <div className="font-semibold text-sm">{cleaners}</div>
                </div>
              </div>
            </motion.div>
          )}
          {isMinimized && (
            <div className="flex items-center justify-center h-12">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          )}
        </motion.div>
      </div>
      {/* Spacer to prevent content from going under the fixed bar */}
      <div className="md:hidden h-[73px]" />
    </>
  );
}

