'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';
import { supabase } from '@/lib/supabase-client';
import { safeLogout, safeGetSession } from '@/lib/logout-utils';
import { 
  User, 
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  CheckCircle,
  Loader2,
  Briefcase,
  Home,
  Mail,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
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
}

interface CustomerData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  totalBookings: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        // Check authentication using safe session check
        const session = await safeGetSession(supabase);
        
        if (!session || !session.user) {
          console.log('Not authenticated, redirecting to login...');
          router.push('/login');
          return;
        }
        
        const authUser = session.user;

        console.log('User authenticated:', authUser.email);
        setUser(authUser);

        // Fetch bookings and customer data
        console.log('Fetching dashboard bookings from API...');

        // Get session token for API call
        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          throw new Error('No active session');
        }

        const response = await fetch('/api/dashboard/bookings', {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });
        console.log('API Response status:', response.status);
        console.log('API Response ok:', response.ok);

        const data = await response.json();
        console.log('API Response data:', data);

        if (!response.ok || !data.ok) {
          console.error('API returned error:', data);
          throw new Error(data.error || 'Failed to fetch bookings');
        }

        setCustomer(data.customer);
        setBookings(data.bookings);
        setIsLoading(false);

      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [router]);

  const handleSignOut = async () => {
    await safeLogout(supabase, router, {
      onSuccess: () => {
        console.log('🏁 Dashboard logout completed successfully');
      },
      onError: (error) => {
        console.error('❌ Dashboard logout failed:', error);
      }
    });
  };

  // Calculate stats
  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(b.booking_date);
    return bookingDate >= new Date();
  }).length;

  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <p className="text-sm text-gray-500 mb-6">Check browser console for detailed error information</p>
              <Button onClick={() => router.push('/')}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
      <Header />

      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Welcome back, {customer?.firstName || user?.user_metadata?.first_name || 'there'}! 👋
                </h1>
                <p className="text-gray-600">
                  Manage your bookings and profile from your dashboard
                </p>
              </div>
              <Button variant="outline" onClick={handleSignOut} className="whitespace-nowrap">
                Sign Out
              </Button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8"
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{customer?.totalBookings || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Upcoming</p>
                    <p className="text-3xl font-bold text-gray-900">{upcomingBookings}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Completed</p>
                    <p className="text-3xl font-bold text-gray-900">{completedBookings}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Content - Bookings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Recent Bookings</h2>
                    {bookings.length > 5 && (
                      <Button variant="ghost" size="sm" className="text-primary">
                        View All
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {bookings.length === 0 ? (
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
                    <div className="space-y-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <div
                          key={booking.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{booking.service_type}</h3>
                                <Badge 
                                  variant={booking.status === 'completed' ? 'default' : 'outline'}
                                  className={cn(
                                    'text-xs',
                                    booking.status === 'completed' && 'bg-green-100 text-green-800 border-green-200',
                                    booking.status === 'confirmed' && 'bg-blue-100 text-blue-800 border-blue-200',
                                    booking.status === 'pending' && 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  )}
                                >
                                  {booking.status}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(booking.booking_date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>{booking.booking_time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{booking.address_line1}, {booking.address_suburb}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-left sm:text-right">
                              {booking.total_amount ? (
                                <p className="text-2xl font-bold text-primary">R{(booking.total_amount / 100).toFixed(2)}</p>
                              ) : (
                                <p className="text-sm text-gray-500">Price not available</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Booked {new Date(booking.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar - Profile & Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="space-y-6"
            >
              {/* Profile Card */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {customer?.firstName && customer?.lastName 
                        ? `${customer.firstName} ${customer.lastName}`
                        : user?.user_metadata?.first_name || 'User'}
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{user?.email}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-xs text-gray-600 mb-1">Member Since</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(user?.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <Button variant="outline" className="w-full" disabled>
                    Edit Profile
                    <span className="ml-2 text-xs">(Coming Soon)</span>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                      <Link href="/booking/service/select">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Book a Service
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Back to Home
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

