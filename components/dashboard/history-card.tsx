'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, MapPin, Star, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface HistoryCardProps {
  id: string;
  date: string;
  time: string;
  serviceType: string;
  address: string;
  amount: number;
  cleaner?: {
    name: string;
    photoUrl?: string | null;
  } | null;
  notes?: string | null;
  rating?: number | null;
  photos?: string[];
  cleanerId?: string;
  customerReviewed?: boolean;
  onReviewSubmitted?: () => void;
}

export function HistoryCard({
  id,
  date,
  time,
  serviceType,
  address,
  amount,
  cleaner,
  notes,
  rating,
  photos = [],
  cleanerId,
  customerReviewed = false,
  onReviewSubmitted,
}: HistoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const bookingDate = new Date(date);
  
  // Parse address for review dialog
  const addressParts = address.split(', ');
  const addressLine1 = addressParts[0] || '';
  const addressSuburb = addressParts[1] || '';
  const addressCity = addressParts[2] || '';

  const handleReviewSuccess = () => {
    setReviewDialogOpen(false);
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
  };

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 mb-1 truncate">{serviceType}</h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm lg:text-base text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 flex-shrink-0" />
                  <span className="font-medium">{format(bookingDate, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 flex-shrink-0" />
                  <span>{time}</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900">R{(amount / 100).toFixed(2)}</p>
              {rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm lg:text-base text-gray-600">{rating.toFixed(1)}</span>
                </div>
              )}
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
                <p className="text-[10px] sm:text-xs text-gray-500">Cleaner</p>
              </div>
            </div>
          )}

          {/* Expandable Content */}
          {(notes || photos.length > 0) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full justify-between text-xs sm:text-sm text-teal-600 hover:text-teal-700 h-9 sm:h-10"
                aria-label={expanded ? 'Hide booking details' : 'Show booking details'}
                aria-expanded={expanded}
              >
                <span>{expanded ? 'Show less' : 'Show details'}</span>
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                )}
              </Button>

              {expanded && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  {notes && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm lg:text-base text-gray-700 bg-teal-50/50 p-3 rounded-lg">
                    <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                    <p className="flex-1">{notes}</p>
                  </div>
                  )}

                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {photos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                        >
                          <img
                            src={photo}
                            alt={`Service photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
      
      {/* Review Dialog */}
      <CustomerReviewDialog
        booking={{
          id,
          booking_date: date,
          booking_time: time,
          service_type: serviceType,
          address_line1: addressLine1,
          address_suburb: addressSuburb,
          cleaner_id: cleanerId || null,
        }}
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        onSuccess={handleReviewSuccess}
      />
    </Card>
  );
}
