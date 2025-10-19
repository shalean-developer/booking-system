'use client';

import { useState, useEffect } from 'react';
import { CleanerHeader } from '@/components/cleaner/cleaner-header';
import { LocationTracker } from '@/components/cleaner/location-tracker';
import { MyBookings } from '@/components/cleaner/my-bookings';
import { AvailableBookings } from '@/components/cleaner/available-bookings';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DayAvailabilityDisplay } from '@/components/admin/day-availability-display';
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Briefcase,
  TrendingUp,
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
  const [activeTab, setActiveTab] = useState<'my-bookings' | 'available'>('my-bookings');

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

        if (todayData.ok && monthData.ok) {
          // Calculate today's stats
          const todayBookings = todayData.bookings.length;
          const completedToday = todayData.bookings.filter((b: any) => b.status === 'completed').length;
          const todayEarnings = todayData.bookings
            .filter((b: any) => b.status === 'completed')
            .reduce((sum: number, b: any) => sum + (b.cleaner_earnings || 0), 0);

          // Calculate monthly stats from ALL bookings, not just the filtered monthly API
          const monthlyBookings = allBookingsData.bookings.length;
          const monthlyCompleted = allBookingsData.bookings.filter((b: any) => b.status === 'completed').length;
          const monthlyEarnings = allBookingsData.bookings
            .filter((b: any) => b.status === 'completed')
            .reduce((sum: number, b: any) => sum + (b.cleaner_earnings || 0), 0);

          console.log('📊 Monthly Stats Debug:', {
            monthlyBookings,
            monthlyCompleted,
            monthlyEarnings,
            allBookings: monthData.bookings,
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
    return `R${(cents / 100).toFixed(2)}`;
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
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {cleaner.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage your bookings and find new jobs in your area
          </p>
        </div>

        {/* My Weekly Schedule Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                My Weekly Schedule
              </h3>
              <Badge variant="outline" className="text-xs">
                {Object.entries(cleaner).filter(([key, val]) => 
                  key.startsWith('available_') && val === true
                ).length} days/week
              </Badge>
            </div>
            <DayAvailabilityDisplay 
              schedule={cleaner} 
              compact={false}
            />
            <p className="text-sm text-gray-500 mt-3">
              Your schedule is set by your manager. Contact admin to request changes.
            </p>
          </CardContent>
        </Card>

        {/* Location Tracker */}
        <div className="mb-6">
          <LocationTracker />
        </div>

        {/* Quick Stats */}
        <div className="mb-4">
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
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalEarnings)}
                  </div>
                  <div className="text-sm text-gray-500">Today's Earnings</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Stats */}
        <div className="mt-8 mb-4">
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
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.monthlyEarnings)}
                  </div>
                  <div className="text-sm text-gray-500">This Month's Earnings</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="my-bookings" className="text-sm sm:text-base">
              <Calendar className="h-4 w-4 mr-2" />
              My Bookings
            </TabsTrigger>
            <TabsTrigger value="available" className="text-sm sm:text-base">
              <Briefcase className="h-4 w-4 mr-2" />
              Available Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-bookings">
            <Card className="border-2">
              <CardContent className="p-4 sm:p-6">
                <MyBookings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="available">
            <Card className="border-2">
              <CardContent className="p-4 sm:p-6">
                <AvailableBookings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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

      {/* Mobile Bottom Navigation Spacer */}
      <div className="h-20 sm:h-0" />
    </div>
  );
}

