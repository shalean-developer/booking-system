'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { NewHeader } from '@/components/dashboard/new-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, MapPin, Clock, User, ArrowLeft, CreditCard, X, Home, Bath, Bed, Package, CheckCircle, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { CancelBookingModal } from '@/components/dashboard/cancel-booking-modal';
import { BookingShare } from '@/components/dashboard/booking-share';
import { toast } from 'sonner';
import { devLog } from '@/lib/dev-logger';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  canceled: 'bg-red-100 text-red-800 border-red-200',
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [cleaner, setCleaner] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const session = await safeGetSession(supabase);
        if (!session || !session.user) {
          router.push(`/login?redirect=/dashboard/bookings/${id}`);
          return;
        }

        setUser(session.user);

        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          setError('Session expired');
          setIsLoading(false);
          return;
        }

        // Fetch booking details
        const bookingResponse = await fetch(`/api/dashboard/booking?id=${encodeURIComponent(id)}`, {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });

        const bookingData = await bookingResponse.json();

        if (!bookingResponse.ok || !bookingData.ok || !bookingData.booking) {
          setError(bookingData.error || 'Booking not found');
          setIsLoading(false);
          return;
        }

        setBooking(bookingData.booking);

        // Fetch cleaner details if cleaner_id exists
        if (bookingData.booking.cleaner_id) {
          const cleanerResponse = await fetch(`/api/dashboard/cleaners/${bookingData.booking.cleaner_id}`, {
            headers: {
              'Authorization': `Bearer ${apiSession.access_token}`,
            },
          });
          const cleanerData = await cleanerResponse.json();
          if (cleanerResponse.ok && cleanerData.ok && cleanerData.cleaner) {
            setCleaner(cleanerData.cleaner);
          }
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
        devLog.error('Error fetching booking:', err);
        setError('Failed to load booking details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white">
        <NewHeader user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white">
        <NewHeader user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">{error || 'Booking not found'}</p>
              <div className="space-y-3">
                <Button onClick={() => router.push('/dashboard/bookings')} className="w-full">
                  Back to Bookings
                </Button>
                <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white pb-32 lg:pb-0">
      <NewHeader user={user} customer={customer} />
      
      <main className="py-6 sm:py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/bookings')} className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Bookings
            </Button>
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Booking Details</h1>
              {booking && (
                <BookingShare 
                  bookingId={id} 
                  bookingTitle={`${booking.service_type} - ${format(new Date(booking.booking_date), 'MMM d, yyyy')}`}
                />
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Booking Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Booking Information</CardTitle>
                  <Badge className={statusColors[booking.status] || statusColors.pending}>
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Service Type</p>
                    <p className="font-medium">{booking.service_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Booking ID</p>
                    <p className="font-medium font-mono text-sm">{booking.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="font-medium">{format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Time</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <p className="font-medium">{booking.booking_time}</p>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Address</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <p className="font-medium">
                        {booking.address_line1}<br />
                        {booking.address_suburb}, {booking.address_city}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                    <p className="font-medium text-lg">R{(booking.total_amount / 100).toFixed(2)}</p>
                  </div>
                  {booking.payment_reference && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Payment Reference</p>
                      <p className="font-medium font-mono text-sm">{booking.payment_reference}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cleaner Information */}
            {cleaner && (
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Cleaner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {cleaner.photo_url && (
                      <img src={cleaner.photo_url} alt={cleaner.name} className="w-16 h-16 rounded-full object-cover" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{cleaner.name}</p>
                      {cleaner.rating && (
                        <p className="text-sm text-gray-600">{cleaner.rating} ⭐</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Details */}
            {(booking.bedrooms !== null || booking.bathrooms !== null || (booking.extras && booking.extras.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle>Service Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {booking.bedrooms !== null && (
                      <div className="flex items-center gap-3">
                        <Bed className="h-5 w-5 text-teal-600" />
                        <div>
                          <p className="text-sm text-gray-500">Bedrooms</p>
                          <p className="font-medium">{booking.bedrooms}</p>
                        </div>
                      </div>
                    )}
                    {booking.bathrooms !== null && (
                      <div className="flex items-center gap-3">
                        <Bath className="h-5 w-5 text-teal-600" />
                        <div>
                          <p className="text-sm text-gray-500">Bathrooms</p>
                          <p className="font-medium">{booking.bathrooms}</p>
                        </div>
                      </div>
                    )}
                    {booking.extras && booking.extras.length > 0 && (
                      <div className="sm:col-span-2">
                        <div className="flex items-start gap-3">
                          <Package className="h-5 w-5 text-teal-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-2">Additional Services</p>
                            <div className="flex flex-wrap gap-2">
                              {booking.extras.map((extra: string, index: number) => (
                                <Badge key={index} variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                                  {extra}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-semibold text-lg">R{((booking.total_amount || 0) / 100).toFixed(2)}</span>
                  </div>
                  {booking.service_fee && booking.service_fee > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Service Fee</span>
                      <span className="text-gray-700">R{(booking.service_fee / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {booking.frequency_discount && booking.frequency_discount > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span>Frequency Discount</span>
                      <span>-R{(booking.frequency_discount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {booking.tip_amount && booking.tip_amount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Tip</span>
                      <span className="text-gray-700">R{(booking.tip_amount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {booking.payment_reference && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-500 mb-1">Payment Reference</p>
                      <p className="font-mono text-sm font-medium">{booking.payment_reference}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Booking Timeline */}
            {(booking.cleaner_claimed_at || booking.cleaner_accepted_at || booking.cleaner_started_at || booking.cleaner_completed_at) && (
              <Card>
                <CardHeader>
                  <CardTitle>Booking Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5" />
                        <div className="w-0.5 h-full bg-gray-200 mt-1" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-sm">Booking Created</p>
                        <p className="text-xs text-gray-500">{format(new Date(booking.created_at), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                    </div>
                    {booking.cleaner_claimed_at && (
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                          <div className="w-0.5 h-full bg-gray-200 mt-1" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-sm">Cleaner Claimed</p>
                          <p className="text-xs text-gray-500">{format(new Date(booking.cleaner_claimed_at), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                      </div>
                    )}
                    {booking.cleaner_accepted_at && (
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                          <div className="w-0.5 h-full bg-gray-200 mt-1" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-sm">Cleaner Accepted</p>
                          <p className="text-xs text-gray-500">{format(new Date(booking.cleaner_accepted_at), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                      </div>
                    )}
                    {booking.cleaner_on_my_way_at && (
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5" />
                          <div className="w-0.5 h-full bg-gray-200 mt-1" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-sm">Cleaner On The Way</p>
                          <p className="text-xs text-gray-500">{format(new Date(booking.cleaner_on_my_way_at), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                      </div>
                    )}
                    {booking.cleaner_started_at && (
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                          <div className="w-0.5 h-full bg-gray-200 mt-1" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-sm">Service Started</p>
                          <p className="text-xs text-gray-500">{format(new Date(booking.cleaner_started_at), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                      </div>
                    )}
                    {booking.cleaner_completed_at && (
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Service Completed</p>
                          <p className="text-xs text-gray-500">{format(new Date(booking.cleaner_completed_at), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Notes */}
            {booking.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {booking.status !== 'cancelled' && booking.status !== 'canceled' && booking.status !== 'completed' && (
                  <>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href={`/booking/reschedule?id=${booking.id}`}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Reschedule Booking
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setCancelModalOpen(true)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  </>
                )}
                {booking.status === 'pending' && !booking.payment_reference && (
                  <Button className="w-full justify-start bg-gradient-to-r from-teal-500 to-green-500" asChild>
                    <Link href={`/booking/payment?bookingId=${booking.id}`}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Make Payment
                    </Link>
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/contact">
                    Contact Support
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <CancelBookingModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        bookingId={id}
        bookingDate={booking.booking_date}
        serviceType={booking.service_type}
        onSuccess={() => {
          // Refresh the page to show updated status
          router.refresh();
          // Also refetch booking data
          const fetchBooking = async () => {
            try {
              const { data: { session: apiSession } } = await supabase.auth.getSession();
              if (!apiSession) return;

              const bookingResponse = await fetch(`/api/dashboard/booking?id=${encodeURIComponent(id)}`, {
                headers: {
                  'Authorization': `Bearer ${apiSession.access_token}`,
                },
              });

              const bookingData = await bookingResponse.json();
              if (bookingResponse.ok && bookingData.ok && bookingData.booking) {
                setBooking(bookingData.booking);
              }
            } catch (err) {
              devLog.error('Error refreshing booking:', err);
            }
          };
          fetchBooking();
        }}
      />
    </div>
  );
}
