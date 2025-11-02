'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  UserCheck,
  DollarSign,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { ServiceMetricCard } from '@/components/admin/service-metric-card';
import { BookingsTimelineChart } from '@/components/admin/bookings-timeline-chart';
import { ServiceTypeChart } from '@/components/admin/service-type-chart';
import { UpcomingBookingsWidget } from '@/components/admin/upcoming-bookings-widget';
import { ActiveCleanersWidget } from '@/components/admin/active-cleaners-widget';
import { RecentActivityWidget } from '@/components/admin/recent-activity-widget';
import { QuotesWidget } from '@/components/admin/quotes-widget';
import { SkeletonCard } from '@/components/admin/skeleton-card';
import { toast } from 'sonner';

interface BookingsTimelineData {
  date: string;
  bookings: number;
  completed: number;
  cancelled: number;
}

interface ServiceTypeData {
  serviceType: string;
  bookings: number;
  revenue: number;
}

interface UpcomingBooking {
  id: string;
  customer_name: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  cleaner_name?: string | null;
  status: string;
}

interface ActiveCleaner {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'offline';
  currentBookings?: number;
  rating?: number;
}

interface ActivityItem {
  id: string;
  type: 'booking_completed' | 'new_customer' | 'new_booking' | 'alert';
  message: string;
  timestamp: string;
  metadata?: any;
}

interface ServiceRequest {
  id: string;
  name: string;
  assignedTo: string;
  hours: string;
  budgetHours: string;
  unbilledExpenses: number;
}

interface Quote {
  id: string;
  first_name: string;
  last_name: string;
  service_type: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  
  // Service metrics
  const [todayBookings, setTodayBookings] = useState(0);
  const [activeCleaners, setActiveCleaners] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [revenueToday, setRevenueToday] = useState(0);
  
  // Charts data
  const [bookingsTimelineData, setBookingsTimelineData] = useState<BookingsTimelineData[]>([]);
  const [bookingsSummary, setBookingsSummary] = useState({ total: 0, completed: 0, cancelled: 0 });
  const [serviceTypeData, setServiceTypeData] = useState<ServiceTypeData[]>([]);
  
  // Widgets data
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [cleaners, setCleaners] = useState<ActiveCleaner[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Helper function to safely parse JSON responses
      const safeFetch = async (url: string, fallback: any = null) => {
        try {
          const res = await fetch(url);
          if (!res.ok) {
            console.warn(`HTTP ${res.status} from ${url}`);
            return fallback;
          }
          const contentType = res.headers.get('content-type');
          if (!contentType?.includes('application/json')) {
            console.warn(`Non-JSON response from ${url}:`, contentType);
            return fallback;
          }
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            return data;
          } catch (parseError) {
            console.warn(`Failed to parse JSON from ${url}:`, text.substring(0, 100));
            return fallback;
          }
        } catch (error) {
          console.error(`Error fetching ${url}:`, error);
          return fallback;
        }
      };

      // Fetch stats for metrics
      const statsData = await safeFetch('/api/admin/stats');
      if (statsData?.ok && statsData.stats) {
        const stats = statsData.stats;
        setTodayBookings(stats.bookings?.today || 0);
        setActiveCleaners(stats.cleaners?.active || 0);
        setPendingRequests(stats.bookings?.pending || 0);
        setRevenueToday(stats.revenue?.today || 0);
        
        // Set bookings summary (calculate cancelled from stats if available)
        const cancelledCount = stats.bookings?.cancelled || 0;
        setBookingsSummary({
          total: stats.bookings?.total || 0,
          completed: stats.bookings?.completed || 0,
          cancelled: cancelledCount,
        });
        
        // Set today's bookings for the upcoming bookings widget
        if (stats.bookings?.todayBookings) {
          const todayBookingList = stats.bookings.todayBookings.slice(0, 5).map((b: any) => ({
            id: b.id,
            customer_name: b.customer_name || 'Customer',
            service_type: b.service_type || 'Service',
            booking_date: b.booking_date || new Date().toISOString(),
            booking_time: b.booking_time || '10:00',
            cleaner_name: b.cleaner_name,
            status: b.status || 'pending',
          }));
          setUpcomingBookings(todayBookingList);
        }
      }

      // Fetch bookings timeline data
      const timelineRes = await safeFetch('/api/admin/stats/chart?days=30');
      if (timelineRes?.ok && timelineRes.chartData) {
        const timelineData = timelineRes.chartData.map((d: any) => ({
          date: d.date,
          bookings: d.bookings || 0,
          completed: d.completed || 0,
          cancelled: d.cancelled || 0,
        }));
        setBookingsTimelineData(timelineData);
      }

      // Fetch service type breakdown
      if (statsData?.ok && statsData.stats?.serviceTypeBreakdown) {
        const serviceTypes = Object.entries(statsData.stats.serviceTypeBreakdown || {}).map(([type, data]: [string, any]) => ({
          serviceType: type,
          bookings: data.bookings || 0,
          revenue: data.revenue || 0,
        }));
        setServiceTypeData(serviceTypes);
      }

      // Fetch active cleaners status
      const cleanersStatusRes = await safeFetch('/api/admin/cleaners/status');
      if (cleanersStatusRes?.ok && cleanersStatusRes.cleaners) {
        setCleaners(cleanersStatusRes.cleaners.slice(0, 5));
      } else {
        // Fallback to stats if endpoint fails
        const activeCleanersList: ActiveCleaner[] = [];
        if (statsData?.ok && statsData.stats?.cleaners?.active) {
          for (let i = 0; i < Math.min(statsData.stats.cleaners.active, 5); i++) {
            activeCleanersList.push({
              id: `cleaner-${i}`,
              name: `Cleaner ${i + 1}`,
              status: i % 2 === 0 ? 'available' : 'busy',
              currentBookings: i,
              rating: 4.5 + (Math.random() * 0.5),
            });
          }
        }
        setCleaners(activeCleanersList);
      }

      // Generate recent activity from stats
      const activityList: ActivityItem[] = [];
      if (statsData?.ok && statsData.stats) {
        const stats = statsData.stats;
        
        // Add today's bookings as activity
        if (stats.bookings?.today > 0) {
          activityList.push({
            id: 'today-bookings',
            type: 'new_booking',
            message: `${stats.bookings.today} new booking${stats.bookings.today !== 1 ? 's' : ''} today`,
            timestamp: new Date().toISOString(),
          });
        }

        // Add pending requests alert
        if (stats.bookings?.pending > 0) {
          activityList.push({
            id: 'pending-requests',
            type: 'alert',
            message: `${stats.bookings.pending} pending booking${stats.bookings.pending !== 1 ? 's' : ''} need attention`,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          });
        }

        // Add completed bookings
        if (stats.bookings?.completed > 0) {
          activityList.push({
            id: 'completed-bookings',
            type: 'booking_completed',
            message: `${stats.bookings.completed} booking${stats.bookings.completed !== 1 ? 's' : ''} completed`,
            timestamp: new Date(Date.now() - 7200000).toISOString(),
          });
        }
      }
      setActivities(activityList.slice(0, 5));

      // Fetch active service requests (accepted bookings)
      const activeBookingsRes = await safeFetch('/api/admin/bookings?status=accepted&limit=5');
      if (activeBookingsRes?.ok && activeBookingsRes.bookings) {
        const requests = (activeBookingsRes.bookings || []).map((b: any) => ({
          id: b.id,
          name: `${b.service_type || 'Service'} - ${b.customer_name || 'Customer'}`,
          assignedTo: b.cleaner_name || 'Unassigned',
          hours: '00:00',
          budgetHours: '02:00',
          unbilledExpenses: 0,
        }));
        setServiceRequests(requests);
      }

      // Fetch pending quotes
      const pendingQuotesRes = await safeFetch('/api/admin/quotes?status=pending&limit=5');
      // Fetch contacted quotes
      const contactedQuotesRes = await safeFetch('/api/admin/quotes?status=contacted&limit=5');
      
      const allQuotes: Quote[] = [];
      
      if (pendingQuotesRes?.ok && pendingQuotesRes.quotes) {
        allQuotes.push(...pendingQuotesRes.quotes);
      }
      
      if (contactedQuotesRes?.ok && contactedQuotesRes.quotes) {
        allQuotes.push(...contactedQuotesRes.quotes);
      }
      
      // Sort by created_at descending and take first 5
      const sortedQuotes = allQuotes.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 5);
      
      setQuotes(sortedQuotes);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Skeleton loader
  const SkeletonLoader = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hello, Shalean Cleaning Services</h1>
        <p className="text-gray-600 mt-1 text-sm">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Service Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ServiceMetricCard
          title="Today's Bookings"
          value={todayBookings}
          subtitle="Scheduled for today"
          icon={<Calendar className="h-4 w-4" />}
          badge={{ label: 'Today', variant: 'default' }}
        />
        <ServiceMetricCard
          title="Active Cleaners"
          value={activeCleaners}
          subtitle="Currently working"
          icon={<UserCheck className="h-4 w-4" />}
          badge={{ label: 'Available', variant: 'secondary' }}
        />
        <ServiceMetricCard
          title="Pending Requests"
          value={pendingRequests}
          subtitle="Need attention"
          icon={<AlertCircle className="h-4 w-4" />}
          badge={{ label: 'Action Required', variant: 'destructive' }}
        />
        <ServiceMetricCard
          title="Revenue Today"
          value={formatCurrency(revenueToday)}
          subtitle="Earnings today"
          icon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      {/* Charts: Bookings Timeline and Service Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BookingsTimelineChart
            data={bookingsTimelineData}
            totalBookings={bookingsSummary.total}
            totalCompleted={bookingsSummary.completed}
            totalPending={bookingsSummary.cancelled}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ServiceTypeChart data={serviceTypeData} />
        </motion.div>
      </div>

      {/* Bottom Row: Today's Bookings, Active Cleaners, Recent Activity, Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <UpcomingBookingsWidget bookings={upcomingBookings} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <ActiveCleanersWidget cleaners={cleaners} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <RecentActivityWidget activities={activities} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <QuotesWidget quotes={quotes} />
        </motion.div>
      </div>
    </div>
  );
}
