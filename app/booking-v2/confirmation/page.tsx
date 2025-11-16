'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Home, Calendar, MapPin, Mail, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';

interface ExtraItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface BookingDetails {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  total_amount: number;
  status: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  payment_reference?: string | null;
  extras?: ExtraItem[];
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('ref') || searchParams.get('id');
  
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingError, setProcessingError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) {
        setProcessingError('Booking reference not found');
        setIsProcessing(false);
        return;
      }

      try {
        setIsProcessing(true);
        const response = await fetch(`/api/bookings/guest?id=${encodeURIComponent(id)}`);
        const data = await response.json();

        if (response.ok && data.ok && data.booking) {
          setBooking(data.booking);
        } else {
          setProcessingError(data.error || 'Failed to load booking details');
        }
      } catch (error) {
        setProcessingError('An error occurred while loading your booking');
      } finally {
        setIsProcessing(false);
      }
    };

    fetchBooking();
  }, [id]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-gray-600">Loading your booking confirmation...</p>
        </div>
      </div>
    );
  }

  if (processingError || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Booking Not Found</h1>
            <p className="text-gray-600 mb-4">{processingError || 'Unable to load booking details'}</p>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-[576px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4"
          >
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600">
            Your cleaning service has been scheduled successfully
          </p>
        </motion.div>

        {/* Extras Section */}
        {booking.extras && booking.extras.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Extras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {booking.extras.map((extra, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900">
                      {extra.name}
                      {extra.quantity > 1 ? ` ×${extra.quantity}` : ''}
                    </span>
                    <span className="font-semibold text-gray-900">
                      R{extra.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold text-gray-900">
                {format(parseISO(booking.booking_date), 'MMMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-semibold text-gray-900">{booking.booking_time}</p>
            </div>
            {(booking.bedrooms !== null && booking.bedrooms !== undefined) || (booking.bathrooms !== null && booking.bathrooms !== undefined) ? (
              <div>
                <p className="text-sm text-gray-600">Bedrooms</p>
                <p className="font-semibold text-gray-900">
                  {booking.bedrooms ?? 0} bed{booking.bedrooms !== 1 ? 's' : ''}
                  {booking.bathrooms !== null && booking.bathrooms !== undefined && (
                    <>, {booking.bathrooms} bath{booking.bathrooms !== 1 ? 's' : ''}</>
                  )}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Address Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Street</p>
              <p className="font-semibold text-gray-900">{booking.address_line1}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">City</p>
              <p className="font-semibold text-gray-900">{booking.address_suburb}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Town</p>
              <p className="font-semibold text-gray-900">{booking.address_city}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-gray-900">
              <span className="font-semibold">Name:</span> {booking.customer_name}
            </p>
            <p className="text-gray-900">
              <span className="font-semibold">Email:</span> {booking.customer_email}
            </p>
            <p className="text-gray-900">
              <span className="font-semibold">Phone:</span> {booking.customer_phone}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-primary">
                  R{booking.total_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {booking.payment_reference && (
                <div className="pt-3 border-t border-primary/20">
                  <p className="text-xs text-gray-600">Payment ID</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{booking.payment_reference}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            A confirmation email has been sent to <strong>{booking.customer_email}</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/">Return to Home</Link>
            </Button>
            <Button asChild>
              <Link href="/booking-v2/select">Book Another Service</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}