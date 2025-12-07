'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { NewHeader } from '@/components/dashboard/new-header';
import { MobileBottomNav } from '@/components/dashboard/mobile-bottom-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Star, ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { devLog } from '@/lib/dev-logger';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  booking_id: string;
  booking?: {
    service_type: string;
    booking_date: string;
    booking_time: string;
  };
}

export default function ReviewsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const session = await safeGetSession(supabase);
        if (!session || !session.user) {
          router.push('/login?redirect=/dashboard/reviews');
          return;
        }

        setUser(session.user);

        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          setError('Session expired');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/dashboard/reviews', {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.ok) {
          setReviews(data.reviews || []);
        } else {
          setError(data.error || 'Failed to load reviews');
        }

        // Fetch customer data
        const customerResponse = await fetch('/api/dashboard/bookings?limit=1', {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });
        const customerData = await customerResponse.json();
        if (customerResponse.ok && customerData.ok && customerData.customer) {
          setCustomer(customerData.customer);
        }
      } catch (err) {
        devLog.error('Error fetching reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white">
        <NewHeader user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
        <MobileBottomNav activeTab="reviews" onTabChange={() => {}} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white">
        <NewHeader user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
        <MobileBottomNav activeTab="reviews" onTabChange={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white pb-32 lg:pb-0">
      <NewHeader user={user} customer={customer} />
      
      <main className="py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Reviews</h1>
          </div>

          {reviews.length === 0 ? (
            <Card className="border-2 border-dashed border-teal-300 bg-teal-50/30">
              <CardContent className="p-8 text-center">
                <Star className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h2>
                <p className="text-gray-600 mb-6">Rate your completed services to help others!</p>
                <Button asChild className="bg-gradient-to-r from-teal-500 to-green-500">
                  <Link href="/dashboard/bookings">View Bookings</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-gray-500 ml-2">
                              {format(new Date(review.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                          {review.booking && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <Calendar className="h-4 w-4" />
                              <span>{review.booking.service_type}</span>
                              <span>•</span>
                              <span>{format(new Date(review.booking.booking_date), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          {review.comment && (
                            <p className="text-gray-700 mt-2">{review.comment}</p>
                          )}
                        </div>
                        {review.booking_id && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/bookings/${review.booking_id}`}>View Booking</Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav activeTab="reviews" onTabChange={() => {}} />
    </div>
  );
}
