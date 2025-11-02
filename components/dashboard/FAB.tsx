/**
 * Floating Action Button with expandable menu
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, UserPlus, Download, FileText, X } from 'lucide-react';

export interface FABProps {
  onNewBooking?: () => void;
  onAssignCleaner?: () => void;
  onExportCSV?: () => void;
  onReviewApplications?: () => void;
}

export function FAB({
  onNewBooking,
  onAssignCleaner,
  onExportCSV,
  onReviewApplications,
}: FABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void | undefined) => {
    if (action) {
      action();
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Open quick actions menu"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="plus"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus className="h-6 w-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-2" 
        align="end" 
        side="top"
        sideOffset={12}
      >
        <div className="space-y-1">
          {onNewBooking && (
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleAction(onNewBooking)}
              aria-label="Create new booking"
            >
              <Calendar className="mr-2 h-4 w-4" />
              New Booking
            </Button>
          )}
          {onAssignCleaner && (
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleAction(onAssignCleaner)}
              aria-label="Assign cleaner to booking"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Cleaner
            </Button>
          )}
          {onExportCSV && (
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleAction(onExportCSV)}
              aria-label="Export CSV"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
          {onReviewApplications && (
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleAction(onReviewApplications)}
              aria-label="Review cleaner applications"
            >
              <FileText className="mr-2 h-4 w-4" />
              Review Applications
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

