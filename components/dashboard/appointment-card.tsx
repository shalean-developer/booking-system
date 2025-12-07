'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, MapPin, X } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { CancelBookingModal } from './cancel-booking-modal';

interface AppointmentCardProps {
  id: string;
  date: string;
  time: string;
  serviceType: string;
  address: string;
  cleaner?: {
    name: string;
    photoUrl?: string | null;
  } | null;
  onReschedule?: () => void;
  onCancel?: () => void;
  onOptimisticCancel?: (bookingId: string) => void; // Callback for optimistic cancellation
}

export const AppointmentCard = memo(function AppointmentCard({ 
  id, 
  date, 
  time, 
  serviceType, 
  address, 
  cleaner,
  onReschedule,
  onCancel,
  onOptimisticCancel,
}: AppointmentCardProps) {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const bookingDate = new Date(date);
  const isToday = format(bookingDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isTomorrow = format(bookingDate, 'yyyy-MM-dd') === format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  let dateLabel = format(bookingDate, 'MMM d, yyyy');
  if (isToday) dateLabel = 'Today';
  if (isTomorrow) dateLabel = 'Tomorrow';

  const handleCancelSuccess = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="lg:hover:translate-x-1"
    >
      <Card className="bg-white border border-gray-100 lg:hover:shadow-md transition-all duration-300 overflow-hidden">
      <CardContent className="p-4 sm:p-6 min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 min-w-0">
          <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
            {/* Service Type & Date */}
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 mb-1 truncate">{serviceType}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 sm:gap-x-4">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base text-gray-600">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 flex-shrink-0" />
                  <span className="font-medium">{dateLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base text-gray-600">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 flex-shrink-0" />
                  <span>{time}</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base text-gray-600 min-w-0">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2 break-words">{address}</span>
            </div>

            {/* Cleaner Info */}
            {cleaner && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 min-w-0">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                  {cleaner.photoUrl && (
                    <AvatarImage src={cleaner.photoUrl} alt={cleaner.name} />
                  )}
                  <AvatarFallback className="bg-teal-100 text-teal-700 text-[10px] sm:text-xs">
                    {cleaner.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 truncate">{cleaner.name}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Assigned cleaner</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-row sm:flex-col lg:flex-row gap-2 flex-shrink-0">
            {onReschedule && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReschedule}
                className="text-xs sm:text-sm flex-1 sm:flex-none whitespace-nowrap h-9 sm:h-10 touch-manipulation"
                aria-label={`Reschedule ${serviceType} booking on ${dateLabel}`}
              >
                Reschedule
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="text-xs sm:text-sm flex-1 sm:flex-none whitespace-nowrap text-red-600 border-red-200 active:bg-red-50 h-9 sm:h-10 touch-manipulation"
              aria-label={`Cancel ${serviceType} booking on ${dateLabel}`}
            >
              <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 flex-shrink-0" aria-hidden="true" />
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs sm:text-sm flex-1 sm:flex-none h-9 sm:h-10 touch-manipulation"
              aria-label={`View details for ${serviceType} booking on ${dateLabel}`}
            >
              <Link href={`/dashboard/bookings/${id}`} className="text-center">View</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    
    <CancelBookingModal
      open={cancelModalOpen}
      onOpenChange={setCancelModalOpen}
      bookingId={id}
      bookingDate={date}
      serviceType={serviceType}
      onSuccess={handleCancelSuccess}
      onOptimisticUpdate={onOptimisticCancel}
    />
    </motion.div>
  );
});
