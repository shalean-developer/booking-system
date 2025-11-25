/**
 * TypeScript types for Admin Dashboard
 * These types match the API contracts and data structures
 */

// API Response Types
export interface ApiResponse<T> {
  ok: boolean;
  error?: string;
  data?: T;
}

// Stats API Response
export interface DashboardStats {
  totalRevenue: number; // in cents
  revenueGrowth: number; // percentage
  totalBookings: number;
  bookingsGrowth: number; // percentage
  activeCustomers: number;
  customersGrowth: number; // percentage
  avgBookingValue: number; // in cents
  avgValueGrowth: number; // percentage
  pendingQuotes: number;
  pendingApplications: number;
  pendingBookings: number;
}

export interface StatsApiResponse extends ApiResponse<DashboardStats> {
  stats?: DashboardStats;
}

// Booking Pipeline API Response
export type BookingPipeline = Record<string, number>;

export interface PipelineApiResponse extends ApiResponse<BookingPipeline> {
  pipeline?: BookingPipeline;
}

// Service Breakdown API Response
export interface ServiceBreakdownItem {
  name: string;
  value: number;
}

export interface ServiceBreakdownApiResponse extends ApiResponse<ServiceBreakdownItem[]> {
  data?: ServiceBreakdownItem[];
}

// Chart Data API Response
export interface ChartDataPoint {
  date: string;
  revenue: number; // in cents
  bookings: number;
}

export interface ChartApiResponse extends ApiResponse<ChartDataPoint[]> {
  data?: ChartDataPoint[];
}

// Recent Bookings API Response
export interface RecentBooking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_amount: number; // in cents
  cleaner_name?: string | null;
  created_at: string;
}

export interface BookingsApiResponse extends ApiResponse<RecentBooking[]> {
  bookings?: RecentBooking[];
  total?: number;
  totalPages?: number;
}

// Dashboard State Types
export interface DashboardState {
  stats: DashboardStats | null;
  pipeline: BookingPipeline | null;
  serviceBreakdown: ServiceBreakdownItem[];
  chartData: ChartDataPoint[];
  recentBookings: RecentBooking[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Error Types
export interface DashboardError {
  message: string;
  type: 'network' | 'api' | 'unknown';
  timestamp: Date;
  retryable: boolean;
}

