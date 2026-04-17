'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { serviceTypeToSlug } from '@/lib/booking-utils';
import type { ServiceType } from '@/types/booking';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function RescheduleRedirectInner({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookingAndRedirect = async () => {
      if (!bookingId) {
        setError('No booking ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const session = await safeGetSession(supabase);
        if (!session || !session.user) {
          router.push(`/login?redirect=/booking/reschedule?id=${encodeURIComponent(bookingId)}`);
          return;
        }

        const {
          data: { session: apiSession },
        } = await supabase.auth.getSession();
        if (!apiSession) {
          setError('Session expired. Please try again.');
          setIsLoading(false);
          return;
        }

        let response: Response;
        try {
          response = await fetch(`/api/dashboard/booking?id=${encodeURIComponent(bookingId)}`, {
            headers: {
              Authorization: `Bearer ${apiSession.access_token}`,
            },
          });
        } catch {
          setError('Network error. Please check your connection and try again.');
          setIsLoading(false);
          return;
        }

        let responseText = '';
        try {
          responseText = await response.text();
          if (!responseText?.trim()) {
            setError(`Empty response from server (Status: ${response.status})`);
            setIsLoading(false);
            return;
          }
        } catch {
          setError('Failed to read server response');
          setIsLoading(false);
          return;
        }

        let data: { ok?: boolean; error?: string; booking?: { service_type?: string } };
        try {
          data = JSON.parse(responseText) as typeof data;
        } catch {
          setError(`Invalid JSON response from server: ${responseText.substring(0, 100)}`);
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          setError(data?.error || `Server error (${response.status})`);
          setIsLoading(false);
          return;
        }

        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
          setError('Invalid response from server');
          setIsLoading(false);
          return;
        }

        if (!data.ok) {
          setError(data.error || 'Booking not found');
          setIsLoading(false);
          return;
        }

        if (!data.booking) {
          setError('Booking data not found in response');
          setIsLoading(false);
          return;
        }

        const serviceType = data.booking.service_type;

        if (!serviceType) {
          setError('Unable to determine service type');
          setIsLoading(false);
          return;
        }

        const slug = serviceTypeToSlug(serviceType as ServiceType);
        router.replace(`/booking/service/${slug}/plan?rescheduleId=${encodeURIComponent(bookingId)}`);
      } catch {
        setError('Failed to load booking details');
        setIsLoading(false);
      }
    };

    void fetchBookingAndRedirect();
  }, [bookingId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Card className="max-w-md mx-4 border-zinc-200 shadow-sm">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-zinc-900">Loading booking</h2>
            <p className="mt-1 text-sm text-zinc-500">Preparing reschedule</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-zinc-200 shadow-sm">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-zinc-900">Something went wrong</h2>
            <p className="mt-2 text-sm text-zinc-600">{error}</p>
            <div className="mt-6 space-y-2">
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

  return null;
}

export function DashboardRescheduleRedirect({ bookingId }: { bookingId: string }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <Card className="max-w-md mx-4 border-zinc-200 shadow-sm">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-zinc-500 mx-auto mb-4" />
              <p className="text-sm text-zinc-600">Loading…</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <RescheduleRedirectInner bookingId={bookingId} />
    </Suspense>
  );
}
