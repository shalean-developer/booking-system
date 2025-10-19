'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  DollarSign,
  Package,
  FileText,
  Navigation,
} from 'lucide-react';

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
}

interface BookingDetailsModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
}: BookingDetailsModalProps) {
  if (!booking) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5); // HH:MM
  };

  const formatDateTime = (dateTimeStr: string | null) => {
    if (!dateTimeStr) return 'N/A';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (earnings: number | null) => {
    if (!earnings) return 'TBD';
    return `R${(earnings / 100).toFixed(2)}`;
  };

  const getFullAddress = () => {
    return [booking.address_line1, booking.address_suburb, booking.address_city]
      .filter(Boolean)
      .join(', ');
  };

  const openMaps = () => {
    const address = getFullAddress();
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl mb-2">
                Booking Details
              </DialogTitle>
              <div className="text-sm text-gray-500">ID: {booking.id}</div>
            </div>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Service Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Service Information
            </h3>
            <div className="grid grid-cols-2 gap-4 ml-7">
              <div>
                <div className="text-sm text-gray-500">Service Type</div>
                <div className="font-medium">
                  {booking.service_type || 'Cleaning Service'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Your Earnings</div>
                <div className="font-medium text-primary">
                  {formatAmount(booking.cleaner_earnings)}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule
            </h3>
            <div className="grid grid-cols-2 gap-4 ml-7">
              <div>
                <div className="text-sm text-gray-500">Date</div>
                <div className="font-medium">{formatDate(booking.booking_date)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Time</div>
                <div className="font-medium">{formatTime(booking.booking_time)}</div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </h3>
            <div className="space-y-2 ml-7">
              {booking.customer_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{booking.customer_name}</span>
                </div>
              )}
              {booking.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a
                    href={`tel:${booking.customer_phone}`}
                    className="text-primary hover:underline"
                  >
                    {booking.customer_phone}
                  </a>
                </div>
              )}
              {booking.customer_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a
                    href={`mailto:${booking.customer_email}`}
                    className="text-primary hover:underline"
                  >
                    {booking.customer_email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </h3>
            <div className="ml-7">
              <div className="text-gray-700">{getFullAddress()}</div>
              <Button
                onClick={openMaps}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Open in Maps
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </h3>
            <div className="ml-7 space-y-2 text-sm">
              {booking.cleaner_claimed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Claimed:</span>
                  <span>{formatDateTime(booking.cleaner_claimed_at)}</span>
                </div>
              )}
              {booking.cleaner_started_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Started:</span>
                  <span>{formatDateTime(booking.cleaner_started_at)}</span>
                </div>
              )}
              {booking.cleaner_completed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed:</span>
                  <span>{formatDateTime(booking.cleaner_completed_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

