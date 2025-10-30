'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Briefcase, Calendar, Clock, MapPin, Star, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  status: string;
  total_amount: number;
  created_at: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  cleaner_id: string;
  customer_reviewed?: boolean;
  customer_review_id?: string | null;
}

interface CustomerData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  totalBookings: number;
}

interface OverviewTabProps {
  customer: CustomerData | null;
  bookings: Booking[];
  upcomingBookings: number;
  completedBookings: number;
  onOpenReviewDialog: (booking: Booking) => void;
  isLoading?: boolean;
  hideRecentList?: boolean;
}

export function OverviewTab({
  customer,
  bookings,
  upcomingBookings,
  completedBookings,
  onOpenReviewDialog,
  isLoading,
  hideRecentList,
}: OverviewTabProps) {
  const shouldReduceMotion = useReducedMotion();
  // Get pending reviews (completed bookings not yet reviewed)
  const pendingReviews = bookings.filter(
    b => b.status === 'completed' && 
         !b.customer_reviewed && 
         b.cleaner_id && 
         b.cleaner_id !== 'manual'
  );

  // Get recent bookings (last 5)
  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="space-y-6">

      {/* Pending Reviews Section */}
      {pendingReviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : 0.1 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-l-amber-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Pending Reviews</h2>
                  <p className="text-sm text-gray-600">Share your experience with these completed services</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {pendingReviews.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white border border-amber-200 rounded-lg p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{booking.service_type}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(booking.booking_date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{booking.booking_time}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => onOpenReviewDialog(booking)}
                        className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto"
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Leave Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Your Bookings - optional (hidden when unified module is used) */}
      {!hideRecentList && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Your Bookings</h2>
                {bookings.length > 5 && (
                  <Button variant="ghost" size="sm" className="text-primary" asChild>
                    <Link href="/dashboard">View All</Link>
                  </Button>
                )}
              </div>
              {isLoading ? (
              <div className="space-y-2 sm:space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="text-right space-y-2">
                        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-6">Book your first cleaning service to get started!</p>
                <Button asChild>
                  <Link href="/booking/service/select">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Book a Service
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900">{booking.service_type}</h3>
                          <Badge 
                            variant={booking.status === 'completed' ? 'default' : 'outline'}
                            className={cn(
                              'text-xs',
                              booking.status === 'completed' && 'bg-green-100 text-green-800 border-green-200',
                              booking.status === 'accepted' && 'bg-blue-100 text-blue-800 border-blue-200',
                              booking.status === 'pending' && 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            )}
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="sm:hidden">{new Date(booking.booking_date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}</span>
                            <span className="hidden sm:inline">{new Date(booking.booking_date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{booking.booking_time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="sm:hidden">{booking.address_suburb}</span>
                            <span className="hidden sm:inline">{booking.address_line1}, {booking.address_suburb}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-left sm:text-right">
                        {booking.total_amount ? (
                          <p className="text-lg sm:text-2xl font-bold text-primary">R{(booking.total_amount / 100).toFixed(2)}</p>
                        ) : (
                          <p className="text-lg sm:text-2xl font-bold text-gray-400">—</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Booked {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard/bookings">View details</Link>
                      </Button>
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={{ pathname: '/booking/service/select', query: { rebookId: booking.id } as any }}>Rebook</Link>
                      </Button>
                      {booking.status === 'completed' && !booking.customer_reviewed && booking.cleaner_id && booking.cleaner_id !== 'manual' && (
                        <Button size="sm" onClick={() => onOpenReviewDialog(booking)}>
                          Leave review
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
