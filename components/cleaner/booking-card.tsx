'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle,
  PlayCircle,
  Star,
  Loader2,
  Navigation,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string | null;
  customer_name: string | null;
  customer_email?: string | null;
  customer_phone: string | null;
  address_line1: string | null;
  address_suburb: string | null;
  address_city: string | null;
  total_amount: number | null;
  cleaner_earnings: number | null;
  status: string;
  cleaner_claimed_at?: string | null;
  cleaner_accepted_at?: string | null;
  cleaner_on_my_way_at?: string | null;
  cleaner_started_at?: string | null;
  cleaner_completed_at?: string | null;
  customer_rating_id?: string | null;
  distance?: number | null;
  recurring_schedule_id?: string | null;
  recurring_schedule?: {
    id: string;
    frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'custom-weekly' | 'custom-bi-weekly';
    day_of_week?: number;
    day_of_month?: number;
    days_of_week?: number[];
    preferred_time: string;
    is_active: boolean;
    start_date: string;
    end_date?: string;
  } | null;
}

interface BookingCardProps {
  booking: Booking;
  variant: 'assigned' | 'available';
  onClaim?: (bookingId: string) => Promise<void>;
  onAccept?: (bookingId: string) => Promise<void>;  // NEW
  onOnMyWay?: (bookingId: string) => Promise<void>; // NEW
  onStart?: (bookingId: string) => Promise<void>;
  onComplete?: (bookingId: string) => Promise<void>;
  onViewDetails?: (booking: Booking) => void;
  onRate?: (booking: Booking) => void;
}

export function BookingCard({
  booking,
  variant,
  onClaim,
  onAccept,
  onOnMyWay,
  onStart,
  onComplete,
  onViewDetails,
  onRate,
}: BookingCardProps) {
  const [isActing, setIsActing] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5); // HH:MM
  };

  const formatAmount = (earnings: number | null) => {
    if (!earnings) return 'TBD';
    return `R${(earnings / 100).toFixed(2)}`;
  };

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            Accepted
          </Badge>
        );
      case 'on_my_way':
        return (
          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
            On My Way
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Completed
          </Badge>
        );
      default:
        return <Badge>{booking.status}</Badge>;
    }
  };

  const handleAction = async (action: () => Promise<void>) => {
    setIsActing(true);
    try {
      await action();
    } finally {
      setIsActing(false);
    }
  };

  const openMaps = () => {
    const address = [
      booking.address_line1,
      booking.address_suburb,
      booking.address_city,
    ]
      .filter(Boolean)
      .join(', ');
    
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const callCustomer = () => {
    if (booking.customer_phone) {
      window.location.href = `tel:${booking.customer_phone}`;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return 'Weekly';
      case 'bi-weekly':
        return 'Bi-weekly';
      case 'monthly':
        return 'Monthly';
      case 'custom-weekly':
        return 'Custom Weekly';
      case 'custom-bi-weekly':
        return 'Custom Bi-weekly';
      default:
        return 'Recurring';
    }
  };

  return (
    <Card className="overflow-hidden border-2 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-gray-900">
                {booking.service_type || 'Cleaning Service'}
              </h3>
              {getStatusBadge()}
              {booking.recurring_schedule && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                  <Repeat className="h-3 w-3" />
                  {getFrequencyLabel(booking.recurring_schedule.frequency)}
                </Badge>
              )}
            </div>
            {variant === 'assigned' && booking.customer_name && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <User className="h-3 w-3" />
                {booking.customer_name}
              </p>
            )}
          </div>
          {booking.cleaner_earnings && (
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                {formatAmount(booking.cleaner_earnings)}
              </div>
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{formatDate(booking.booking_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{formatTime(booking.booking_time)}</span>
          </div>
        </div>

        {/* Location */}
        {(booking.address_suburb || booking.address_city) && (
          <div className="flex items-start gap-2 mb-3 text-sm text-gray-700">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="flex-1">
              {[booking.address_suburb, booking.address_city]
                .filter(Boolean)
                .join(', ')}
            </span>
            {booking.distance !== undefined && booking.distance !== null && (
              <span className="text-xs text-gray-500">{booking.distance}km</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          {variant === 'available' && onClaim && (
            <Button
              onClick={() => handleAction(() => onClaim(booking.id))}
              disabled={isActing}
              className="flex-1 min-w-[120px] bg-primary hover:bg-primary/90"
              size="sm"
            >
              {isActing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                'Claim Job'
              )}
            </Button>
          )}

          {/* Accept Booking Button - for pending bookings */}
          {variant === 'assigned' && booking.status === 'pending' && onAccept && (
            <Button
              onClick={() => handleAction(() => onAccept(booking.id))}
              disabled={isActing}
              className="flex-1 min-w-[120px] bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              {isActing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Booking
                </>
              )}
            </Button>
          )}

          {/* On My Way Button - for accepted bookings */}
          {variant === 'assigned' && booking.status === 'accepted' && onOnMyWay && (
            <Button
              onClick={() => handleAction(() => onOnMyWay(booking.id))}
              disabled={isActing}
              className="flex-1 min-w-[110px] bg-indigo-600 hover:bg-indigo-700"
              size="sm"
            >
              {isActing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  On My Way
                </>
              )}
            </Button>
          )}

          {/* Start Job Button - only for on_my_way status */}
          {variant === 'assigned' && booking.status === 'on_my_way' && onStart && (
            <Button
              onClick={() => handleAction(() => onStart(booking.id))}
              disabled={isActing}
              className="flex-1 min-w-[100px] bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              {isActing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Job
                </>
              )}
            </Button>
          )}

          {/* Complete Button - only for in-progress status */}
          {variant === 'assigned' && booking.status === 'in-progress' && onComplete && (
            <Button
              onClick={() => handleAction(() => onComplete(booking.id))}
              disabled={isActing}
              className="flex-1 min-w-[100px] bg-green-600 hover:bg-green-700"
              size="sm"
            >
              {isActing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </>
              )}
            </Button>
          )}

          {/* Rate Customer Button - for completed bookings */}
          {variant === 'assigned' &&
            booking.status === 'completed' &&
            !booking.customer_rating_id &&
            onRate && (
              <Button
                onClick={() => onRate(booking)}
                variant="outline"
                className="flex-1 min-w-[100px] border-primary text-primary hover:bg-primary/10"
                size="sm"
              >
                <Star className="h-4 w-4 mr-2" />
                Rate Customer
              </Button>
            )}

          {/* Call & Maps buttons - always available for assigned bookings */}
          {variant === 'assigned' && (
            <>
              {booking.customer_phone && (
                <Button
                  onClick={callCustomer}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              {booking.address_line1 && (
                <Button
                  onClick={openMaps}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              )}
            </>
          )}

          {/* View Details - always available */}
          {onViewDetails && (
            <Button
              onClick={() => onViewDetails(booking)}
              variant="ghost"
              size="sm"
              className="flex-shrink-0"
            >
              Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

