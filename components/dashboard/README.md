# Enhanced Shalean Admin Dashboard

Production-ready dashboard with modern UI/UX improvements including visual hierarchy, interactive metrics, mobile responsiveness, accessibility, and performance optimizations.

## Components Overview

### Core Components

- **StatCard** - Enhanced metric cards with sparklines, loading states, and click interactions
- **MetricAlerts** - Color-coded alerts with collapsible overflow and urgent highlighting
- **SnapshotCard** - Prominent KPI display with large numbers, sparklines, and drill-down modal
- **ServiceCard** - Service performance cards with progress bars and TOP badge
- **ScheduleList** - Enhanced booking lists with avatars, icons, status badges, and empty states
- **TrendsCharts** - Lazy-loaded wrapper for revenue and bookings charts
- **BusinessPipeline** - Pipeline metrics with conversion rates
- **RecentActivities** - Activity feed with helpful quick actions
- **FAB** - Floating Action Button with expandable menu
- **MobileSummaryBar** - Sticky summary bar that minimizes on scroll
- **Skeleton** - Loading skeleton components

### Supporting Files

- **types.ts** - TypeScript interfaces for all dashboard data structures
- **mock.ts** - Mock data for development and testing

## Integration Guide

### Data Flow

The dashboard fetches data from two Supabase endpoints:

1. **`/api/admin/stats?days={n}`** - Main dashboard statistics
2. **`/api/admin/stats/chart?days={n}`** - Time-series chart data

### Expected Data Structure

#### Main Stats API Response

```typescript
{
  ok: boolean;
  stats: {
    revenue: {
      today: number;
      total: number;
      companyEarnings: number;
      profitMargin: number;
      recentProfitMargin: number;
      avgBookingValue: number;
      recentAvgBookingValue: number;
    };
    bookings: {
      today: number;
      total: number;
      todayBookings: Array<Booking>;
      tomorrowBookings: Array<Booking>;
      unassigned: number;
      unassignedList: Array<any>;
    };
    cleaners: {
      availableToday: number;
      availableTomorrow: number;
      active: number;
      total: number;
    };
    quotes: {
      total: number;
      pending: number;
      converted: number;
    };
    applications: {
      total: number;
      pending: number;
    };
    customers: {
      retentionRate: number;
    };
    serviceTypeBreakdown: {
      [serviceType: string]: {
        revenue: number;
        bookings: number;
      };
    };
  };
}
```

#### Chart Data API Response

```typescript
{
  ok: boolean;
  chartData: Array<{
    date: string; // ISO date string
    revenue: number;
    bookings: number;
    completed: number;
    companyEarnings: number;
  }>;
  comparison: {
    revenue: {
      change: number; // percentage change vs previous period
    };
  };
}
```

### Supabase Setup Recommendations

#### Recommended SQL Views

Create these views to optimize dashboard queries:

```sql
-- Dashboard metrics view
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT 
  SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN total_price ELSE 0 END) as today_revenue,
  COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_bookings,
  COUNT(CASE WHEN status = 'unassigned' THEN 1 END) as unassigned_bookings
FROM bookings
WHERE status IN ('confirmed', 'assigned', 'completed', 'unassigned');

-- Revenue by service view
CREATE OR REPLACE VIEW revenue_by_service AS
SELECT 
  service_type,
  SUM(total_price) as revenue,
  COUNT(*) as bookings
FROM bookings
WHERE status = 'completed'
GROUP BY service_type;

-- Daily bookings aggregation
CREATE OR REPLACE FUNCTION bookings_by_day(range_days INTEGER)
RETURNS TABLE(
  date DATE,
  bookings INTEGER,
  completed INTEGER,
  revenue NUMERIC,
  company_earnings NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(booking_date) as date,
    COUNT(*)::INTEGER as bookings,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER as completed,
    COALESCE(SUM(total_price), 0) as revenue,
    COALESCE(SUM(total_price * 0.45), 0) as company_earnings -- Adjust profit margin
  FROM bookings
  WHERE booking_date >= CURRENT_DATE - range_days::INTEGER
  GROUP BY DATE(booking_date)
  ORDER BY date;
END;
$$ LANGUAGE plpgsql STABLE;
```

#### RPC Functions

Create this RPC function for aggregated stats:

```sql
CREATE OR REPLACE FUNCTION get_dashboard_stats(days_back INTEGER)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'revenue', (SELECT json_build_object(
      'today', COALESCE(SUM(CASE WHEN DATE(booking_date) = CURRENT_DATE THEN total_price END), 0),
      'total', COALESCE(SUM(total_price), 0),
      'companyEarnings', COALESCE(SUM(total_price * 0.45), 0),
      'profitMargin', 45
    ) FROM bookings WHERE booking_date >= CURRENT_DATE - days_back),
    'bookings', (SELECT json_build_object(
      'today', COUNT(CASE WHEN DATE(booking_date) = CURRENT_DATE THEN 1 END),
      'total', COUNT(*),
      'unassigned', COUNT(CASE WHEN status = 'unassigned' THEN 1 END)
    ) FROM bookings WHERE booking_date >= CURRENT_DATE - days_back),
    'cleaners', (SELECT json_build_object(
      'availableToday', COUNT(CASE WHEN available_today = true THEN 1 END),
      'active', COUNT(*)
    ) FROM cleaners WHERE status = 'active')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;
```

## SWR Configuration

The dashboard uses SWR for data fetching with these settings:

```typescript
{
  revalidateOnFocus: true,      // Refresh when tab comes into focus
  revalidateOnReconnect: true,  // Refresh on network reconnect
  refreshInterval: 60000,       // Auto-refresh every 60 seconds
  dedupingInterval: 5000,       // Dedupe requests within 5 seconds
}
```

## Component Usage Examples

### Using StatCard

```tsx
import { StatCard } from '@/components/dashboard/StatCard';

<StatCard
  title="Total Revenue"
  value={formatCurrency(10000)}
  delta={7.5}
  hint="vs previous period"
  sparklineData={sparklineData}
  onClick={() => handleDrillDown()}
/>
```

### Using MetricAlerts

```tsx
import { MetricAlerts } from '@/components/dashboard/MetricAlerts';

<MetricAlerts
  alerts={[
    {
      id: 'alert-1',
      level: 'urgent',
      title: 'Unassigned Bookings',
      message: '3 bookings need cleaner assignment',
      count: 3,
      actionLabel: 'Assign Cleaners',
    },
  ]}
  maxVisible={3}
/>
```

### Using SnapshotCard

```tsx
import { SnapshotCard } from '@/components/dashboard/SnapshotCard';

<SnapshotCard
  metrics={metrics}
  sparklineData={sparklineData}
  recentBookings={bookings}
  delta7d={12.5}
  onViewBookings={() => navigate('/bookings')}
  onAssignCleaners={() => openAssignmentDialog()}
/>
```

## Styling

### Color Tokens

- **Primary**: Uses `--primary` from Tailwind CSS variables
- **Success**: `emerald-500`
- **Warning**: `amber-400`
- **Danger**: `rose-500`
- **Info**: `sky-500`

### Spacing

- Small cards: `p-4`
- Main cards: `p-6`
- Section gaps: `gap-4` or `gap-6`

### Responsive Breakpoints

- Mobile: default (< 640px)
- Tablet: `sm:` (640px+)
- Desktop: `md:` (768px+) and `lg:` (1024px+)

## Performance Optimizations

1. **Lazy-loaded Charts** - Charts are dynamically imported with `ssr: false`
2. **React.memo** - Components wrapped in `memo` to prevent unnecessary re-renders
3. **SWR Caching** - Data caching with stale-while-revalidate pattern
4. **Loading Skeletons** - Skeleton UI during data fetching
5. **Debounced Actions** - Filters and searches are debounced

## Accessibility

- All interactive elements have `aria-label` attributes
- Keyboard navigation support (Tab, Enter, Escape)
- Focus management in modals
- WCAG AA color contrast compliance
- Screen reader friendly labels
- Respects `prefers-reduced-motion`

## Testing with Mock Data

Import and use mock data for development:

```tsx
import {
  mockMetrics,
  mockBookings,
  mockAlerts,
  mockSparklineData,
  generateMockSparkline,
} from '@/components/dashboard/mock';

// Use in development
const metrics = isDevelopment ? mockMetrics : actualMetrics;
```

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Charts not loading

Ensure recharts is properly installed:
```bash
npm install recharts
```

### TypeScript errors

Import types from the types file:
```tsx
import type { Booking, Metrics, Alert } from '@/components/dashboard/types';
```

### Styling issues

Ensure Tailwind CSS is properly configured and CSS variables are set in `app/globals.css`:
```css
@layer base {
  :root {
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
  }
}
```

## Next Steps

1. Replace mock data with actual Supabase queries
2. Implement analytics tracking
3. Add export functionality
4. Implement filters and search
5. Add real-time updates with Supabase subscriptions

## License

Proprietary - Shalean Cleaning Services Platform

