/**
 * Runtime validation utilities for API responses
 */

import type {
  DashboardStats,
  BookingPipeline,
  ServiceBreakdownItem,
  ChartDataPoint,
  RecentBooking,
} from '@/types/admin-dashboard';

/**
 * Validate DashboardStats object
 */
export function validateDashboardStats(data: any): data is DashboardStats {
  if (!data || typeof data !== 'object') return false;
  
  return (
    typeof data.totalRevenue === 'number' &&
    typeof data.revenueGrowth === 'number' &&
    typeof data.totalBookings === 'number' &&
    typeof data.bookingsGrowth === 'number' &&
    typeof data.activeCustomers === 'number' &&
    typeof data.customersGrowth === 'number' &&
    typeof data.avgBookingValue === 'number' &&
    typeof data.avgValueGrowth === 'number' &&
    typeof data.pendingQuotes === 'number' &&
    typeof data.pendingApplications === 'number' &&
    typeof data.pendingBookings === 'number'
  );
}

/**
 * Validate BookingPipeline object
 */
export function validateBookingPipeline(data: any): data is BookingPipeline {
  if (!data || typeof data !== 'object') return false;
  
  // Check that all values are numbers
  return Object.values(data).every((value) => typeof value === 'number');
}

/**
 * Validate ServiceBreakdownItem array
 */
export function validateServiceBreakdown(data: any): data is ServiceBreakdownItem[] {
  if (!Array.isArray(data)) return false;
  
  return data.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof item.name === 'string' &&
      typeof item.value === 'number'
  );
}

/**
 * Validate ChartDataPoint array
 */
export function validateChartData(data: any): data is ChartDataPoint[] {
  if (!Array.isArray(data)) return false;
  
  return data.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof item.date === 'string' &&
      typeof item.revenue === 'number' &&
      typeof item.bookings === 'number'
  );
}

/**
 * Validate RecentBooking array
 */
export function validateRecentBookings(data: any): data is RecentBooking[] {
  if (!Array.isArray(data)) return false;
  
  return data.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.customer_name === 'string' &&
      typeof item.service_type === 'string' &&
      typeof item.total_amount === 'number'
  );
}

