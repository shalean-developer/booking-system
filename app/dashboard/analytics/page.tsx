'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { NewHeader } from '@/components/dashboard/new-header';
import { MobileBottomNav } from '@/components/dashboard/mobile-bottom-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, TrendingUp, Calendar, DollarSign, Activity } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { devLog } from '@/lib/dev-logger';
import type { AuthUser, Customer } from '@/types/dashboard';

// Lazy load charts
const SpendingChart = dynamic(
  () => import('recharts').then((mod) => {
    const { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = mod;
    
    return function SpendingChartComponent({ data }: { data: { month: string; amount: number }[] }) {
      if (!data || data.length === 0) {
        return (
          <div className="h-[250px] flex items-center justify-center text-gray-500">
            No spending data available
          </div>
        );
      }

      return (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `R${(value / 100).toFixed(0)}`}
            />
            <Tooltip 
              formatter={(value: number) => [`R${(value / 100).toFixed(2)}`, 'Spending']}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="#14b8a6" 
              strokeWidth={2}
              name="Spending"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[250px] animate-pulse bg-gray-100 rounded" /> }
);

const ServiceFrequencyChart = dynamic(
  () => import('recharts').then((mod) => {
    const { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = mod;
    
    return function ServiceFrequencyChartComponent({ data }: { data: { service: string; count: number }[] }) {
      if (!data || data.length === 0) {
        return (
          <div className="h-[250px] flex items-center justify-center text-gray-500">
            No service data available
          </div>
        );
      }

      return (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="service" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number) => [value, 'Bookings']}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Bar 
              dataKey="count" 
              fill="#10b981" 
              name="Bookings"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[250px] animate-pulse bg-gray-100 rounded" /> }
);

interface Booking {
  id: string;
  booking_date: string;
  service_type: string;
  total_amount: number;
  status: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await safeGetSession(supabase);
        if (!session || !session.user) {
          router.push('/login?redirect=/dashboard/analytics');
          return;
        }

        setUser(session.user);

        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          setError('Session expired');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/dashboard/bookings?limit=100', {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.ok) {
          setBookings(data.bookings || []);
          setCustomer(data.customer);
        } else {
          setError(data.error || 'Failed to load analytics data');
        }
      } catch (err) {
        devLog.error('Error fetching analytics:', err);
        setError('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Calculate spending trends (last 6 months)
  const spendingTrends = useMemo(() => {
    const sixMonthsAgo = subMonths(new Date(), 6);
    const months = eachMonthOfInterval({
      start: startOfMonth(sixMonthsAgo),
      end: endOfMonth(new Date()),
    });

    const monthlySpending: Record<string, number> = {};
    
    months.forEach(month => {
      const monthKey = format(month, 'MMM yyyy');
      monthlySpending[monthKey] = 0;
    });

    bookings.forEach(booking => {
      if (booking.status === 'completed' && booking.total_amount) {
        const bookingDate = new Date(booking.booking_date);
        if (bookingDate >= sixMonthsAgo) {
          const monthKey = format(bookingDate, 'MMM yyyy');
          if (monthlySpending[monthKey] !== undefined) {
            monthlySpending[monthKey] += booking.total_amount;
          }
        }
      }
    });

    return Object.entries(monthlySpending).map(([month, amount]) => ({
      month,
      amount,
    }));
  }, [bookings]);

  // Calculate service frequency
  const serviceFrequency = useMemo(() => {
    const serviceCounts: Record<string, number> = {};
    
    bookings.forEach(booking => {
      if (booking.service_type) {
        serviceCounts[booking.service_type] = (serviceCounts[booking.service_type] || 0) + 1;
      }
    });

    return Object.entries(serviceCounts)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count);
  }, [bookings]);

  // Calculate statistics
  const stats = useMemo(() => {
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const totalSpent = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const averageBooking = completedBookings.length > 0 
      ? totalSpent / completedBookings.length 
      : 0;
    const thisMonth = new Date();
    const thisMonthSpent = completedBookings
      .filter(b => {
        const bookingDate = new Date(b.booking_date);
        return bookingDate.getMonth() === thisMonth.getMonth() &&
               bookingDate.getFullYear() === thisMonth.getFullYear();
      })
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const lastMonth = subMonths(new Date(), 1);
    const lastMonthSpent = completedBookings
      .filter(b => {
        const bookingDate = new Date(b.booking_date);
        return bookingDate.getMonth() === lastMonth.getMonth() &&
               bookingDate.getFullYear() === lastMonth.getFullYear();
      })
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const spendingChange = lastMonthSpent > 0 
      ? ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100 
      : 0;

    return {
      totalBookings: bookings.length,
      completedBookings: completedBookings.length,
      totalSpent,
      averageBooking,
      thisMonthSpent,
      spendingChange,
    };
  }, [bookings]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white">
        <NewHeader user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
        <MobileBottomNav activeTab="more" onTabChange={() => {}} />
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
        <MobileBottomNav activeTab="more" onTabChange={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white pb-32 lg:pb-0">
      <NewHeader user={user} customer={customer} />
      
      <main className="py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-teal-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                      <p className="text-2xl font-bold text-gray-900">
                        R{(stats.totalSpent / 100).toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-teal-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Average Booking</p>
                      <p className="text-2xl font-bold text-gray-900">
                        R{(stats.averageBooking / 100).toFixed(2)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-teal-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">This Month</p>
                      <p className="text-2xl font-bold text-gray-900">
                        R{(stats.thisMonthSpent / 100).toFixed(2)}
                      </p>
                      {stats.spendingChange !== 0 && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${
                          stats.spendingChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className={`h-3 w-3 ${stats.spendingChange < 0 ? 'rotate-180' : ''}`} />
                          {Math.abs(stats.spendingChange).toFixed(1)}% vs last month
                        </p>
                      )}
                    </div>
                    <Activity className="h-8 w-8 text-teal-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Spending Trends</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Last 6 months</p>
              </CardHeader>
              <CardContent>
                <SpendingChart data={spendingTrends} />
              </CardContent>
            </Card>

            {/* Service Frequency */}
            <Card>
              <CardHeader>
                <CardTitle>Service Frequency</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Most booked services</p>
              </CardHeader>
              <CardContent>
                <ServiceFrequencyChart data={serviceFrequency} />
              </CardContent>
            </Card>
          </div>

          {/* Service Breakdown */}
          {serviceFrequency.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Service Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {serviceFrequency.map((item, index) => {
                    const percentage = (item.count / stats.totalBookings) * 100;
                    return (
                      <motion.div
                        key={item.service}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900">{item.service}</span>
                          <span className="text-gray-600">{item.count} bookings ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-teal-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {bookings.length === 0 && (
            <Card className="border-2 border-dashed border-teal-300 bg-teal-50/30">
              <CardContent className="p-8 text-center">
                <Activity className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No analytics data yet</h2>
                <p className="text-gray-600 mb-6">Complete some bookings to see your spending trends and insights</p>
                <Button asChild className="bg-gradient-to-r from-teal-500 to-green-500">
                  <a href="/booking/service/select">Book a Service</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <MobileBottomNav activeTab="more" onTabChange={() => {}} />
    </div>
  );
}
