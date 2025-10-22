"use client";

import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileQuoteBarProps {
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  serviceId: string | null;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function MobileQuoteBar({ contact, serviceId, onSubmit, isSubmitting }: MobileQuoteBarProps) {
  const isFormValid = contact.firstName && contact.lastName && contact.email && contact.phone && serviceId;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">Custom Quote</div>
          <div className="text-xs text-gray-600">Personalized pricing</div>
        </div>
        <Button
          onClick={onSubmit}
          disabled={!isFormValid || isSubmitting}
          className="bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Confirm
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
