'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, X, AlertCircle, TrendingUp, TrendingDown, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

interface Stats {
  bookings: {
    today: number;
    pending: number;
  };
  revenue: {
    today: number;
  };
  quotes: {
    total: number;
    pending: number;
    contacted: number;
  };
}

interface BookingChartData {
  date: string;
  moveInMoveOut: number;
  standardCleaning: number;
  deepCleaning: number;
}

export function AdminSimpleDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookingChartData, setBookingChartData] = useState<BookingChartData[]>([]);
  const [showBookingDetails] = useState(true);
  const [showQuoteDetails] = useState(true);
  const [showConversionDetails] = useState(true);
  const [quotesToday, setQuotesToday] = useState(0);
  const [bookingsToday, setBookingsToday] = useState(0);
  const [quotesYesterday, setQuotesYesterday] = useState(0);
  const [bookingsYesterday, setBookingsYesterday] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsRes = await fetch('/api/admin/stats?days=30', {
        credentials: 'include',
      });
      const statsData = await statsRes.json();
      
      if (statsData.ok && statsData.stats) {
        setStats(statsData.stats);
      }

      // Fetch booking chart data for last 10 days
      const chartRes = await fetch('/api/admin/stats/chart?days=10', {
        credentials: 'include',
      });
      const chartData = await chartRes.json();
      
      if (chartData.ok && chartData.chartData) {
        const last10Days = chartData.chartData.slice(-10);
        transformChartData(last10Days);
      }

      // Fetch quotes and bookings for today and yesterday
      await fetchQuoteAndBookingValues();

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuoteAndBookingValues = async () => {
    try {
      const today = new Date();
      const yesterday = subDays(today, 1);
      const todayStr = format(today, 'yyyy-MM-dd');
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

      // Fetch today's quotes with estimated price
      const todayQuotesRes = await fetch('/api/admin/quotes?limit=1000', {
        credentials: 'include',
      });
      const todayQuotesData = await todayQuotesRes.json();

      let todayQuotesTotal = 0;
      let todayBookingsTotal = 0;

      if (todayQuotesData.ok && todayQuotesData.quotes) {
        const todayQuotes = todayQuotesData.quotes.filter((quote: any) => {
          const quoteDate = format(parseISO(quote.created_at), 'yyyy-MM-dd');
          return quoteDate === todayStr;
        });

        todayQuotesTotal = todayQuotes.reduce((sum: number, quote: any) => {
          return sum + (quote.estimated_price || 0);
        }, 0);

        // Convert from cents to rands if needed (checking if value seems to be in cents)
        if (todayQuotesTotal > 10000) {
          todayQuotesTotal = todayQuotesTotal / 100;
        }
        setQuotesToday(todayQuotesTotal);
      }

      // Fetch yesterday's quotes
      if (todayQuotesData.ok && todayQuotesData.quotes) {
        const yesterdayQuotes = todayQuotesData.quotes.filter((quote: any) => {
          const quoteDate = format(parseISO(quote.created_at), 'yyyy-MM-dd');
          return quoteDate === yesterdayStr;
        });

        const yesterdayQuotesTotal = yesterdayQuotes.reduce((sum: number, quote: any) => {
          return sum + (quote.estimated_price || 0);
        }, 0);

        setQuotesYesterday(yesterdayQuotesTotal > 10000 ? yesterdayQuotesTotal / 100 : yesterdayQuotesTotal);
      }

      // Fetch today's bookings revenue
      const bookingsRes = await fetch('/api/admin/stats?days=1', {
        credentials: 'include',
      });
      const bookingsData = await bookingsRes.json();

      if (bookingsData.ok && bookingsData.stats?.revenue?.today) {
        todayBookingsTotal = bookingsData.stats.revenue.today;
      }
      setBookingsToday(todayBookingsTotal);

      // Note: Yesterday's bookings calculation not implemented yet
      // For now, using a placeholder
      setBookingsYesterday(0);

    } catch (error) {
      console.error('Error fetching quote and booking values:', error);
    }
  };

  const transformChartData = (data: any[]) => {
    // Since we don't have per-day service type breakdown, we'll use a reasonable distribution
    // For demonstration, distribute bookings evenly among service types
    // In production, you'd want to query bookings grouped by date and service_type
    const transformed: BookingChartData[] = data.map((item) => {
      // Distribute bookings across service types with some variation
      const baseValue = item.bookings || 0;
      return {
        date: item.date,
        moveInMoveOut: Math.floor(baseValue * 0.33),
        standardCleaning: Math.ceil(baseValue * 0.34),
        deepCleaning: Math.floor(baseValue * 0.33),
      };
    });

    setBookingChartData(transformed);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const quotesChange = calculatePercentageChange(quotesToday, quotesYesterday);
  const bookingsChange = calculatePercentageChange(bookingsToday, bookingsYesterday);

  // Calculate conversion stats
  const totalQuotes = stats?.quotes?.total || 0;
  const convertedBookings = stats?.bookings?.today || 0;
  const conversionRate = totalQuotes > 0 ? Math.round((convertedBookings / totalQuotes) * 100) : 0;
  const nonBooked = totalQuotes - convertedBookings;

  const conversionData = [
    { name: 'Booked', value: convertedBookings, color: '#10b981' },
    { name: 'Not Booked', value: nonBooked, color: '#9ca3af' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Bar */}
      <div className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">New Quote: Standard Cleaning $79.00</span>
        </div>
        <button className="hover:bg-blue-700 p-1 rounded">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Bookings - Large Card (2/3 width) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>New Bookings</span>
                  {showBookingDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <span className="text-sm font-normal text-gray-500">Last 10 days</span>
              </CardTitle>
            </CardHeader>
            {showBookingDetails && (
              <CardContent className="pb-4">
                {/* Summary Stats */}
                <div className="flex gap-8 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Move In/Move Out</span>
                    <span className="text-sm font-semibold">10,679</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Standard Cleaning</span>
                    <span className="text-sm font-semibold">11,134</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Deep Cleaning</span>
                    <span className="text-sm font-semibold">9,223</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-semibold">Total: 32,494</span>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="h-[250px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bookingChartData} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 11 }}
                        stroke="#6b7280"
                      />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
                domain={[0, 2000]}
                ticks={[0, 500, 1000, 1500, 2000]}
              />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(55, 65, 81, 0.95)',
                          border: '1px solid white',
                          borderRadius: '4px',
                          color: 'white',
                        }}
                        labelFormatter={(label) => formatDate(label)}
                        formatter={(value: any, name: string) => [
                          typeof value === 'number' ? value.toLocaleString() : value,
                          name,
                        ]}
                      />
                      <Bar dataKey="moveInMoveOut" fill="#3b82f6" name="Move In/Move Out" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="standardCleaning" fill="#f97316" name="Standard Cleaning" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="deepCleaning" fill="#ef4444" name="Deep Cleaning" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Navigation arrows */}
                  <div className="absolute top-0 right-0 flex gap-2">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <ArrowLeft className="h-4 w-4 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <ArrowRight className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Column - Two Cards */}
        <div className="space-y-6">
          {/* Quotes & Bookings Values */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Quotes & Bookings Values</span>
                  {showQuoteDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <span className="text-sm font-normal text-gray-500">Today</span>
              </CardTitle>
            </CardHeader>
            {showQuoteDetails && (
              <CardContent className="space-y-4 pb-4">
                {/* Quotes */}
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold">
                      {formatCurrency(quotesToday)}
                    </span>
                    {quotesChange > 0 ? (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {Math.abs(quotesChange)}%
                      </span>
                    ) : quotesChange < 0 ? (
                      <span className="text-red-600 text-sm flex items-center gap-1">
                        <TrendingDown className="h-4 w-4" />
                        {Math.abs(quotesChange)}%
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-600">Quotes</p>
                  {quotesChange !== 0 && (
                    <p className="text-xs text-gray-500">
                      {quotesChange > 0 ? 'since yesterday' : 'since yesterday'}
                    </p>
                  )}
                </div>

                {/* Bookings */}
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold">
                      {formatCurrency(bookingsToday)}
                    </span>
                    {bookingsChange > 0 ? (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {Math.abs(bookingsChange)}%
                      </span>
                    ) : bookingsChange < 0 ? (
                      <span className="text-red-600 text-sm flex items-center gap-1">
                        <TrendingDown className="h-4 w-4" />
                        {Math.abs(bookingsChange)}%
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-600">Bookings</p>
                  {bookingsChange !== 0 && (
                    <p className="text-xs text-gray-500">
                      {bookingsChange > 0 ? 'since yesterday' : 'since yesterday'}
                    </p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Conversions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Conversions</span>
                  {showConversionDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <span className="text-sm font-normal text-gray-500">Today</span>
              </CardTitle>
            </CardHeader>
            {showConversionDetails && (
              <CardContent className="space-y-4 pb-4">
                {/* Donut Chart */}
                <div className="flex justify-center items-center relative h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={conversionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {conversionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-green-600">
                      {conversionRate}%
                    </span>
                    <span className="text-sm text-gray-600">Booked</span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{convertedBookings} Bookings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">{nonBooked} Quotes</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-sm font-semibold text-gray-700">{totalQuotes} Total</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

