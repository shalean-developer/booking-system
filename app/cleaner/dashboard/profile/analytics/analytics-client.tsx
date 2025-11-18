'use client';

import { useState, useEffect } from 'react';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import { ArrowLeft, Loader2, TrendingUp, Calendar, DollarSign, CheckCircle, Clock, Star, MessageSquare, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CleanerSession {
  id: string;
  name: string;
  phone: string;
  photo_url: string | null;
  rating: number;
  areas: string[];
  is_available: boolean;
}

interface AnalyticsClientProps {
  cleaner: CleanerSession;
}

interface AnalyticsData {
  period: number;
  summary: {
    total_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
    pending_bookings: number;
    completion_rate: number;
    total_earnings: number;
    total_tips: number;
    avg_earnings_per_booking: number;
    avg_rating: number;
    avg_response_time_minutes: number;
    avg_job_duration_hours: number;
  };
  trends: {
    earnings_by_date: Array<{ date: string; earnings: number }>;
  };
  breakdowns: {
    service_types: Array<{ service: string; count: number; earnings: number; percentage: number }>;
  };
  insights: {
    best_days: Array<{ day: string; earnings: number }>;
    peak_hours: Array<{ hour: number; count: number }>;
  };
  reviews: {
    total_reviews: number;
    avg_overall_rating: number;
    avg_quality_rating: number;
    avg_punctuality_rating: number;
    avg_professionalism_rating: number;
    response_rate: number;
    rating_distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
    reviews_by_date: Array<{ date: string; count: number; avg_rating: number }>;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AnalyticsClient({ cleaner }: AnalyticsClientProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cleaner/analytics?period=${period}`);
      const data = await response.json();
      if (data.ok) {
        setAnalytics(data);
      } else {
        setError(data.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('An error occurred while loading analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const formatCurrency = (cents: number) => {
    if (!cents || cents === 0) return 'R0.00';
    return `R${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-[#3b82f6] text-white py-4 px-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Link href="/cleaner/dashboard/profile" className="p-1">
              <ArrowLeft className="h-6 w-6" strokeWidth={2} />
            </Link>
            <h1 className="text-lg font-semibold">Analytics</h1>
            <TrendingUp className="h-6 w-6" strokeWidth={2} />
          </div>
        </header>
        <main className="bg-white pb-24">
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
            </div>
          </div>
        </main>
        <CleanerMobileBottomNav />
        <div className="h-20 sm:h-0" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-[#3b82f6] text-white py-4 px-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Link href="/cleaner/dashboard/profile" className="p-1">
              <ArrowLeft className="h-6 w-6" strokeWidth={2} />
            </Link>
            <h1 className="text-lg font-semibold">Analytics</h1>
            <TrendingUp className="h-6 w-6" strokeWidth={2} />
          </div>
        </header>
        <main className="bg-white pb-24">
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Failed to load analytics'}</p>
              <button
                onClick={fetchAnalytics}
                className="px-4 py-2 bg-[#3b82f6] text-white rounded-md hover:bg-[#2563eb]"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
        <CleanerMobileBottomNav />
        <div className="h-20 sm:h-0" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#3b82f6] text-white py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Link href="/cleaner/dashboard/profile" className="p-1">
            <ArrowLeft className="h-6 w-6" strokeWidth={2} />
          </Link>
          <h1 className="text-lg font-semibold">Analytics</h1>
          <TrendingUp className="h-6 w-6" strokeWidth={2} />
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-white pb-24">
        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* Period Selector */}
          <div className="flex gap-2">
            {['7', '30', '90', '365'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-[#3b82f6] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === '7' ? '7d' : p === '30' ? '30d' : p === '90' ? '90d' : '1y'}
              </button>
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-3">
                <div className="text-xs text-gray-500 mb-1">Total Earnings</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(analytics.summary.total_earnings)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {analytics.summary.completed_bookings} bookings
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-3">
                <div className="text-xs text-gray-500 mb-1">Completion Rate</div>
                <div className="text-lg font-bold text-gray-900">
                  {analytics.summary.completion_rate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {analytics.summary.completed_bookings}/{analytics.summary.total_bookings}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-3">
                <div className="text-xs text-gray-500 mb-1">Avg per Booking</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(analytics.summary.avg_earnings_per_booking)}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {analytics.summary.avg_rating.toFixed(1)} rating
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-3">
                <div className="text-xs text-gray-500 mb-1">Total Tips</div>
                <div className="text-lg font-bold text-yellow-600">
                  {formatCurrency(analytics.summary.total_tips)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {analytics.summary.completed_bookings > 0
                    ? formatCurrency(Math.round(analytics.summary.total_tips / analytics.summary.completed_bookings))
                    : 'R0.00'}{' '}
                  avg
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Earnings Trend Chart */}
          {analytics.trends.earnings_by_date.length > 0 && (
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#3b82f6]" />
                  Earnings Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analytics.trends.earnings_by_date}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      style={{ fontSize: '10px' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickFormatter={(value) => `R${(value / 100).toFixed(0)}`}
                      style={{ fontSize: '10px' }}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => formatDate(label)}
                      contentStyle={{ fontSize: '12px', padding: '8px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="earnings"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Service Type Breakdown */}
          {analytics.breakdowns.service_types.length > 0 && (
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#3b82f6]" />
                  Service Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.breakdowns.service_types.map((service, index) => (
                    <div key={service.service} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900 capitalize">
                          {service.service.replace('-', ' ')}
                        </span>
                        <span className="text-gray-600">
                          {service.count} ({service.percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatCurrency(service.earnings)}</span>
                        <div className="flex-1 mx-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#3b82f6] rounded-full"
                            style={{ width: `${service.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Metrics */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#3b82f6]" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Response Time</span>
                <span className="text-sm font-semibold text-gray-900">
                  {analytics.summary.avg_response_time_minutes > 0
                    ? `${analytics.summary.avg_response_time_minutes} min`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Job Duration</span>
                <span className="text-sm font-semibold text-gray-900">
                  {analytics.summary.avg_job_duration_hours > 0
                    ? `${analytics.summary.avg_job_duration_hours} hrs`
                    : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          {analytics.insights.best_days.length > 0 && (
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#3b82f6]" />
                  Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-2">Best Days</div>
                  <div className="space-y-2">
                    {analytics.insights.best_days.map((day, index) => (
                      <div key={day.day} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{day.day}</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(day.earnings)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {analytics.insights.peak_hours.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Peak Hours</div>
                    <div className="space-y-2">
                      {analytics.insights.peak_hours.map((hour, index) => (
                        <div key={hour.hour} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">
                            {hour.hour}:00 - {hour.hour + 1}:00
                          </span>
                          <span className="font-semibold text-gray-900">{hour.count} bookings</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Review Analytics */}
          {analytics.reviews.total_reviews > 0 && (
            <>
              {/* Review Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-3">
                    <div className="text-xs text-gray-500 mb-1">Total Reviews</div>
                    <div className="text-lg font-bold text-gray-900">
                      {analytics.reviews.total_reviews}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {analytics.reviews.avg_overall_rating.toFixed(1)} avg
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-3">
                    <div className="text-xs text-gray-500 mb-1">Response Rate</div>
                    <div className="text-lg font-bold text-gray-900">
                      {analytics.reviews.response_rate}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round((analytics.reviews.total_reviews * analytics.reviews.response_rate) / 100)} responded
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Rating Breakdown */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-[#3b82f6]" />
                    Rating Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-gray-600 mb-1">Quality</div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{analytics.reviews.avg_quality_rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">Punctuality</div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{analytics.reviews.avg_punctuality_rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">Professionalism</div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{analytics.reviews.avg_professionalism_rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Distribution Chart */}
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Rating Distribution</div>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = analytics.reviews.rating_distribution[rating as keyof typeof analytics.reviews.rating_distribution];
                        const percentage = analytics.reviews.total_reviews > 0
                          ? (count / analytics.reviews.total_reviews) * 100
                          : 0;
                        return (
                          <div key={rating} className="flex items-center gap-2">
                            <div className="w-8 text-sm font-medium text-gray-700">
                              {rating}★
                            </div>
                            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-8 text-xs text-gray-600 text-right">
                              {count}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews Trend Chart */}
              {analytics.reviews.reviews_by_date.length > 0 && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-[#3b82f6]" />
                      Reviews Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.reviews.reviews_by_date}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          style={{ fontSize: '10px' }}
                          interval="preserveStartEnd"
                        />
                        <YAxis style={{ fontSize: '10px' }} />
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            if (name === 'count') return [`${value} reviews`, 'Count'];
                            if (name === 'avg_rating') return [`${value.toFixed(1)}★`, 'Avg Rating'];
                            return value;
                          }}
                          labelFormatter={(label) => formatDate(label)}
                          contentStyle={{ fontSize: '12px', padding: '8px' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* No Reviews Message */}
          {analytics.reviews.total_reviews === 0 && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No reviews yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Reviews will appear here once customers rate your service
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />

      {/* Bottom Spacer */}
      <div className="h-20 sm:h-0" />
    </div>
  );
}

