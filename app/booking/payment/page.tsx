'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { usePaystackPayment } from 'react-paystack';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError('No booking ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const session = await safeGetSession(supabase);
        if (!session || !session.user) {
          router.push(`/login?redirect=/booking/payment?bookingId=${encodeURIComponent(bookingId)}`);
          return;
        }

        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          setError('Session expired');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/dashboard/booking?id=${encodeURIComponent(bookingId)}`, {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.ok && data.booking) {
          setBooking(data.booking);
          
          // Check if already paid
          if (data.booking.payment_reference) {
            setError('This booking has already been paid');
          }
        } else {
          setError(data.error || 'Booking not found');
        }
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, router]);

  // Paystack configuration - only initialize on client side
  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
  const paymentRef = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `BK-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  const paystackConfig = useMemo(() => ({
    reference: paymentRef,
    email: booking?.customer_email || '',
    amount: booking?.total_amount || 0, // Already in cents/kobo
    publicKey: paystackPublicKey,
    currency: 'ZAR',
    metadata: {
      booking_id: bookingId || '',
      customer_email: booking?.customer_email || '',
      custom_fields: [],
    },
  }), [paymentRef, booking, bookingId, paystackPublicKey]);

  // Initialize payment hook - this will only run on client side due to Suspense boundary
  const initializePayment = usePaystackPayment(paystackConfig);

  const handlePayment = () => {
    if (!booking || !bookingId) return;

    setIsProcessing(true);
    setError(null);

    initializePayment({
      onSuccess: async (reference: any) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setError('Session expired');
            setIsProcessing(false);
            return;
          }

          // Verify payment
          const verifyResponse = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              reference: reference.reference,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (!verifyResponse.ok || !verifyData.ok) {
            setError(verifyData.error || 'Payment verification failed');
            setIsProcessing(false);
            return;
          }

          // Update booking with payment reference
          const updateResponse = await fetch(`/api/dashboard/booking?id=${encodeURIComponent(bookingId)}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              payment_reference: reference.reference,
              status: 'confirmed',
            }),
          });

          // Redirect even if update fails (payment was successful)
          router.push(`/booking/confirmation?ref=${encodeURIComponent(reference.reference)}`);
        } catch (err) {
          console.error('Error verifying payment:', err);
          setError('Payment verification failed');
          setIsProcessing(false);
        }
      },
      onClose: () => {
        setIsProcessing(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Loading booking...</h2>
            <p className="text-gray-600">Preparing payment</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'Booking not found'}</p>
            <div className="space-y-3">
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
              <Button onClick={() => router.push('/dashboard/bookings')} variant="outline" className="w-full">
                View Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/bookings')} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Complete Payment</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium">{booking.service_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{format(new Date(booking.booking_date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">{booking.booking_time}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-teal-600">R{(booking.total_amount / 100).toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessing || !!booking.payment_reference}
              className="w-full bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : booking.payment_reference ? (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Already Paid
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </>
              )}
            </Button>

            {booking.payment_reference && (
              <p className="text-sm text-gray-500 text-center">
                Payment Reference: {booking.payment_reference}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Loading...</h2>
              <p className="text-gray-600">Preparing payment</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
