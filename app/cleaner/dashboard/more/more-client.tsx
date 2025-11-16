'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DayAvailabilityDisplay } from '@/components/admin/day-availability-display';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import { DollarSign, Settings } from 'lucide-react';

interface CleanerSession {
  id: string;
  name: string;
  phone: string;
  photo_url: string | null;
  rating: number;
  areas: string[];
  is_available: boolean;
  available_monday?: boolean;
  available_tuesday?: boolean;
  available_wednesday?: boolean;
  available_thursday?: boolean;
  available_friday?: boolean;
  available_saturday?: boolean;
  available_sunday?: boolean;
}

interface MoreClientProps {
  cleaner: CleanerSession;
}

export function MoreClient({ cleaner }: MoreClientProps) {
  const [monthlyStats, setMonthlyStats] = useState({
    totalEarnings: 0,
    bookingCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch monthly stats
  useEffect(() => {
    const fetchMonthlyStats = async () => {
      try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const response = await fetch(`/api/cleaner/bookings?startDate=${firstDay}&endDate=${lastDay}`);
        const data = await response.json();

        if (data.ok && data.bookings) {
          const completedBookings = data.bookings.filter((b: any) => b.status === 'completed');
          const totalEarnings = completedBookings.reduce(
            (sum: number, b: any) => sum + (b.cleaner_earnings || 0),
            0
          );
          setMonthlyStats({
            totalEarnings,
            bookingCount: completedBookings.length,
          });
        }
      } catch (error) {
        console.error('Error fetching monthly stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthlyStats();
  }, []);

  const formatCurrency = (cents: number) => {
    if (!cents || cents === 0) return 'R0.00';
    return `R${(cents / 100).toFixed(2)}`;
  };

  const getCurrentMonthName = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[new Date().getMonth()];
  };

  const availableDaysCount = Object.entries(cleaner).filter(
    ([key, val]) => key.startsWith('available_') && val === true
  ).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Blue Header */}
      <header className="bg-[#3b82f6] text-white py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <DollarSign className="h-6 w-6" strokeWidth={2} />
          <h1 className="text-lg font-semibold">Earnings</h1>
          <DollarSign className="h-6 w-6" strokeWidth={2} />
        </div>
      </header>

      {/* Blue Banner */}
      <div className="bg-[#3b82f6] text-white py-6 px-4">
        <p className="text-base max-w-md mx-auto">Earnings</p>
      </div>

      {/* Main Content */}
      <main className="bg-white pb-24">
        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* Monthly Earnings Card */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-[#3b82f6] mb-4">
                {getCurrentMonthName()} Earnings
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Total Earned */}
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {isLoading ? '...' : formatCurrency(monthlyStats.totalEarnings)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Total earned</div>
                </div>

                {/* Booking Count */}
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {isLoading ? '...' : monthlyStats.bookingCount}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Booking count</div>
                </div>
              </div>

              {monthlyStats.bookingCount === 0 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Once you've completed your first booking, you'll start seeing the money roll in here.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Skills & Rates Card */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-[#3b82f6] mb-4">
                Weekly Schedule
              </h3>
              
              <div className="flex items-start gap-3 mb-4">
                <Settings className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 flex-1">
                  Your weekly schedule shows which days you're available to work. Contact admin to update your schedule.
                </p>
              </div>

              {/* Schedule Display */}
              <div className="mb-4">
                <DayAvailabilityDisplay schedule={cleaner} compact={false} />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {availableDaysCount} days per week
                </p>
              </div>

              <Button
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white border border-[#3b82f6]"
                onClick={() => {
                  // Could link to contact admin or show info
                  alert('Please contact your administrator to update your weekly schedule.');
                }}
              >
                Update Schedule
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />

      {/* Bottom Spacer */}
      <div className="h-20 sm:h-0" />
    </div>
  );
}

