/**
 * TypeScript types for Shalean Admin Dashboard
 * These types match the API contracts and data structures
 */

export type Booking = {
  id: string;
  date: string; // ISO date string
  time: string; // HH:mm format
  serviceType: 'Standard' | 'Deep' | 'Airbnb' | 'MoveIn' | 'MoveOut' | string;
  customerName: string;
  cleanerId?: string | null;
  cleanerName?: string;
  cleanerInitials?: string;
  status: 'confirmed' | 'completed' | 'pending' | 'assigned' | 'unassigned' | string;
  price: number;
};

export type Cleaner = {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
  availableToday: boolean;
  availableTomorrow?: boolean;
};

export type Metrics = {
  todayRevenue: number;
  bookingsToday: number;
  cleanersAvailable: number;
  totalRevenue: number;
  companyEarnings: number;
  profitMarginPct: number;
  avgBookingValue: number;
  totalBookings: number;
  activeCleaners: number;
  customerRetentionPct: number;
};

export type Alert = {
  id: string;
  level: 'info' | 'warning' | 'urgent';
  title: string;
  message: string;
  count?: number;
  actionLabel?: string;
  actionHref?: string;
};

export type ChartDataPoint = {
  date: string;
  revenue?: number;
  bookings?: number;
  completed?: number;
  companyEarnings?: number;
  totalBookings?: number;
};

export type ServicePerformance = {
  title: string;
  revenue: number;
  bookings: number;
  avg: number;
  top?: boolean;
  percentage?: number; // percentage of total revenue
};

export type SparklineData = {
  value: number;
  date: string;
}[];

export type TrendDelta = {
  value: number;
  percentage: number;
  isPositive: boolean;
};

export type BusinessPipeline = {
  quotes: number;
  conversion: number;
  applications: number;
  reviewRate: number;
  retention: number;
};

export type PerformanceMetrics = {
  avgResponse: number; // ms
  cacheHit: number; // %
  apiCalls: number;
  errorRate: number; // %
};

export type ActivityFeedItem = {
  id: string;
  type: 'booking' | 'cleaner' | 'quote' | 'application' | 'review';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
};

export type DashboardStats = {
  metrics: Metrics;
  alerts: Alert[];
  bookingsToday: Booking[];
  bookingsTomorrow?: Booking[];
  cleaners: Cleaner[];
  revenueTrend: ChartDataPoint[];
  bookingsVolume: ChartDataPoint[];
  servicePerformance: ServicePerformance[];
  pipeline: BusinessPipeline;
  performance: PerformanceMetrics;
  recentActivities?: ActivityFeedItem[];
};
