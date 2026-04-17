'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { logBookingFlowClient } from '@/lib/debug-booking-flow';
import { BookingFlowStepIndicator } from '@/components/booking-flow-step-indicator';

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
  const verifiedSkip = searchParams.get('verified') === '1';
  const paystackReference =
    searchParams.get('reference')?.trim() || searchParams.get('trxref')?.trim() || null;
  const id =
    searchParams.get('ref')?.trim() ||
    searchParams.get('id')?.trim() ||
    (paystackReference?.startsWith('booking-') ? paystackReference.slice('booking-'.length) : null);
  const ct = searchParams.get('ct');

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(() => {
    if (verifiedSkip) return 'success';
    return paystackReference ? 'loading' : 'idle';
  });
  const [bookingRefresh, setBookingRefresh] = useState(0);

  useEffect(() => {
    if (verifiedSkip) {
      setVerifyStatus('success');
      return;
    }
    if (!paystackReference) {
      setVerifyStatus('idle');
      return;
    }
    let cancelled = false;
    (async () => {
      setVerifyStatus('loading');
      try {
        const params = new URLSearchParams();
        params.set('reference', paystackReference);
        if (id) params.set('booking_id', id);
        const verifyUrl = `/api/payment/verify?${params.toString()}`;
        console.log('📡 CALLING VERIFY API...', verifyUrl);
        const res = await fetch(verifyUrl);
        const data = await res.json();
        if (cancelled) return;
        console.log('VERIFY RESPONSE:', data);
        if (res.ok && (data.ok === true || data.success === true)) {
          setVerifyStatus('success');
          setBookingRefresh((r) => r + 1);
        } else {
          setVerifyStatus('error');
        }
      } catch {
        if (!cancelled) setVerifyStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paystackReference, id, verifiedSkip]);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) {
        logBookingFlowClient('confirmation: missing ref/id query param');
        setProcessingError('Booking reference not found');
        setIsProcessing(false);
        return;
      }

      try {
        setIsProcessing(true);
        logBookingFlowClient('confirmation: GET /api/bookings/guest', {
          id,
          hasCt: Boolean(ct),
        });
        const ctParam = ct ? `&ct=${encodeURIComponent(ct)}` : '';
        const response = await fetch(`/api/bookings/guest?id=${encodeURIComponent(id)}${ctParam}`);
        const data = await response.json();

        if (response.ok && data.ok && data.booking) {
          logBookingFlowClient('confirmation: booking loaded', {
            bookingId: data.booking.id,
            status: data.booking.status,
          });
          setBooking(data.booking);
        } else {
          logBookingFlowClient('confirmation: load failed', {
            status: response.status,
            error: data.error ?? data.message,
          });
          setProcessingError(data.error || 'Failed to load booking details');
        }
      } catch {
        logBookingFlowClient('confirmation: network or parse error');
        setProcessingError('An error occurred while loading your booking');
      } finally {
        setIsProcessing(false);
      }
    };

    fetchBooking();
  }, [id, ct, bookingRefresh]);

  if (paystackReference && verifyStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[#f0f2f5] font-sans flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600 mx-auto" />
          <p className="text-gray-600">Processing payment...</p>
        </div>
      </div>
    );
  }

  if (paystackReference && verifyStatus === 'error') {
    return (
      <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Go home"
            >
              <ArrowLeft size={18} className="text-gray-500" />
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Shalean Cleaning Services</p>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Confirmation</h1>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <Card className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Payment verification failed</h2>
              <p className="text-gray-600 mb-6 text-sm">We could not confirm your payment. Please contact support if you were charged.</p>
              <Button
                asChild
                className="rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200"
              >
                <Link href="/">Return to home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] font-sans flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600 mx-auto" />
          <p className="text-gray-600">Loading your booking confirmation...</p>
        </div>
      </div>
    );
  }

  if (processingError || !booking) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Go home"
            >
              <ArrowLeft size={18} className="text-gray-500" />
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Shalean Cleaning Services</p>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Confirmation</h1>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <Card className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Booking not found</h2>
              <p className="text-gray-600 mb-6 text-sm">{processingError || 'Unable to load booking details'}</p>
              <Button
                asChild
                className="rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200"
              >
                <Link href="/">Return to home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayDate = format(parseISO(booking.booking_date), 'EEE, d MMM');
  const displayTime = booking.booking_time?.length === 5 ? booking.booking_time : booking.booking_time?.replace(/^(\d):/, '0$1:') ?? booking.booking_time;
  const referenceNumber = booking.payment_reference || booking.id;
  const receiptHref =
    ct && referenceNumber
      ? `/api/bookings/${encodeURIComponent(referenceNumber)}/receipt?ct=${encodeURIComponent(ct)}`
      : `/api/bookings/${encodeURIComponent(referenceNumber)}/receipt`;

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Go home"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Shalean Cleaning Services</p>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Confirmation</h1>
          </div>
        </div>
        <BookingFlowStepIndicator activeStep={4} allComplete />
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <p className="text-xs font-bold tracking-widest text-violet-600 uppercase mb-6">Complete</p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 text-center"
        >
          <motion.div
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 220 }}
            className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-500 text-white shadow-md shadow-green-200 mb-5"
            aria-hidden
          >
            <CheckCircle2 className="h-9 w-9 md:h-10 md:w-10" strokeWidth={2.25} />
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">Booking confirmed!</h2>
          <p className="text-gray-600 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
            Your cleaning is scheduled for{' '}
            <span className="font-semibold text-gray-900">{displayDate}</span> at{' '}
            <span className="font-semibold text-gray-900">{displayTime}</span>.
          </p>

          <div className="rounded-2xl border border-violet-100 bg-violet-50/80 px-6 py-4 mb-8 text-center shadow-sm shadow-violet-100/50">
            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1.5">Reference number</p>
            <p className="text-lg md:text-xl font-bold text-violet-800 font-mono tracking-tight">{referenceNumber}</p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center mb-6">
            <Button
              asChild
              className="rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200"
            >
              <Link href="/booking/service/standard/plan">Book new session</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-gray-200 hover:border-violet-300 hover:bg-violet-50/40"
            >
              <Link href="/dashboard">View in dashboard</Link>
            </Button>
            <a
              href={receiptHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full justify-center sm:w-auto"
            >
              <Button
                type="button"
                variant="outline"
                className="rounded-full w-full sm:w-auto border-gray-200 hover:border-violet-300 hover:bg-violet-50/40"
              >
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
        <div className="min-h-screen bg-[#f0f2f5] font-sans flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
