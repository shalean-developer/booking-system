'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Loader2, AlertCircle, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';

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
  payment_reference?: string | null;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
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
      } catch {
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

  const displayDate = format(parseISO(booking.booking_date), 'EEE, d MMM');
  const displayTime = booking.booking_time?.length === 5 ? booking.booking_time : booking.booking_time?.replace(/^(\d):/, '0$1:') ?? booking.booking_time;
  const referenceNumber = booking.payment_reference || booking.id;
  const receiptHref = `/api/bookings/${encodeURIComponent(referenceNumber)}/receipt`;

  return (
    <div className="min-h-screen bg-slate-50 py-12 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-[576px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 border-2 border-green-200 mb-4"
          >
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Your cleaning is scheduled for <span className="font-semibold text-gray-900">{displayDate}</span> at <span className="font-semibold text-gray-900">{displayTime}</span>.
          </p>

          <div className="rounded-lg bg-blue-50 border border-blue-100 px-6 py-4 mb-6 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">REFERENCE NUMBER</p>
            <p className="text-xl font-bold text-primary font-mono">{referenceNumber}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button asChild>
              <Link href="/booking">Book New Session</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard">View in Dashboard</Link>
            </Button>
            <a
              href={receiptHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                <Download className="h-4 w-4" />
                Receipt (PDF)
              </Button>
            </a>
          </div>

          <p className="text-sm text-gray-500">
            A confirmation email has been sent to {booking.customer_email}.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
