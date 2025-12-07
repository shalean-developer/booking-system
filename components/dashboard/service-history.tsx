'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HistoryCard } from './history-card';
import { ServiceHistorySkeleton } from './Skeleton';
import { Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { useCleanerCache } from '@/lib/hooks/use-cleaner-cache';
import { devLog } from '@/lib/dev-logger';
import type { Booking, Cleaner, Review } from '@/types/dashboard';

interface ServiceHistoryProps {
  bookings: Booking[];
  isLoading?: boolean;
}

export const ServiceHistory = memo(function ServiceHistory({ bookings, isLoading = false }: ServiceHistoryProps) {
  const { fetchMultipleCleaners } = useCleanerCache();
  const [cleaners, setCleaners] = useState<Record<string, Cleaner>>({});
  const [reviews, setReviews] = useState<Record<string, Review>>({});

  // Fetch cleaner details and reviews
  useEffect(() => {
    const fetchData = async () => {
      const cleanerIds = bookings
        .map(b => b.cleaner_id)
        .filter((id): id is string => !!id);

      const reviewIds = bookings
        .map(b => b.customer_review_id)
        .filter((id): id is string => !!id);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch cleaners using shared cache
        if (cleanerIds.length > 0) {
          const cleanerMap = await fetchMultipleCleaners(cleanerIds);
          setCleaners(cleanerMap);
        }

        // Fetch reviews
        if (reviewIds.length > 0) {
          const reviewPromises = reviewIds.map(async (id) => {
            try {
              const response = await fetch(`/api/dashboard/reviews?reviewId=${id}`, {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                },
              });
              const data = await response.json();
              if (data.ok && data.review) {
                return { id, review: data.review };
              }
            } catch (error) {
              devLog.error(`Error fetching review ${id}:`, error);
            }
            return null;
          });

          const reviewResults = await Promise.all(reviewPromises);
          const reviewMap: Record<string, Review> = {};
          reviewResults.forEach(result => {
            if (result) {
              reviewMap[result.id] = result.review;
            }
          });
          setReviews(reviewMap);
        }
      } catch (error) {
        devLog.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [bookings]);

  // Memoize completed bookings
  const completedBookings = useMemo(() => {
    return bookings
      .filter(b => (b.status || '') === 'completed')
      .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())
      .slice(0, 5); // Show last 5
  }, [bookings]);

  if (isLoading) {
    return <ServiceHistorySkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-white to-blue-50/30 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-3 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base lg:text-lg font-semibold">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
          <span className="truncate">Recent Service History</span>
        </CardTitle>
        {bookings.filter(b => (b.status || '') === 'completed').length > 5 && (
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex flex-shrink-0">
            <Link href="/dashboard/bookings" className="text-[10px] sm:text-xs">
              View All <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {completedBookings.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3" />
            <p className="text-xs sm:text-sm lg:text-base text-gray-600">No completed services yet</p>
          </div>
        ) : (
          <>
            {completedBookings.map((booking) => {
              const cleaner = booking.cleaner_id ? cleaners[booking.cleaner_id] : null;
              const review = booking.customer_review_id ? reviews[booking.customer_review_id] : null;

              return (
                <HistoryCard
                  key={booking.id}
                  id={booking.id}
                  date={booking.booking_date}
                  time={booking.booking_time}
                  serviceType={booking.service_type}
                  address={`${booking.address_line1}, ${booking.address_suburb}, ${booking.address_city}`}
                  amount={booking.total_amount}
                  cleaner={cleaner || undefined}
                  notes={booking.notes || undefined}
                  rating={review?.rating || undefined}
                  cleanerId={booking.cleaner_id || undefined}
                  customerReviewed={booking.customer_reviewed || false}
                  onReviewSubmitted={() => {
                    // Refresh data after review submission
                    // The real-time subscription should handle this, but we can trigger a manual refresh
                    window.location.reload();
                  }}
                />
              );
            })}
            {bookings.filter(b => (b.status || '') === 'completed').length > 5 && (
              <Button variant="outline" className="w-full h-9 sm:h-10 text-xs sm:text-sm touch-manipulation" asChild>
                <Link href="/dashboard/bookings">View All History</Link>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
});
