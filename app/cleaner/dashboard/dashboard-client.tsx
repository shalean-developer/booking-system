'use client';

import { useState, useEffect } from 'react';
import { CleanerHeader } from '@/components/cleaner/cleaner-header';
import { LocationTracker } from '@/components/cleaner/location-tracker';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DayAvailabilityDisplay } from '@/components/admin/day-availability-display';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Briefcase,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CleanerSession {
  id: string;
  name: string;
  phone: string;
  photo_url: string | null;
  areas: string[];
  is_available: boolean;
  rating: number;
  available_monday?: boolean;
  available_tuesday?: boolean;
  available_wednesday?: boolean;
  available_thursday?: boolean;
  available_friday?: boolean;
  available_saturday?: boolean;
  available_sunday?: boolean;
}

interface CleanerDashboardClientProps {
  cleaner: CleanerSession;
}

export function CleanerDashboardClient({ cleaner }: CleanerDashboardClientProps) {
  const [localCleaner, setLocalCleaner] = useState(cleaner);
  const [stats, setStats] = useState({
    todayBookings: 0,
    completedToday: 0,
    totalEarnings: 0,
    monthlyBookings: 0,
    monthlyCompleted: 0,
    monthlyEarnings: 0,
  });
  const [showTodayPerformance, setShowTodayPerformance] = useState(false);
  const [showMonthlyPerformance, setShowMonthlyPerformance] = useState(false);

  // Fetch today's and monthly stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get first and last day of current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        console.log('📅 Date Range Debug:', {
          today,
          firstDay,
          lastDay,
          currentMonth: now.getMonth() + 1,
          currentYear: now.getFullYear(),
          cleanerId: cleaner.id,
          cleanerName: cleaner.name
        });

        // Fetch today's bookings
        const todayResponse = await fetch(`/api/cleaner/bookings?startDate=${today}&endDate=${today}`);
        const todayData = await todayResponse.json();

        // Fetch monthly bookings
        const monthResponse = await fetch(`/api/cleaner/bookings?startDate=${firstDay}&endDate=${lastDay}`);
        const monthData = await monthResponse.json();

        // Debug: Fetch ALL bookings for this cleaner to see what's available
        const allBookingsResponse = await fetch('/api/cleaner/bookings');
        const allBookingsData = await allBookingsResponse.json();

        // Debug: Also fetch bookings by status to see if completed bookings exist
        const completedResponse = await fetch('/api/cleaner/bookings?status=completed');
        const completedData = await completedResponse.json();

        console.log('📊 API Response Debug:', {
          todayData: todayData,
          monthData: monthData,
          monthDataBookings: monthData.bookings,
          allBookingsData: allBookingsData,
          allBookings: allBookingsData.bookings,
          completedData: completedData,
          completedBookings: completedData.bookings
        });

        // Enhanced debugging for earnings calculation
        console.log('💰 Earnings Debug Details:', {
          todayBookings: todayData.bookings,
          todayCompleted: todayData.bookings.filter((b: any) => b.status === 'completed'),
          todayEarningsRaw: todayData.bookings
            .filter((b: any) => b.status === 'completed')
            .map((b: any) => ({ id: b.id, cleaner_earnings: b.cleaner_earnings, total_amount: b.total_amount })),
          monthlyBookings: monthData.bookings,
          monthlyCompleted: monthData.bookings.filter((b: any) => b.status === 'completed'),
          monthlyEarningsRaw: monthData.bookings
            .filter((b: any) => b.status === 'completed')
            .map((b: any) => ({ id: b.id, cleaner_earnings: b.cleaner_earnings, total_amount: b.total_amount }))
        });

        if (todayData.ok && monthData.ok) {
          // Calculate today's stats
          const todayBookings = todayData.bookings.length;
          const completedToday = todayData.bookings.filter((b: any) => b.status === 'completed').length;
          const todayEarnings = todayData.bookings
            .filter((b: any) => b.status === 'completed')
            .reduce((sum: number, b: any) => sum + (b.cleaner_earnings || 0), 0);

          // Calculate monthly stats from the filtered monthly bookings
          const monthlyBookings = monthData.bookings.length;
          const monthlyCompleted = monthData.bookings.filter((b: any) => b.status === 'completed').length;
          const monthlyEarnings = monthData.bookings
            .filter((b: any) => b.status === 'completed')
            .reduce((sum: number, b: any) => sum + (b.cleaner_earnings || 0), 0);

          console.log('📊 Monthly Stats Debug:', {
            monthlyBookings,
            monthlyCompleted,
            monthlyEarnings,
            monthlyBookingsData: monthData.bookings,
            completedBookings: monthData.bookings.filter((b: any) => b.status === 'completed'),
            bookingDetails: monthData.bookings.map((b: any) => ({
              id: b.id,
              status: b.status,
              cleaner_earnings: b.cleaner_earnings,
              booking_date: b.booking_date,
              total_amount: b.total_amount
            }))
          });

          setStats({
            todayBookings,
            completedToday,
            totalEarnings: todayEarnings,
            monthlyBookings,
            monthlyCompleted,
            monthlyEarnings,
          });

          console.log('📊 Stats Updated:', {
            todayBookings,
            completedToday,
            totalEarnings: todayEarnings,
            monthlyBookings,
            monthlyCompleted,
            monthlyEarnings,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAvailabilityChange = (isAvailable: boolean) => {
    setLocalCleaner({ ...localCleaner, is_available: isAvailable });
  };

  const formatCurrency = (cents: number) => {
    if (cents === 0) {
      return 'R0.00';
    }
    return `R${(cents / 100).toFixed(2)}`;
  };

  const getEarningsDisplay = (earnings: number, label: string) => {
    if (earnings === 0) {
      return (
        <div>
          <div className="text-2xl font-bold text-gray-900">R0.00</div>
          <div className="text-sm text-gray-500">{label}</div>
          <div className="text-xs text-gray-400 mt-1">No completed bookings yet</div>
        </div>
      );
    }
    return (
      <div>
        <div className="text-2xl font-bold text-gray-900">{formatCurrency(earnings)}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <CleanerHeader
        cleaner={localCleaner}
        onAvailabilityChange={handleAvailabilityChange}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Location Tracker */}
        <div className="mb-4">
          <LocationTracker />
        </div>

        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {cleaner.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage your bookings and find new jobs in your area
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowTodayPerformance(!showTodayPerformance)}
            className="flex-1 flex items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition-colors"
          >
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">Today's Performance</span>
            {showTodayPerformance ? (
              <ChevronUp className="h-4 w-4 text-blue-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-blue-600" />
            )}
          </button>
          <button
            onClick={() => setShowMonthlyPerformance(!showMonthlyPerformance)}
            className="flex-1 flex items-center justify-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-xl transition-colors"
          >
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">Monthly Performance</span>
            {showMonthlyPerformance ? (
              <ChevronUp className="h-4 w-4 text-purple-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-purple-600" />
            )}
          </button>
        </div>

        {/* My Weekly Schedule Card - Hidden when performance sections are visible */}
        {!showTodayPerformance && !showMonthlyPerformance && (
          <Card className="mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  My Weekly Schedule
                </h3>
                <Badge variant="outline" className="text-xs w-fit">
                  {Object.entries(cleaner).filter(([key, val]) => 
                    key.startsWith('available_') && val === true
                  ).length} days/week
                </Badge>
              </div>
              <div className="flex justify-center sm:justify-start">
                <DayAvailabilityDisplay 
                  schedule={cleaner} 
                  compact={false}
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-3 text-center sm:text-left">
                Your schedule is set by your manager. Contact admin to request changes.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Today's Performance Section */}
        {showTodayPerformance && (
          <>
            <div id="today-performance" className="mb-4 scroll-mt-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Today's Performance
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-blue-50">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.todayBookings}
                      </div>
                      <div className="text-sm text-gray-500">Today's Bookings</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-green-50">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.completedToday}
                      </div>
                      <div className="text-sm text-gray-500">Completed Today</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-primary/10">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    {getEarningsDisplay(stats.totalEarnings, "Today's Earnings")}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Monthly Performance Section */}
        {showMonthlyPerformance && (
          <>
            <div id="monthly-performance" className="mt-8 mb-4 scroll-mt-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                This Month's Performance
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-purple-50">
                      <Briefcase className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.monthlyBookings}
                      </div>
                      <div className="text-sm text-gray-500">This Month's Bookings</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-green-50">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.monthlyCompleted}
                      </div>
                      <div className="text-sm text-gray-500">Completed This Month</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-purple-50">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    {getEarningsDisplay(stats.monthlyEarnings, "This Month's Earnings")}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Service Areas Badge */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Your Service Areas:</span>
            {cleaner.areas.map((area) => (
              <Badge key={area} variant="outline" className="text-xs">
                {area}
              </Badge>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Tips for Success</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Keep your availability status updated</li>
                <li>• Respond promptly to bookings</li>
                <li>• Maintain high customer ratings</li>
                <li>• Enable location tracking for better job matching</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />

      {/* Mobile Bottom Navigation Spacer */}
      <div className="h-20 sm:h-0" />
    </div>
  );
}

