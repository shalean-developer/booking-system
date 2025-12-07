'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { serviceTypeToSlug } from '@/lib/booking-utils';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReschedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');
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

        // Get session token for API call
        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          setError('Session expired. Please try again.');
          setIsLoading(false);
          return;
        }

        console.log('Fetching booking:', bookingId);
        console.log('API URL:', `/api/dashboard/booking?id=${encodeURIComponent(bookingId)}`);

        // Fetch booking details
        let response;
        try {
          response = await fetch(`/api/dashboard/booking?id=${encodeURIComponent(bookingId)}`, {
            headers: {
              'Authorization': `Bearer ${apiSession.access_token}`,
            },
          });
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          setError('Network error. Please check your connection and try again.');
          setIsLoading(false);
          return;
        }

        // Check response status first
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        let data;
        let responseText = '';
        try {
          responseText = await response.text();
          console.log('API Response text:', responseText);
          
          if (!responseText || responseText.trim() === '') {
            console.error('Empty response body');
            setError(`Empty response from server (Status: ${response.status})`);
            setIsLoading(false);
            return;
          }
          
          try {
            data = JSON.parse(responseText);
            console.log('API Response data:', data);
          } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            console.error('Response text was:', responseText);
            setError(`Invalid JSON response from server: ${responseText.substring(0, 100)}`);
            setIsLoading(false);
            return;
          }
        } catch (readError) {
          console.error('Failed to read response:', readError);
          setError('Failed to read server response');
          setIsLoading(false);
          return;
        }

        // Validate response data structure
        if (!response.ok) {
          console.error('HTTP error response:', {
            status: response.status,
            statusText: response.statusText,
            data,
          });
          setError(data?.error || `Server error (${response.status})`);
          setIsLoading(false);
          return;
        }

        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
          console.error('Invalid or empty response data:', data);
          setError('Invalid response from server');
          setIsLoading(false);
          return;
        }

        if (!data.ok) {
          console.error('API returned error:', {
            ok: data.ok,
            error: data.error,
            bookingId,
            data,
          });
          setError(data.error || 'Booking not found');
          setIsLoading(false);
          return;
        }

        if (!data.booking) {
          console.error('No booking in response:', data);
          setError('Booking data not found in response');
          setIsLoading(false);
          return;
        }

        const booking = data.booking;
        const serviceType = booking.service_type;

        if (!serviceType) {
          setError('Unable to determine service type');
          setIsLoading(false);
          return;
        }

        // Convert service type to slug and redirect to schedule page with rescheduleId
        const slug = serviceTypeToSlug(serviceType);
        router.replace(`/booking/service/${slug}/schedule?rescheduleId=${encodeURIComponent(bookingId)}`);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details');
        setIsLoading(false);
      }
    };

    fetchBookingAndRedirect();
  }, [bookingId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Loading booking...</h2>
            <p className="text-gray-600">Preparing reschedule form</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
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

  return null; // Will redirect before this renders
}
