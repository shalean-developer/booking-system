'use client';

import { NotificationBar } from './cards/notification-bar';
import { NewBookingsCard } from './cards/new-bookings-card';
import { QuotesBookingsCard } from './cards/quotes-bookings-card';
import { ConversionsCard } from './cards/conversions-card';
import { RevenueCard } from './cards/revenue-card';
import { CustomersCard } from './cards/customers-card';
import { SixthCard } from './cards/sixth-card';
import useSWR from 'swr';
import { format, subDays, startOfDay } from 'date-fns';

// Transform API data for cards
interface ChartDataPoint {
  date: string;
  revenue?: number;
  bookings?: number;
  moveInMoveOut?: number;
  standardCleaning?: number;
  deepCleaning?: number;
  newCustomers?: number;
  recurringCustomers?: number;
  returningCustomers?: number;
}

export function DashboardRedesigned() {
  // Fetch stats data
  const { data: statsData } = useSWR(
    '/api/admin/stats?days=30',
    async (url) => {
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      return data.ok ? data.stats : null;
    }
  );

  // Fetch chart data for last 10 days
  const { data: chartData } = useSWR(
    '/api/admin/stats/chart?days=10',
    async (url) => {
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      return data.ok ? data.chartData : [];
    }
  );

  // Transform booking chart data by service type
  const transformBookingData = (data: any[]): Array<{ date: string; moveInMoveOut: number; standardCleaning: number; deepCleaning: number }> => {
    if (!data || data.length === 0) return [];
    
    // Group by date and service type
    const grouped: Record<string, { moveInMoveOut: number; standardCleaning: number; deepCleaning: number }> = {};
    
    data.forEach((item: any) => {
      const date = item.date || item.booking_date;
      if (!date) return;
      
      if (!grouped[date]) {
        grouped[date] = { moveInMoveOut: 0, standardCleaning: 0, deepCleaning: 0 };
      }
      
      const serviceType = (item.service_type || item.serviceType || '').toLowerCase();
      const count = item.bookings || item.count || 1;
      
      if (serviceType.includes('move in') || serviceType.includes('move out')) {
        grouped[date].moveInMoveOut += count;
      } else if (serviceType.includes('deep')) {
        grouped[date].deepCleaning += count;
      } else {
        grouped[date].standardCleaning += count;
      }
    });
    
    return Object.entries(grouped).map(([date, counts]) => ({
      date,
      moveInMoveOut: counts.moveInMoveOut || 0,
      standardCleaning: counts.standardCleaning || 0,
      deepCleaning: counts.deepCleaning || 0,
    }));
  };

  // Calculate totals from data
  const bookingChartData = transformBookingData(chartData || []);
  const totalBookings = bookingChartData.reduce((sum, d) => 
    sum + (d.moveInMoveOut || 0) + (d.standardCleaning || 0) + (d.deepCleaning || 0), 0
  );
  const moveInMoveOutTotal = bookingChartData.reduce((sum, d) => sum + (d.moveInMoveOut || 0), 0);
  const standardCleaningTotal = bookingChartData.reduce((sum, d) => sum + (d.standardCleaning || 0), 0);
  const deepCleaningTotal = bookingChartData.reduce((sum, d) => sum + (d.deepCleaning || 0), 0);

  // Revenue data
  const revenueData = (chartData || []).map((item: any) => ({
    date: item.date || item.booking_date,
    revenue: item.revenue || item.total_price || 0,
  }));

  // Calculate quotes and bookings values
  const quotesToday = statsData?.quotes?.today || 0;
  const bookingsToday = statsData?.revenue?.today || 0;
  
  // Get yesterday's data (simplified - in production would fetch separately)
  const quotesChange = statsData?.quotes?.change || 42;
  const bookingsChange = statsData?.revenue?.change || -16;

  // Conversions data
  const bookings = statsData?.bookings?.today || 19;
  const quotes = statsData?.quotes?.pending || 58;

  // Customer data (simplified - would need separate API endpoint)
  const customerData: Array<{ date: string; newCustomers: number; recurringCustomers: number; returningCustomers: number }> = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split('T')[0],
      newCustomers: Math.floor(Math.random() * 100) + 50,
      recurringCustomers: Math.floor(Math.random() * 150) + 100,
      returningCustomers: Math.floor(Math.random() * 50) + 20,
    };
  });

  const periodStart = format(subDays(new Date(), 9), 'MMM d');
  const periodEnd = format(new Date(), 'MMM d');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Notification Bar - Full Width at top */}
      <NotificationBar />

      {/* Main Dashboard */}
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* 2x3 Grid Layout */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] xl:grid-cols-3">
          {/* Row 1 */}
          <NewBookingsCard
            data={bookingChartData}
            total={totalBookings || 32494}
            moveInMoveOut={moveInMoveOutTotal || 10679}
            standardCleaning={standardCleaningTotal || 11134}
            deepCleaning={deepCleaningTotal || 9223}
          />
          
          <QuotesBookingsCard
            quotesValue={quotesToday || 20293.21}
            quotesChange={quotesChange}
            bookingsValue={bookingsToday || 12633.12}
            bookingsChange={bookingsChange}
          />
          
          <ConversionsCard
            bookings={bookings}
            quotes={quotes}
          />

          {/* Row 2 */}
          <RevenueCard
            data={revenueData}
            total={statsData?.revenue?.total || 32490}
            periodStart={periodStart}
            periodEnd={periodEnd}
          />
          
          <CustomersCard
            data={customerData}
            newCustomers={statsData?.customers?.new || 3724}
            recurringCustomers={statsData?.customers?.recurring || 5788}
            returningCustomers={statsData?.customers?.returning || 1231}
          />
          
          <SixthCard />
        </div>
      </div>
    </div>
  );
}

