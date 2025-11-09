'use client';

import { useEffect, useState, Suspense, useMemo } from "react";
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
  AlertCircle,
  Phone,
  MessageSquare,
  Gift,
  Repeat,
  Smile,
  ListChecks
} from "lucide-react";
import { addMinutes, format, parseISO } from 'date-fns';

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

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const cachedBooking = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('pending_booking');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (!parsed?.bookingState) return null;
      const { bookingState, timestamp } = parsed;
      if (Date.now() - (timestamp || 0) > 5 * 60 * 1000) return null;
      return {
        service_type: bookingState.service,
        booking_date: bookingState.date,
        booking_time: bookingState.time,
        address_line1: bookingState.address?.line1,
        address_suburb: bookingState.address?.suburb,
        address_city: bookingState.address?.city,
        total_amount: bookingState.totalAmount || 0,
        payment_reference: parsed.paymentReference,
      } as Partial<BookingDetails>;
    } catch {
      return null;
    }
  }, []);

  const calendarLinks = useMemo(() => {
    if (!booking?.booking_date || !booking?.booking_time) return null;
    const start = parseISO(`${booking.booking_date}T${booking.booking_time}`);
    const end = addMinutes(start, 120);
    const description = `Cleaning service with Shalean at ${booking.address_line1}, ${booking.address_suburb}, ${booking.address_city}.`;
    const title = `Cleaning Service - ${booking.service_type}`;
    const formatDate = (date: Date) => format(date, "yyyyMMdd'T'HHmmss");
    const google =
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}` +
      `&dates=${formatDate(start)}/${formatDate(end)}` +
      `&details=${encodeURIComponent(description)}` +
      `&location=${encodeURIComponent(`${booking.address_line1}, ${booking.address_suburb}, ${booking.address_city}`)}`;
    const outlook =
      `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}` +
      `&startdt=${start.toISOString()}` +
      `&enddt=${end.toISOString()}` +
      `&body=${encodeURIComponent(description)}` +
      `&location=${encodeURIComponent(`${booking.address_line1}, ${booking.address_suburb}, ${booking.address_city}`)}`;
    const ics =
      `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDESCRIPTION:${description}\n` +
      `DTSTART:${formatDate(start)}\nDTEND:${formatDate(end)}\nLOCATION:${booking.address_line1}, ${booking.address_suburb}, ${booking.address_city}\nEND:VEVENT\nEND:VCALENDAR`;
    return { google, outlook, ics: `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}` };
  }, [booking]);

  const [showTimeoutNotice, setShowTimeoutNotice] = useState(false);

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
    const timeout = setTimeout(() => setShowTimeoutNotice(true), 6000);
    return () => clearTimeout(timeout);
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

  const renderInlineSummary = () => (
    <div className="mt-6 rounded-2xl border border-green-200 bg-white/70 p-6 shadow-sm backdrop-blur">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-green-700 mb-4">
        Booking snapshot
      </h3>
      <div className="grid gap-3 text-sm text-slate-700">
        {cachedBooking?.service_type && (
          <div className="flex items-center gap-3">
            <Home className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{cachedBooking.service_type}</span>
          </div>
        )}
        {cachedBooking?.booking_date && (
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
            <span>
              {format(new Date(cachedBooking.booking_date), 'EEE, d MMM yyyy')} at {cachedBooking.booking_time}
            </span>
          </div>
        )}
        {cachedBooking?.address_line1 && (
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{cachedBooking.address_line1}, {cachedBooking.address_suburb}, {cachedBooking.address_city}</span>
          </div>
        )}
        {cachedBooking?.total_amount && (
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-700 border-green-200">
              Paid: R{cachedBooking.total_amount}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <header className="bg-white border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="text-2xl font-bold text-primary">Shalean</div>
                <span className="text-sm text-gray-500">Cleaning Services</span>
              </Link>
              <div className="text-sm text-slate-500">Step 3 · Finalise</div>
            </div>
          </div>
        </header>
        <section className="relative py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary mb-6">
              <CheckCircle className="h-4 w-4" />
              Payment received
            </div>
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Loading your booking…</h1>
            <p className="text-base text-slate-600">
              Hang tight while we finalise your booking details and send everything to your inbox.
            </p>
            {cachedBooking && renderInlineSummary()}
            <div className="mt-8 flex flex-col items-center gap-3 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Confirming cleaner availability
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150" />
                Preparing your receipt and booking email
              </div>
            </div>
            {showTimeoutNotice && (
              <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This is taking a little longer than usual. You can{' '}
                <button
                  onClick={() => window.location.reload()}
                  className="font-semibold underline hover:text-amber-900"
                >
                  refresh
                </button>{' '}
                or contact{' '}
                <a href="mailto:hello@shalean.com" className="font-semibold underline hover:text-amber-900">
                  hello@shalean.com
                </a>
                .
              </div>
            )}
          </div>
        </section>
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-32">
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
      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-10">
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

          {/* Quick Actions */}
          <div className="mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur sm:grid-cols-3">
            <Button asChild className="h-auto justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
              <Link href="/dashboard/bookings">
                <ArrowRight className="mr-2 h-4 w-4" />
                View Booking
              </Link>
            </Button>
            <Button
              onClick={handleDownloadReceipt}
              variant="outline"
              className="h-auto justify-center rounded-xl border-slate-300 hover:bg-slate-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
            <Button
              onClick={handleResendEmail}
              disabled={resendLoading}
              variant="outline"
              className="h-auto justify-center rounded-xl border-slate-300 hover:bg-slate-50"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Email
                </>
              )}
            </Button>
          </div>

          {/* Payment Summary */}
          {booking && (
            <Card className="border-0 shadow-lg mb-8 bg-green-50/80">
              <CardContent className="p-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-900">Payment Successful</h3>
                      <p className="text-sm text-green-700">Your payment has been processed securely via Paystack.</p>
                    </div>
                  </div>
                  <Badge className="bg-white text-green-700 border-green-200 px-4 py-2">
                    Total Paid: <span className="font-semibold">R{(booking.total_amount / 100).toFixed(2)}</span>
                  </Badge>
                </div>
                <div className="grid gap-3 rounded-xl border border-green-200 bg-white/80 p-4 text-sm text-green-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Booking confirmed – you’re all set!
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Confirmation and receipt sent to <span className="font-semibold">{booking.customer_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    We’ll reach out 24 hours before your appointment.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Service Date & Time</h3>
                      <p className="text-gray-900 font-medium">
                        {format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy')} at {booking.booking_time}
                      </p>
                    </div>
                  </div>
                  {calendarLinks && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Button asChild variant="outline" className="h-auto rounded-full border-slate-300 px-4 py-1">
                        <a href={calendarLinks.google} target="_blank" rel="noopener noreferrer">
                          Add to Google Calendar
                        </a>
                      </Button>
                      <Button asChild variant="outline" className="h-auto rounded-full border-slate-300 px-4 py-1">
                        <a href={calendarLinks.outlook} target="_blank" rel="noopener noreferrer">
                          Add to Outlook
                        </a>
                      </Button>
                      <Button asChild variant="outline" className="h-auto rounded-full border-slate-300 px-4 py-1">
                        <a href={calendarLinks.ics} download="shalean-booking.ics">
                          Download .ics
                        </a>
                      </Button>
                    </div>
                  )}
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
            <CardContent className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">What Happens Next?</h2>
                <p className="text-sm text-slate-600">
                  A quick guide to help you get the most out of your clean.
                </p>
              </div>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <span>Check your inbox for the confirmation email and receipt. Save it for easy access.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <span>Set a reminder — we recommend being home 15 minutes before your cleaner arrives.</span>
                </li>
                <li className="flex items-start gap-3">
                  <ListChecks className="h-5 w-5 text-primary mt-0.5" />
                  <span>Clear surfaces, secure pets, and note any access details so the team can dive straight in.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Explore More */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button size="lg" className="flex-1 bg-primary hover:bg-primary/90" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="flex-1 border-slate-300 hover:bg-slate-50" asChild>
              <Link href="/dashboard/bookings">
                <Repeat className="mr-2 h-4 w-4" />
                Manage Booking
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="flex-1 border-slate-300 hover:bg-slate-50" asChild>
              <Link href="/booking/service/select">
                <Smile className="mr-2 h-4 w-4" />
                Book Another Service
              </Link>
            </Button>
          </div>

          {/* Share Your Experience Section */}
          <div className="mt-12 grid gap-4 rounded-xl bg-primary/5 p-6 sm:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Book regularly & save</h3>
              <p className="text-gray-600 text-sm">
                Switch to a weekly or bi-weekly plan and save up to 15% on every clean. We’ll keep the same cleaner whenever possible.
              </p>
              <Button asChild variant="outline" className="rounded-full border-primary/40 text-primary hover:bg-primary/10">
                <Link href="/booking/service/select?frequency=weekly">
                  <Repeat className="mr-2 h-4 w-4" />
                  Explore recurring options
                </Link>
              </Button>
            </div>
            <div className="space-y-3 text-center sm:text-left">
              <h3 className="font-semibold text-gray-900">Share Shalean</h3>
              <p className="text-gray-600 text-sm">
                Know someone who needs a spotless home? Share your experience and earn rewards when they book.
              </p>
              <div className="flex justify-center sm:justify-start">
                <SocialShareButtons 
                  url="https://shalean.co.za"
                  title="I just booked professional cleaning services with Shalean Cleaning Services in Cape Town. Great service, highly recommend! 🧹✨"
                  showLabel={false}
                />
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-12 text-center p-6 bg-gray-50 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900">Need Help?</h3>
            <p className="text-gray-600 text-sm max-w-xl mx-auto">
              Our customer service team is on standby if you need to reschedule, add extras, or update access info.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline" className="h-auto rounded-full border-slate-300 px-4 py-2">
                <Link href="tel:+27871535250">
                  <Phone className="mr-2 h-4 w-4" />
                  Call +27 87 153 5250
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto rounded-full border-slate-300 px-4 py-2">
                <Link href="mailto:hello@shalean.com">
                  <Mail className="mr-2 h-4 w-4" />
                  Email hello@shalean.com
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <BookingFooter />
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}

