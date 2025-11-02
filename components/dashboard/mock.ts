/**
 * Mock data for Shalean Admin Dashboard
 * Use this for development, testing, and as fallback data
 */

import type {
  Booking,
  Cleaner,
  Metrics,
  Alert,
  ChartDataPoint,
  ServicePerformance,
  BusinessPipeline,
  PerformanceMetrics,
  ActivityFeedItem,
} from './types';

export const mockMetrics: Metrics = {
  todayRevenue: 0,
  bookingsToday: 0,
  cleanersAvailable: 19,
  totalRevenue: 88461.04,
  companyEarnings: 40028.04,
  profitMarginPct: 45,
  avgBookingValue: 497,
  totalBookings: 178,
  activeCleaners: 20,
  customerRetentionPct: 52,
};

export const mockBookings: Booking[] = [
  {
    id: '1',
    date: '2025-01-10',
    time: '09:00',
    serviceType: 'Standard',
    customerName: 'John Smith',
    cleanerId: 'c1',
    cleanerName: 'Jane Doe',
    cleanerInitials: 'JD',
    status: 'confirmed',
    price: 395,
  },
  {
    id: '2',
    date: '2025-01-10',
    time: '11:00',
    serviceType: 'Deep',
    customerName: 'Sarah Johnson',
    cleanerId: 'c2',
    cleanerName: 'Mike Wilson',
    cleanerInitials: 'MW',
    status: 'assigned',
    price: 1990,
  },
  {
    id: '3',
    date: '2025-01-10',
    time: '14:00',
    serviceType: 'Airbnb',
    customerName: 'David Brown',
    cleanerId: null,
    cleanerName: undefined,
    cleanerInitials: undefined,
    status: 'unassigned',
    price: 378,
  },
];

export const mockAlertBookings: Booking[] = [
  {
    id: 'alert-1',
    date: '2025-11-04',
    time: '10:00',
    serviceType: 'MoveIn',
    customerName: 'Susan Farrell',
    cleanerId: null,
    cleanerName: undefined,
    cleanerInitials: undefined,
    status: 'unassigned',
    price: 1200,
  },
];

export const mockCleaners: Cleaner[] = [
  { id: 'c1', name: 'Jane Doe', initials: 'JD', availableToday: true },
  { id: 'c2', name: 'Mike Wilson', initials: 'MW', availableToday: true },
  { id: 'c3', name: 'Emily Chen', initials: 'EC', availableToday: false },
  { id: 'c4', name: 'Robert Taylor', initials: 'RT', availableToday: true },
];

export const mockAlerts: Alert[] = [
  {
    id: 'pending-quotes',
    level: 'warning',
    title: 'Pending Quotes',
    message: '5 quotes awaiting response',
    count: 5,
    actionLabel: 'Review',
    actionHref: '#quotes',
  },
  {
    id: 'pending-apps',
    level: 'info',
    title: 'Cleaner Applications',
    message: '36 applications awaiting review',
    count: 36,
    actionLabel: 'Review',
  },
  {
    id: 'urgent-booking',
    level: 'urgent',
    title: 'Unassigned Booking',
    message: '1 booking needs cleaner assignment immediately',
    count: 1,
    actionLabel: 'Assign Cleaners',
  },
];

export const mockChartData: ChartDataPoint[] = [
  { date: '2025-10-30', revenue: 8500, bookings: 12, completed: 10, companyEarnings: 3825 },
  { date: '2025-10-31', revenue: 9200, bookings: 14, completed: 12, companyEarnings: 4140 },
  { date: '2025-11-01', revenue: 7500, bookings: 11, completed: 9, companyEarnings: 3375 },
  { date: '2025-11-02', revenue: 9800, bookings: 15, completed: 13, companyEarnings: 4410 },
  { date: '2025-11-03', revenue: 8800, bookings: 13, completed: 11, companyEarnings: 3960 },
  { date: '2025-11-04', revenue: 7200, bookings: 10, completed: 8, companyEarnings: 3240 },
  { date: '2025-11-05', revenue: 9500, bookings: 14, completed: 12, companyEarnings: 4275 },
];

export const mockServicePerformance: ServicePerformance[] = [
  {
    title: 'Standard',
    revenue: 52190.04,
    bookings: 132,
    avg: 395,
    top: true,
    percentage: 59,
  },
  {
    title: 'Deep',
    revenue: 19900.0,
    bookings: 10,
    avg: 1990,
    top: false,
    percentage: 22,
  },
  {
    title: 'Airbnb',
    revenue: 12478.0,
    bookings: 33,
    avg: 378,
    top: false,
    percentage: 14,
  },
];

export const mockPipeline: BusinessPipeline = {
  quotes: 32,
  conversion: 9,
  applications: 42,
  reviewRate: 14,
  retention: 6,
};

export const mockPerformanceMetrics: PerformanceMetrics = {
  avgResponse: 120,
  cacheHit: 87,
  apiCalls: 1542,
  errorRate: 0.3,
};

export const mockRecentActivities: ActivityFeedItem[] = [];

export const mockSparklineData = [
  { date: '2025-11-01', value: 7500 },
  { date: '2025-11-02', value: 9200 },
  { date: '2025-11-03', value: 8500 },
  { date: '2025-11-04', value: 9800 },
  { date: '2025-11-05', value: 8800 },
];

/**
 * Generate mock sparkline data for a metric
 */
export function generateMockSparkline(days: number = 7): Array<{ date: string; value: number }> {
  const data: Array<{ date: string; value: number }> = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const value = Math.floor(Math.random() * 5000) + 3000; // Random value between 3000-8000
    
    data.push({
      date: date.toISOString().split('T')[0],
      value,
    });
  }
  
  return data;
}

