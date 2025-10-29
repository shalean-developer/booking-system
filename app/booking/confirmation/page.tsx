'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SocialShareButtons } from '@/components/social-share-buttons';
import { BookingFooter } from '@/components/booking-footer';
import { CheckCircle2, Home, Calendar, MapPin, Clock, Mail, Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

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
  payment_reference: string;
  total_amount: number;
  status: string;
  cleaner_id: string | null;
  requires_team: boolean;
  cleaner_details?: {
    name: string;
    photo_url: string | null;
  } | null;
  team_details?: {
    team_name: string;
    supervisor_id: string | null;
  } | null;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('ref') || searchParams.get('id');
  
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) {
        // Try to get reference from sessionStorage as fallback
        const storedRef = sessionStorage.getItem('last_booking_ref');
        if (storedRef) {
          window.location.href = `/booking/confirmation?ref=${storedRef}`;
          return;
        }
        setProcessingError('Booking reference not found');
        return;
      }

      setIsProcessing(true);
      
      try {
        // Fetch booking from database (already saved by step-review)
        console.log('Fetching booking:', id);
        const response = await fetch(`/api/bookings/${id}`);
        const data = await response.json();

        if (data.ok && data.booking) {
          setBooking(data.booking);
          console.log('✅ Booking fetched successfully');
        } else {
          setProcessingError(data.error || 'Booking not found');
          console.error('❌ Booking not found:', data.error);
        }
      } catch (err) {
        console.error('Failed to fetch booking:', err);
        setProcessingError('Failed to load booking details. Please try again or contact support.');
      } finally {
        setIsProcessing(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleResendEmail = async () => {
    if (!id) return;
    
    setResendLoading(true);
    setResendSuccess(false);
    
    try {
      const response = await fetch(`/api/bookings/${id}/resend`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.ok) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      } else {
        setProcessingError('Failed to resend email');
      }
    } catch (err) {
      console.error('Failed to resend email:', err);
      setProcessingError('Failed to resend email');
    } finally {
      setResendLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!id) return;
    window.open(`/api/bookings/${id}/receipt`, '_blank');
  };

  if (isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 to-white">
        <div className="text-center max-w-md">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">Loading your booking...</p>
          <p className="text-gray-600 mb-4">Please wait while we fetch your booking details.</p>
          {id && (
            <Badge className="bg-primary text-white">
              Reference: {id}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  if (processingError && !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 to-white px-4">
        <Card className="border-yellow-200 bg-yellow-50 max-w-2xl">
          <CardContent className="p-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Payment Successful!
              </h2>
              <p className="text-gray-700 mb-4">
                Your payment was processed successfully. {processingError || 'Processing delayed'}
              </p>
              {id && (
                <div className="mb-4">
                  <Badge className="bg-primary text-white text-sm">
                    Payment Reference: {id}
                  </Badge>
                </div>
              )}
              <p className="text-sm text-gray-600 mb-4">
                You'll receive a confirmation email shortly with all booking details.
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild variant="default">
                  <Link href="/">
                    Return to Home
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 to-white px-4 pb-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl sm:text-4xl font-bold text-gray-900">
              Booking Confirmed!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-base sm:text-lg text-slate-600">
              {booking 
                ? `Thank you for booking with Shalean Cleaning Services, ${booking.customer_name.split(' ')[0]}! Your payment has been successfully processed.`
                : 'Thank you for booking with Shalean Cleaning Services. Your payment has been successfully processed and your booking is confirmed!'
              }
            </p>

            {/* Booking Details */}
            {booking && (
              <div className="space-y-4">
                <div className="mb-4 pb-4 border-b">
                  <Badge className="bg-primary text-white">
                    Booking Reference: {booking.payment_reference}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Date & Time</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(booking.booking_date), 'MMM d, yyyy')} at {booking.booking_time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Service Type</p>
                      <p className="text-sm text-gray-600">{booking.service_type}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:col-span-2">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Address</p>
                      <p className="text-sm text-gray-600">
                        {booking.address_line1}<br />
                        {booking.address_suburb}, {booking.address_city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:col-span-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Total Paid</p>
                      <p className="text-lg font-bold text-green-600">
                        R{(booking.total_amount / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-green-50 p-4 sm:p-6 border border-green-200 mb-4">
              <p className="text-center text-sm text-green-800">
                <strong className="text-green-900">Payment Successful</strong>
                <br />
                Your payment has been processed securely via Paystack
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 sm:p-6 border border-slate-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                What&apos;s Next?
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>You&apos;ll receive a confirmation email with your booking details and receipt</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Our team will contact you 24 hours before your scheduled cleaning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>If you have any questions, feel free to reach out to us anytime</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary/5 rounded-xl p-4 sm:p-6 border border-primary/10">
              <p className="text-sm text-center text-slate-700">
                <strong className="text-slate-900">Need to make changes?</strong>
                <br />
                Reply to your confirmation email or contact us at{' '}
                <a href="mailto:hello@shalean.co.za" className="text-primary hover:underline font-medium">
                  hello@shalean.com
                </a>
              </p>
            </div>

            {/* Action Buttons */}
            {booking && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="flex-1 border-primary text-primary hover:bg-primary/10"
                  onClick={handleResendEmail}
                  disabled={resendLoading || !id}
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : resendSuccess ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Sent!
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Confirmation
                    </>
                  )}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleDownloadReceipt}
                  disabled={!id}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipt
                </Button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4 px-1">
              <Button asChild variant="default" size="lg" className="w-full sm:flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sm:hidden">Home</span>
                  <span className="hidden sm:inline">Back to Home</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:flex-1">
                <Link href="/booking/service/select">
                  <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sm:hidden">Book Again</span>
                  <span className="hidden sm:inline">Book Another Service</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <BookingFooter />
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

