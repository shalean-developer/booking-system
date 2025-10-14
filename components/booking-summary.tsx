'use client';

import { useBooking } from '@/lib/useBooking';
import { calcTotal, PRICING } from '@/lib/pricing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Calendar, MapPin, Clock, Home, Receipt } from 'lucide-react';
import { format } from 'date-fns';

export function BookingSummary() {
  const { state } = useBooking();

  const total = calcTotal({
    service: state.service,
    bedrooms: state.bedrooms,
    bathrooms: state.bathrooms,
    extras: state.extras,
  });

  const SummaryContent = () => (
    <div className="space-y-6">
      {/* Service */}
      {state.service && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Home className="h-4 w-4" />
            Service Type
          </h3>
          <Badge variant="secondary" className="text-sm">
            {state.service}
          </Badge>
        </div>
      )}

      {/* Home Details */}
      {(state.bedrooms > 0 || state.bathrooms > 0) && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Home Details</h3>
          <div className="space-y-1 text-sm text-slate-600">
            <p>{state.bedrooms} Bedroom{state.bedrooms !== 1 ? 's' : ''}</p>
            <p>{state.bathrooms} Bathroom{state.bathrooms !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* Extras */}
      {state.extras.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Extras</h3>
          <div className="space-y-1">
            {state.extras.map((extra) => (
              <div key={extra} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{extra}</span>
                <span className="font-medium text-slate-900">
                  R{PRICING.extras[extra as keyof typeof PRICING.extras]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date & Time */}
      {(state.date || state.time) && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Calendar className="h-4 w-4" />
            Schedule
          </h3>
          <div className="space-y-1 text-sm text-slate-600">
            {state.date && (
              <p className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {format(new Date(state.date), 'PPP')}
              </p>
            )}
            {state.time && (
              <p className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {state.time}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Address */}
      {state.address.line1 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <MapPin className="h-4 w-4" />
            Location
          </h3>
          <div className="text-sm text-slate-600">
            <p>{state.address.line1}</p>
            {state.address.suburb && <p>{state.address.suburb}</p>}
            {state.address.city && <p>{state.address.city}</p>}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-slate-600" />
            <span className="text-lg font-semibold text-slate-900">Total</span>
          </div>
          <span className="text-2xl font-bold text-primary">R{total}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">Estimated cost based on your selections</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: Sticky Card */}
      <Card className="sticky top-6 hidden border-0 shadow-lg lg:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SummaryContent />
        </CardContent>
      </Card>

      {/* Mobile: Sheet Trigger Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-4 shadow-lg lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-full" size="lg">
              View Summary · R{total}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Booking Summary</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <SummaryContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

