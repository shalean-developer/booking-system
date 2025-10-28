'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SocialShareButtons } from "@/components/social-share-buttons";
import { BookingFooter } from "@/components/booking-footer";
import { 
  CheckCircle, 
  Calendar,
  MapPin,
  Clock,
  Home,
  Mail,
  Download,
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";
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

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!ref) {
        // Try to get from session storage
        const storedRef = sessionStorage.getItem('last_booking_ref');
        if (storedRef) {
          // Redirect to include ref in URL
          window.location.href = `/booking/success?ref=${storedRef}`;
          return;
        }
        setError('Booking reference not found');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/bookings/${ref}`);
        const data = await response.json();

        if (data.ok && data.booking) {
          setBooking(data.booking);
        } else {
          setError(data.error || 'Booking not found');
        }
      } catch (err) {
        console.error('Failed to fetch booking:', err);
        setError('Failed to load booking details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [ref]);

  const handleResendEmail = async () => {
    if (!ref) return;
    
    setResendLoading(true);
    setResendSuccess(false);
    
    try {
      const response = await fetch(`/api/bookings/${ref}/resend`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.ok) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      } else {
        setError('Failed to resend email');
      }
    } catch (err) {
      console.error('Failed to resend email:', err);
      setError('Failed to resend email');
    } finally {
      setResendLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!ref) return;
    window.open(`/api/bookings/${ref}/receipt`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading your booking...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <header className="bg-white border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="text-2xl font-bold text-primary">Shalean</div>
                <span className="text-sm text-gray-500">Cleaning Services</span>
              </Link>
            </div>
          </div>
        </header>

        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                  <div>
                    <h2 className="text-xl font-bold text-red-900 mb-2">
                      Booking Not Found
                    </h2>
                    <p className="text-red-800 mb-4">{error}</p>
                    <Button asChild variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                      <Link href="/">
                        Return to Home
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">Shalean</div>
              <span className="text-sm text-gray-500">Cleaning Services</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Success Content */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">
              Booking Confirmed
            </Badge>
            <h1 className="mb-4 text-4xl font-bold text-gray-900">
              Thank You for Your Booking!
            </h1>
            <p className="text-xl text-gray-600">
              Your cleaning service has been confirmed. We&apos;ve sent a confirmation email with all the details.
            </p>
          </div>

          {/* Booking Details Card */}
          {booking && (
          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h2>
              
              <div className="space-y-6">
                  {/* Booking Reference */}
                  <div className="mb-6 pb-6 border-b">
                    <Badge className="bg-primary text-white">
                      Booking Reference: {booking.payment_reference}
                    </Badge>
                  </div>

                  {/* Service Date & Time */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Service Date & Time</h3>
                      <p className="text-gray-900 font-medium">
                        {format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy')} at {booking.booking_time}
                      </p>
                  </div>
                </div>

                  {/* Service Type */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Service Type</h3>
                      <p className="text-gray-900 font-medium">{booking.service_type}</p>
                  </div>
                </div>

                  {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Service Location</h3>
                      <div className="text-gray-900 font-medium">
                        <p>{booking.address_line1}</p>
                        <p>{booking.address_suburb}</p>
                        <p>{booking.address_city}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cleaner/Team Assignment */}
                  {(booking.cleaner_details || booking.team_details) && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Home className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {booking.requires_team ? 'Team Assignment' : 'Cleaner Assignment'}
                        </h3>
                        {booking.team_details ? (
                          <p className="text-gray-900 font-medium">{booking.team_details.team_name}</p>
                        ) : booking.cleaner_details ? (
                          <p className="text-gray-900 font-medium">{booking.cleaner_details.name}</p>
                        ) : (
                          <p className="text-gray-600">To be assigned</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Total Amount */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Total Paid</h3>
                      <p className="text-green-600 font-bold text-xl">
                        R{(booking.total_amount / 100).toFixed(2)}
                      </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Next Steps Card */}
          <Card className="border-0 shadow-lg mb-8 bg-blue-50">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What Happens Next?</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Check Your Email</h3>
                    <p className="text-gray-600 text-sm">We&apos;ve sent a detailed confirmation with all booking information</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Prepare Your Home</h3>
                    <p className="text-gray-600 text-sm">Clear surfaces and secure valuables before our team arrives</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">We&apos;ll Be There</h3>
                    <p className="text-gray-600 text-sm">Our professional cleaners will arrive on time, ready to work</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Enjoy Your Clean Space</h3>
                    <p className="text-gray-600 text-sm">Relax and enjoy your spotless home</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              variant="outline" 
              className="flex-1 border-primary text-primary hover:bg-primary/10"
              onClick={handleResendEmail}
              disabled={resendLoading || !ref}
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
              disabled={!ref}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
          </div>

          {/* Return Home */}
          <div className="mt-8 text-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Link>
            </Button>
          </div>

          {/* Share Your Experience Section */}
          <div className="mt-12 p-6 bg-primary/5 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2 text-center">Share Your Experience</h3>
            <p className="text-gray-600 mb-4 text-center text-sm">
              Know someone who needs cleaning services? Share Shalean with them!
            </p>
            <div className="flex justify-center">
              <SocialShareButtons 
                url="https://shalean.co.za"
                title="I just booked professional cleaning services with Shalean Cleaning Services in Cape Town. Great service, highly recommend! 🧹✨"
                showLabel={false}
              />
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-12 text-center p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              Our customer service team is here to assist you
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <span className="text-gray-600">
                📞 +27 87 153 5250
              </span>
              <span className="text-gray-600">
                ✉️ support@shalean.com
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <BookingFooter />
    </div>
  );
}

