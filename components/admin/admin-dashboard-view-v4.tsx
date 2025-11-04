'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { 
  ChevronDown, 
  ChevronUp, 
  X, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft, 
  ArrowRight,
  MoreVertical,
  Eye,
  Check,
  MapPin,
  Calendar,
  User
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { supabase } from '@/lib/supabase-client';
import { TodaysBookingsWidget } from './todays-bookings-widget';
import { ActiveCleanersWidget } from './active-cleaners-widget';
import { RecentActivityWidget } from './recent-activity-widget';
import { QuotesWidgetDashboard } from './quotes-widget-dashboard';

interface Stats {
  bookings: {
    total: number;
    today: number;
    pending: number;
    todayBookings?: Array<{
      id: string;
      customer_name: string;
      booking_date?: string;
      booking_time: string;
      service_type: string;
      status: string;
      cleaner_name?: string | null;
    }>;
  };
  revenue: {
    total: number;
    today?: number;
  };
  quotes: {
    total: number;
    pending: number;
    contacted: number;
    converted: number;
  };
  customers: {
    total: number;
    new?: number;
    recurring?: number;
    returning?: number;
  };
  cleaners?: {
    total: number;
    active?: number;
  };
}

interface BookingChartData {
  date: string;
  moveInMoveOut: number;
  standardCleaning: number;
  deepCleaning: number;
  airbnb: number;
}

interface RevenueChartData {
  date: string;
  revenue: number;
}

interface CustomerChartData {
  date: string;
  new: number;
  recurring: number;
  returning: number;
}

export function AdminDashboardViewV4() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookingChartData, setBookingChartData] = useState<BookingChartData[]>([]);
  const [filteredBookingChartData, setFilteredBookingChartData] = useState<BookingChartData[]>([]);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [bookingsChartOffset, setBookingsChartOffset] = useState(0);
  const [revenueChartOffset, setRevenueChartOffset] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Get display name for selected service
  const getServiceDisplayName = () => {
    switch (selectedServiceFilter) {
      case 'moveInMoveOut':
        return 'Move In/Out';
      case 'standardCleaning':
        return 'Standard Cleaning';
      case 'deepCleaning':
        return 'Deep Cleaning';
      case 'airbnb':
        return 'Airbnb';
      default:
        return 'New Bookings';
    }
  };
  const [revenueChartData, setRevenueChartData] = useState<RevenueChartData[]>([]);
  const [customerChartData, setCustomerChartData] = useState<CustomerChartData[]>([]);
  const [quotesToday, setQuotesToday] = useState(0);
  const [bookingsToday, setBookingsToday] = useState(0);
  const [quotesYesterday, setQuotesYesterday] = useState(0);
  const [bookingsYesterday, setBookingsYesterday] = useState(0);
  const [quotes7DayAvg, setQuotes7DayAvg] = useState(0);
  const [bookings7DayAvg, setBookings7DayAvg] = useState(0);
  const [bookingsCountToday, setBookingsCountToday] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [moveInMoveOut, setMoveInMoveOut] = useState(0);
  const [standardCleaning, setStandardCleaning] = useState(0);
  const [deepCleaning, setDeepCleaning] = useState(0);
  const [airbnb, setAirbnb] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueLast10Days, setRevenueLast10Days] = useState(0);
  const [revenuePrev10Days, setRevenuePrev10Days] = useState(0);
  const [bookingsPrev10Days, setBookingsPrev10Days] = useState(0);
  const [bookingsChange10Days, setBookingsChange10Days] = useState(0);
  const [revenueByService, setRevenueByService] = useState({
    moveInMoveOut: 0,
    standardCleaning: 0,
    deepCleaning: 0,
    airbnb: 0,
  });
  const [newCustomers, setNewCustomers] = useState(0);
  const [recurringCustomers, setRecurringCustomers] = useState(0);
  const [returningCustomers, setReturningCustomers] = useState(0);
  const [conversionStats, setConversionStats] = useState({
    totalQuotes: 0,
    convertedBookings: 0,
    nonBooked: 0,
  });
  const [latestNotification, setLatestNotification] = useState<{
    type: 'quote' | 'booking';
    message: string;
    id: string;
    created_at: string;
    // Enhanced booking details
    customer_name?: string;
    booking_date?: string;
    address_suburb?: string;
    address_city?: string;
    service_type?: string;
    total_amount?: number;
    status?: string;
  } | null>(null);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const dashboardLoadTime = useRef<Date>(new Date()); // Initialize immediately when component loads
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLatestNotification = useCallback(async () => {
    try {
      const now = new Date();
      // Use dashboard load time if available, otherwise consider items from the last 24 hours as "new"
      const recentTime = dashboardLoadTime.current || new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Fetch most recent quote
      const quotesRes = await fetch('/api/admin/quotes?limit=1', {
        credentials: 'include',
      });
      const quotesData = await quotesRes.json();

      // Fetch most recent booking
      const bookingsRes = await fetch('/api/admin/bookings?limit=1', {
        credentials: 'include',
      });
      const bookingsData = await bookingsRes.json();

      let latestQuote: any = null;
      let latestBooking: any = null;

      if (quotesData.ok && quotesData.quotes && quotesData.quotes.length > 0) {
        latestQuote = quotesData.quotes[0];
      }

      if (bookingsData.ok && bookingsData.bookings && bookingsData.bookings.length > 0) {
        latestBooking = bookingsData.bookings[0];
      }

      // Determine which is more recent
      let latestItem: { type: 'quote' | 'booking'; data: any } | null = null;

      if (latestQuote && latestBooking) {
        const quoteTime = new Date(latestQuote.created_at);
        const bookingTime = new Date(latestBooking.created_at);
        latestItem = quoteTime > bookingTime 
          ? { type: 'quote', data: latestQuote }
          : { type: 'booking', data: latestBooking };
      } else if (latestQuote) {
        latestItem = { type: 'quote', data: latestQuote };
      } else if (latestBooking) {
        latestItem = { type: 'booking', data: latestBooking };
      }

      // Only show notification if item is recent and not dismissed
      if (latestItem) {
        const itemTime = new Date(latestItem.data.created_at);
        const itemId = latestItem.data.id;

        // Check dismissed notifications from localStorage
        const savedDismissed = localStorage.getItem('dismissedNotifications');
        let dismissedSet = new Set<string>();
        if (savedDismissed) {
          try {
            dismissedSet = new Set(JSON.parse(savedDismissed));
          } catch (e) {
            // Ignore parse errors
          }
        }

        // Only show if created after dashboard load and not dismissed
        if (itemTime >= recentTime && !dismissedSet.has(itemId)) {
          const price = latestItem.type === 'quote' 
            ? (latestItem.data.estimated_price || 0) > 10000 
              ? (latestItem.data.estimated_price / 100) 
              : latestItem.data.estimated_price
            : (latestItem.data.total_amount || 0) > 10000
              ? (latestItem.data.total_amount / 100)
              : latestItem.data.total_amount;

          const serviceType = latestItem.data.service_type || 'Standard Cleaning';
          const message = latestItem.type === 'quote'
            ? `New Quote: ${serviceType} ${formatCurrency(price || 0)}`
            : `New Booking: ${serviceType} ${formatCurrency(price || 0)}`;

          // Enhanced notification with full booking/quote details
          const customerName = latestItem.type === 'quote'
            ? `${latestItem.data.first_name || ''} ${latestItem.data.last_name || ''}`.trim() || 'Unknown'
            : latestItem.data.customer_name;

          setLatestNotification({
            type: latestItem.type,
            message,
            id: itemId,
            created_at: latestItem.data.created_at,
            // Include full booking/quote details for enhanced display
            customer_name: customerName,
            booking_date: latestItem.data.booking_date,
            address_suburb: latestItem.data.address_suburb,
            address_city: latestItem.data.address_city,
            service_type: serviceType,
            total_amount: price,
            status: latestItem.data.status,
          });
        } else {
          setLatestNotification(null);
        }
      } else {
        setLatestNotification(null);
      }
    } catch (error) {
      console.error('Error fetching latest notification:', error);
    }
  }, []);

  useEffect(() => {
    // Load dismissed notifications from localStorage
    const savedDismissed = localStorage.getItem('dismissedNotifications');
    if (savedDismissed) {
      try {
        setDismissedNotifications(new Set(JSON.parse(savedDismissed)));
      } catch (e) {
        console.error('Error loading dismissed notifications:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Start fetching dashboard data
    fetchDashboardData();
    
    // Fetch notifications immediately on mount
    fetchLatestNotification();
    
    // Set up Supabase real-time subscriptions for instant updates
    const bookingsChannel = supabase
      .channel('admin-bookings-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bookings'
      }, () => {
        console.log('🔔 New booking detected via real-time');
        fetchLatestNotification();
      })
      .subscribe();

    const quotesChannel = supabase
      .channel('admin-quotes-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'quotes'
      }, () => {
        console.log('🔔 New quote detected via real-time');
        fetchLatestNotification();
      })
      .subscribe();
    
    // Fallback: Check for new notifications every 30 seconds as backup
    const interval = setInterval(() => {
      fetchLatestNotification();
    }, 30000);

    return () => {
      // Cleanup: Remove real-time subscriptions and interval
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(quotesChannel);
      clearInterval(interval);
      // Clear auto-dismiss timer on unmount
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchLatestNotification is stable (useCallback with no dependencies)

  const handleDismissNotification = useCallback(() => {
    if (latestNotification) {
      // Clear auto-dismiss timer
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
        autoDismissTimerRef.current = null;
      }
      
      const newDismissed = new Set(dismissedNotifications);
      newDismissed.add(latestNotification.id);
      setDismissedNotifications(newDismissed);
      setLatestNotification(null);
      
      // Save to localStorage (keep last 100 dismissed items)
      const dismissedArray = Array.from(newDismissed).slice(-100);
      localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedArray));
    }
  }, [latestNotification, dismissedNotifications]);

  // Auto-dismiss notification after 30 seconds
  useEffect(() => {
    if (latestNotification) {
      // Clear any existing timer
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
      
      // Set new auto-dismiss timer
      autoDismissTimerRef.current = setTimeout(() => {
        handleDismissNotification();
      }, 30000); // 30 seconds

      return () => {
        if (autoDismissTimerRef.current) {
          clearTimeout(autoDismissTimerRef.current);
        }
      };
    }
  }, [latestNotification, handleDismissNotification]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsRes = await fetch('/api/admin/stats?days=30', {
        credentials: 'include',
      });
      
      if (!statsRes.ok) {
        console.error('Stats API response not OK:', statsRes.status, statsRes.statusText);
        throw new Error(`Failed to fetch stats: ${statsRes.statusText}`);
      }
      
      const statsData = await statsRes.json();
      
      if (statsData.ok && statsData.stats) {
        setStats(statsData.stats);
        // Update state with real data if available
        if (statsData.stats.bookings?.total) {
          setTotalBookings(statsData.stats.bookings.total);
        }
        if (statsData.stats.revenue?.total) {
          setTotalRevenue(statsData.stats.revenue.total);
        }
      }

      // Fetch booking chart data - get 30 days to enable scrolling, but show last 10 by default
      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const chartRes = await fetch(`/api/admin/stats/chart?days=30&endDate=${todayStr}`, {
          credentials: 'include',
          cache: 'no-store', // Ensure fresh data on each request
        });
        
        if (!chartRes.ok) {
          console.error('Chart API response not OK:', chartRes.status, chartRes.statusText);
          // If unauthorized, redirect to login or show message
          if (chartRes.status === 403) {
            console.error('Authentication failed - please log in again');
            // The page should handle this via the admin layout, but log it
          }
          throw new Error(`Failed to fetch chart data: ${chartRes.statusText}`);
        }
        
        const chartData = await chartRes.json();
        
        if (chartData.ok && chartData.chartData) {
          // API returns exactly last 10 days of data from database
          // Each day includes: revenue, bookings, service type breakdowns
          const last10Days = chartData.chartData;
          transformBookingChartData(last10Days);
          transformRevenueChartData(last10Days);
          
          // Calculate totals for last 10 days from database data - sum all days
          // Revenue comes from completed bookings only (already converted from cents to rands in API)
          const totalMoveInMoveOut = last10Days.reduce((sum: number, day: any) => sum + (day.moveInMoveOut || 0), 0);
          const totalStandardCleaning = last10Days.reduce((sum: number, day: any) => sum + (day.standardCleaning || 0), 0);
          const totalDeepCleaning = last10Days.reduce((sum: number, day: any) => sum + (day.deepCleaning || 0), 0);
          const totalAirbnb = last10Days.reduce((sum: number, day: any) => sum + (day.airbnb || 0), 0);
          const totalBookings10Days = last10Days.reduce((sum: number, day: any) => sum + (day.bookings || 0), 0);
          // Sum revenue from all days (revenue field from completed bookings)
          const totalRevenue10Days = last10Days.reduce((sum: number, day: any) => sum + (day.revenue || 0), 0);
          
          // Update state with real totals from database for last 10 days
          setMoveInMoveOut(totalMoveInMoveOut);
          setStandardCleaning(totalStandardCleaning);
          setDeepCleaning(totalDeepCleaning);
          setAirbnb(totalAirbnb);
          setRevenueLast10Days(totalRevenue10Days);
          
          // Extract comparison data from API response (if available)
          if (chartData.comparison) {
            if (chartData.comparison.revenue) {
              setRevenuePrev10Days(chartData.comparison.revenue.previous || 0);
            }
            if (chartData.comparison.bookings) {
              setBookingsPrev10Days(chartData.comparison.bookings.previous || 0);
              setBookingsChange10Days(chartData.comparison.bookings.change || 0);
            }
          } else {
            // Fallback: Calculate previous 10 days revenue for comparison
            const today = new Date();
            const prevStartDate = new Date(today);
            prevStartDate.setDate(prevStartDate.getDate() - 20); // 20 days ago
            const prevEndDate = new Date(today);
            prevEndDate.setDate(prevEndDate.getDate() - 11); // 11 days ago (end of previous 10-day period)
            
            // Fetch previous 10 days chart data
            try {
              const prevChartRes = await fetch(`/api/admin/stats/chart?days=10&endDate=${prevEndDate.toISOString().split('T')[0]}`, {
                credentials: 'include',
              });
              
              if (prevChartRes.ok) {
                const prevChartData = await prevChartRes.json();
                if (prevChartData.ok && prevChartData.chartData) {
                  const prev10DaysRevenue = prevChartData.chartData.reduce((sum: number, day: any) => sum + (day.revenue || 0), 0);
                  const prev10DaysBookings = prevChartData.chartData.reduce((sum: number, day: any) => sum + (day.bookings || 0), 0);
                  setRevenuePrev10Days(prev10DaysRevenue);
                  setBookingsPrev10Days(prev10DaysBookings);
                  // Calculate percentage change
                  if (prev10DaysBookings > 0) {
                    const change = ((totalBookings10Days - prev10DaysBookings) / prev10DaysBookings) * 100;
                    setBookingsChange10Days(change);
                  } else if (totalBookings10Days > 0) {
                    setBookingsChange10Days(100);
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching previous period data:', error);
            }
          }
          
          // Calculate revenue by service type from bookings
          await calculateRevenueByServiceType(last10Days);
        } else {
          console.error('Failed to fetch chart data:', chartData.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }

      // Fetch customer data for last 30 days
      try {
        const customerRes = await fetch('/api/admin/stats/chart?days=30', {
          credentials: 'include',
        });
        
        if (!customerRes.ok) {
          console.error('Customer chart API response not OK:', customerRes.status, customerRes.statusText);
          throw new Error(`Failed to fetch customer data: ${customerRes.statusText}`);
        }
        
        const customerChartDataRes = await customerRes.json();
        
        if (customerChartDataRes.ok && customerChartDataRes.chartData) {
          const last30Days = customerChartDataRes.chartData.slice(-30);
          transformCustomerChartData(last30Days);
          
          // Set customer analysis data from API if available
          if (customerChartDataRes.customerAnalysis) {
            setNewCustomers(customerChartDataRes.customerAnalysis.new || 0);
            setRecurringCustomers(customerChartDataRes.customerAnalysis.recurring || 0);
            setReturningCustomers(customerChartDataRes.customerAnalysis.returning || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching customer data:', error);
        // Set default values to prevent UI from breaking
        transformCustomerChartData([]);
      }

      // Fetch quotes and bookings for today and yesterday
      await fetchQuoteAndBookingValues();

      // Fetch conversion stats (quotes and bookings created today)
      await fetchConversionStats();

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversionStats = async () => {
    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      // Fetch all quotes created today
      const quotesRes = await fetch('/api/admin/quotes?limit=10000', {
        credentials: 'include',
      });
      
      let totalQuotes = 0;
      let convertedQuotes = 0;
      
      if (!quotesRes.ok) {
        console.error('Quotes API response not OK:', quotesRes.status, quotesRes.statusText);
        // Continue with default values
      } else {
        const quotesData = await quotesRes.json();
        if (quotesData.ok && quotesData.quotes) {
          const todayQuotes = quotesData.quotes.filter((quote: any) => {
            const quoteDate = format(parseISO(quote.created_at), 'yyyy-MM-dd');
            return quoteDate === todayStr;
          });
          totalQuotes = todayQuotes.length;
          // Count quotes that have been marked as converted
          convertedQuotes = todayQuotes.filter((quote: any) => quote.status === 'converted').length;
        }
      }

      // Fetch all bookings created today (these represent actual conversions)
      const bookingsRes = await fetch('/api/admin/bookings?limit=10000', {
        credentials: 'include',
      });
      
      let convertedBookings = 0;
      
      if (!bookingsRes.ok) {
        const errorData = await bookingsRes.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Bookings API response not OK:', bookingsRes.status, bookingsRes.statusText, errorData);
        // Continue with default values
      } else {
        const bookingsData = await bookingsRes.json();
        if (bookingsData.ok && bookingsData.bookings) {
          const todayBookings = bookingsData.bookings.filter((booking: any) => {
            const bookingDate = format(parseISO(booking.created_at), 'yyyy-MM-dd');
            return bookingDate === todayStr;
          });
          convertedBookings = todayBookings.length;
        }
      }

      // Count only quotes that were converted (status = 'converted')
      // This represents bookings that came from quote requests
      // Don't count all bookings created today, as some may not be from quotes
      const bookingsFromQuotes = convertedQuotes;

      // Calculate non-booked quotes: all quotes today minus only the quotes that were converted
      // This ensures all quotes created today are counted correctly
      const nonBookedQuotes = Math.max(0, totalQuotes - convertedQuotes);

      setConversionStats({
        totalQuotes,
        convertedBookings: bookingsFromQuotes,
        nonBooked: nonBookedQuotes,
      });
    } catch (error) {
      console.error('Error fetching conversion stats:', error);
    }
  };

  const fetchQuoteAndBookingValues = async () => {
    try {
      const today = new Date();
      const yesterday = subDays(today, 1);
      const todayStr = format(today, 'yyyy-MM-dd');
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

      // Fetch quotes with a high limit to get all quotes
      const quotesRes = await fetch('/api/admin/quotes?limit=10000', {
        credentials: 'include',
      });
      
      if (!quotesRes.ok) {
        console.error('Quotes API response not OK:', quotesRes.status, quotesRes.statusText);
        // Don't throw - just return early to prevent breaking the dashboard
        setQuotesToday(0);
        setQuotesYesterday(0);
        setQuotes7DayAvg(0);
        return;
      }
      
      const quotesData = await quotesRes.json();

      let todayQuotesTotal = 0;
      let yesterdayQuotesTotal = 0;

      if (quotesData.ok && quotesData.quotes) {
        // Calculate today's quotes total value
        const todayQuotes = quotesData.quotes.filter((quote: any) => {
          const quoteDate = format(parseISO(quote.created_at), 'yyyy-MM-dd');
          return quoteDate === todayStr;
        });

        todayQuotesTotal = todayQuotes.reduce((sum: number, quote: any) => {
          const price = quote.estimated_price || 0;
          // Convert from cents to rands if needed (assuming prices > 10000 are in cents)
          return sum + (price > 10000 ? price / 100 : price);
        }, 0);

        // Calculate yesterday's quotes total value
        const yesterdayQuotes = quotesData.quotes.filter((quote: any) => {
          const quoteDate = format(parseISO(quote.created_at), 'yyyy-MM-dd');
          return quoteDate === yesterdayStr;
        });

        yesterdayQuotesTotal = yesterdayQuotes.reduce((sum: number, quote: any) => {
          const price = quote.estimated_price || 0;
          return sum + (price > 10000 ? price / 100 : price);
        }, 0);

        // Calculate 7-day average for quotes (excluding today)
        const sevenDaysAgo = subDays(today, 7);
        const sevenDaysAgoStr = format(sevenDaysAgo, 'yyyy-MM-dd');
        const last7DaysQuotes = quotesData.quotes.filter((quote: any) => {
          const quoteDate = format(parseISO(quote.created_at), 'yyyy-MM-dd');
          return quoteDate >= sevenDaysAgoStr && quoteDate < todayStr;
        });

        const last7DaysQuotesTotal = last7DaysQuotes.reduce((sum: number, quote: any) => {
          const price = quote.estimated_price || 0;
          return sum + (price > 10000 ? price / 100 : price);
        }, 0);
        setQuotes7DayAvg(last7DaysQuotesTotal / 7);
      }

      setQuotesToday(todayQuotesTotal);
      setQuotesYesterday(yesterdayQuotesTotal);

      // Fetch all bookings to calculate today's and yesterday's revenue
      const bookingsRes = await fetch('/api/admin/bookings?limit=10000', {
        credentials: 'include',
      });
      
      if (!bookingsRes.ok) {
        const errorData = await bookingsRes.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Bookings API response not OK:', bookingsRes.status, bookingsRes.statusText, errorData);
        // Don't throw - just set defaults and continue to prevent breaking the dashboard
        setBookingsToday(0);
        setBookingsYesterday(0);
        setBookingsCountToday(0);
        setBookings7DayAvg(0);
        return;
      }
      
      const bookingsData = await bookingsRes.json();

      let todayBookingsTotal = 0;
      let yesterdayBookingsTotal = 0;

      if (bookingsData.ok && bookingsData.bookings) {
        // Calculate today's bookings revenue and count
        const todayBookings = bookingsData.bookings.filter((booking: any) => {
          const bookingDate = format(parseISO(booking.created_at), 'yyyy-MM-dd');
          return bookingDate === todayStr;
        });

        todayBookingsTotal = todayBookings.reduce((sum: number, booking: any) => {
          const amount = booking.total_amount || 0;
          // Convert from cents to rands if needed
          return sum + (amount > 10000 ? amount / 100 : amount);
        }, 0);

        setBookingsCountToday(todayBookings.length);

        // Calculate yesterday's bookings revenue
        const yesterdayBookings = bookingsData.bookings.filter((booking: any) => {
          const bookingDate = format(parseISO(booking.created_at), 'yyyy-MM-dd');
          return bookingDate === yesterdayStr;
        });

        yesterdayBookingsTotal = yesterdayBookings.reduce((sum: number, booking: any) => {
          const amount = booking.total_amount || 0;
          return sum + (amount > 10000 ? amount / 100 : amount);
        }, 0);

        // Calculate 7-day average for bookings (excluding today)
        const sevenDaysAgo = subDays(today, 7);
        const sevenDaysAgoStr = format(sevenDaysAgo, 'yyyy-MM-dd');
        const last7DaysBookings = bookingsData.bookings.filter((booking: any) => {
          const bookingDate = format(parseISO(booking.created_at), 'yyyy-MM-dd');
          return bookingDate >= sevenDaysAgoStr && bookingDate < todayStr;
        });

        const last7DaysBookingsTotal = last7DaysBookings.reduce((sum: number, booking: any) => {
          const amount = booking.total_amount || 0;
          return sum + (amount > 10000 ? amount / 100 : amount);
        }, 0);
        setBookings7DayAvg(last7DaysBookingsTotal / 7);
      }

      setBookingsToday(todayBookingsTotal);
      setBookingsYesterday(yesterdayBookingsTotal);

    } catch (error) {
      console.error('Error fetching quote and booking values:', error);
    }
  };

  const transformBookingChartData = (data: any[]) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (!data || data.length === 0) {
      // Generate sample data if none available, always including today
      const sampleData: BookingChartData[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = date.toISOString().split('T')[0];
        sampleData.push({
          date: dateStr,
          moveInMoveOut: 0,
          standardCleaning: 0,
          deepCleaning: 0,
          airbnb: 0,
        });
      }
      // Ensure today is included
      if (!sampleData.find(item => item.date === todayStr)) {
        sampleData.push({
          date: todayStr,
          moveInMoveOut: 0,
          standardCleaning: 0,
          deepCleaning: 0,
          airbnb: 0,
        });
      }
      const sorted = sampleData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setBookingChartData(sorted);
      setFilteredBookingChartData(sorted);
      return;
    }

    // Use real data from API (service type breakdown) - sorted oldest to newest
    let transformed: BookingChartData[] = data
      .map((item) => ({
        date: item.date,
        moveInMoveOut: item.moveInMoveOut || 0,
        standardCleaning: item.standardCleaning || 0,
        deepCleaning: item.deepCleaning || 0,
        airbnb: item.airbnb || 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Ensure today's date is always included (even if empty/zero)
    const hasToday = transformed.some(item => item.date === todayStr);
    if (!hasToday) {
      transformed.push({
        date: todayStr,
        moveInMoveOut: 0,
        standardCleaning: 0,
        deepCleaning: 0,
        airbnb: 0,
      });
      // Re-sort after adding today
      transformed = transformed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    setBookingChartData(transformed);
    setFilteredBookingChartData(transformed);
  };

  // Filter booking chart data based on selected service
  useEffect(() => {
    // Reset chart offset when service filter changes
    setBookingsChartOffset(0);
    
    if (selectedServiceFilter === 'all') {
      setFilteredBookingChartData(bookingChartData);
    } else {
      const filtered = bookingChartData.map(item => {
        const filteredItem: BookingChartData = {
          date: item.date,
          moveInMoveOut: 0,
          standardCleaning: 0,
          deepCleaning: 0,
          airbnb: 0,
        };
        if (selectedServiceFilter === 'moveInMoveOut') {
          filteredItem.moveInMoveOut = item.moveInMoveOut;
        } else if (selectedServiceFilter === 'standardCleaning') {
          filteredItem.standardCleaning = item.standardCleaning;
        } else if (selectedServiceFilter === 'deepCleaning') {
          filteredItem.deepCleaning = item.deepCleaning;
        } else if (selectedServiceFilter === 'airbnb') {
          filteredItem.airbnb = item.airbnb;
        }
        return filteredItem;
      });
      setFilteredBookingChartData(filtered);
    }
  }, [selectedServiceFilter, bookingChartData]);

  const calculateRevenueByServiceType = async (chartData: any[]) => {
    try {
      // Fetch bookings for the last 10 days to get revenue by service type
      const today = new Date();
      const tenDaysAgo = new Date(today);
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const startDateISO = tenDaysAgo.toISOString();
      const endDateISO = today.toISOString();

      const bookingsRes = await fetch(`/api/admin/bookings?limit=10000`, {
        credentials: 'include',
      });
      
      if (!bookingsRes.ok) return;
      
      const bookingsData = await bookingsRes.json();
      
      if (bookingsData.ok && bookingsData.bookings) {
        const serviceRevenue = {
          moveInMoveOut: 0,
          standardCleaning: 0,
          deepCleaning: 0,
          airbnb: 0,
        };

        bookingsData.bookings.forEach((booking: any) => {
          const bookingDate = new Date(booking.created_at);
          if (bookingDate >= tenDaysAgo && booking.status === 'completed') {
            const amount = (booking.total_amount || 0) > 10000 
              ? (booking.total_amount || 0) / 100 
              : (booking.total_amount || 0);
            
            const serviceType = (booking.service_type || '').trim();
            if (serviceType === 'Move In/Out' || serviceType.toLowerCase().includes('move')) {
              serviceRevenue.moveInMoveOut += amount;
            } else if (serviceType === 'Standard') {
              serviceRevenue.standardCleaning += amount;
            } else if (serviceType === 'Deep') {
              serviceRevenue.deepCleaning += amount;
            } else if (serviceType === 'Airbnb' || serviceType.toLowerCase().includes('airbnb')) {
              serviceRevenue.airbnb += amount;
            }
          }
        });

        setRevenueByService(serviceRevenue);
      }
    } catch (error) {
      console.error('Error calculating revenue by service type:', error);
    }
  };

  const transformRevenueChartData = (data: any[]) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (!data || data.length === 0) {
      // Fill with zero data for last 30 days if no data available, always including today
      const emptyData: RevenueChartData[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = date.toISOString().split('T')[0];
        emptyData.push({
          date: dateStr,
          revenue: 0,
        });
      }
      // Ensure today is included
      if (!emptyData.find(item => item.date === todayStr)) {
        emptyData.push({
          date: todayStr,
          revenue: 0,
        });
      }
      const sorted = emptyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setRevenueChartData(sorted);
      return;
    }

    // Transform data from database - use revenue field (total revenue from completed bookings)
    // The API already converts from cents to rands, so revenue is in rands
    // Sort by date oldest to newest
    let transformed: RevenueChartData[] = data
      .map((item) => ({
        date: item.date,
        revenue: item.revenue || 0, // Use revenue field from database (completed bookings total_amount)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Ensure today's date is always included (even if empty/zero)
    const hasToday = transformed.some(item => item.date === todayStr);
    if (!hasToday) {
      transformed.push({
        date: todayStr,
        revenue: 0,
      });
      // Re-sort after adding today
      transformed = transformed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    setRevenueChartData(transformed);
  };

  const transformCustomerChartData = (data: any[]) => {
    if (!data || data.length === 0) {
      // Generate zero data if none available
      const sampleData: CustomerChartData[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        sampleData.push({
          date: date.toISOString().split('T')[0],
          new: 0,
          recurring: 0,
          returning: 0,
        });
      }
      setCustomerChartData(sampleData);
      return;
    }

    // Use actual customer data from API and convert to cumulative
    let cumulativeNew = 0;
    let cumulativeRecurring = 0;
    let cumulativeReturning = 0;
    
    const transformed: CustomerChartData[] = data.map((item) => {
      cumulativeNew += item.newCustomers || 0;
      cumulativeRecurring += item.recurringCustomers || 0;
      cumulativeReturning += item.returningCustomers || 0;
      
      return {
        date: item.date,
        new: cumulativeNew,
        recurring: cumulativeRecurring,
        returning: cumulativeReturning,
      };
    });

    setCustomerChartData(transformed);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    // Handle edge cases
    if (previous === 0) {
      // If previous is 0 and current > 0, it's a new value (infinite increase)
      // Return a large positive number to indicate significant increase
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  };

  // Calculate percentage changes from real data
  const quotesChange = calculatePercentageChange(quotesToday, quotesYesterday);
  const bookingsChange = calculatePercentageChange(bookingsToday, bookingsYesterday);
  
  // Calculate 7-day average comparisons
  const quotes7DayChange = quotes7DayAvg > 0 
    ? calculatePercentageChange(quotesToday, quotes7DayAvg)
    : 0;
  const bookings7DayChange = bookings7DayAvg > 0
    ? calculatePercentageChange(bookingsToday, bookings7DayAvg)
    : 0;

  // Calculate Average Booking Value (ABV)
  const avgBookingValue = bookingsCountToday > 0 
    ? bookingsToday / bookingsCountToday 
    : 0;
  
  // Use calculated percentages (or display 0 if no change)
  const displayQuotesChange = quotesChange;
  const displayBookingsChange = bookingsChange;

  // Use real conversion stats from database
  const { totalQuotes, convertedBookings, nonBooked } = conversionStats;
  
  // Calculate conversion rate properly: bookings from quotes created today
  // Conversion rate = (Bookings today / Quotes today) × 100
  // If no quotes today, we can't calculate conversion rate (bookings may have been created directly)
  const conversionRate = totalQuotes > 0 
    ? Math.round((convertedBookings / totalQuotes) * 100) 
    : 0;

  // Ensure conversion rate doesn't exceed 100%
  const safeConversionRate = Math.min(100, conversionRate);

  const conversionData = [
    { name: 'Booked', value: convertedBookings, color: '#10b981' },
    { name: 'Quote', value: nonBooked, color: '#9ca3af' },
  ];

  // Calculate max value for Y-axis scaling
  const maxYValue = useMemo(() => {
    if (!filteredBookingChartData || filteredBookingChartData.length === 0) return 10;
    // Calculate max single bar height (sum of all service types for a day)
    const maxDailyTotal = Math.max(
      ...filteredBookingChartData.map(item => 
        (item.moveInMoveOut || 0) + (item.standardCleaning || 0) + (item.deepCleaning || 0) + (item.airbnb || 0)
      )
    );
    // Round up to nearest 5 for clean axis, with minimum of 10
    return Math.max(10, Math.ceil(maxDailyTotal / 5) * 5);
  }, [filteredBookingChartData]);

  const yAxisTicks = useMemo(() => {
    const ticks = [];
    const step = maxYValue / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(i * step);
    }
    return ticks;
  }, [maxYValue]);

  // Calculate max value for customer chart Y-axis scaling
  const maxCustomerYValue = useMemo(() => {
    if (!customerChartData || customerChartData.length === 0) return 50;
    // Calculate max single day value across all customer types
    const maxDailyTotal = Math.max(
      ...customerChartData.map(item => 
        (item.new || 0) + (item.recurring || 0) + (item.returning || 0)
      )
    );
    // Round up to nearest 10 for clean axis, with minimum of 50
    return Math.max(50, Math.ceil(maxDailyTotal / 10) * 10);
  }, [customerChartData]);

  const customerYAxisTicks = useMemo(() => {
    const ticks = [];
    const step = maxCustomerYValue / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(i * step);
    }
    return ticks;
  }, [maxCustomerYValue]);

  // Calculate max revenue value for Y-axis scaling (similar to design: $500, $1000, $1500, $2000)
  const maxRevenueYValue = useMemo(() => {
    if (!revenueChartData || revenueChartData.length === 0) return 2000;
    const maxDailyRevenue = Math.max(...revenueChartData.map(item => item.revenue || 0));
    // Round up to nearest 500, with minimum of 2000 to match design ticks
    const rounded = Math.max(2000, Math.ceil(maxDailyRevenue / 500) * 500);
    return rounded;
  }, [revenueChartData]);

  const revenueYAxisTicks = useMemo(() => {
    // Generate ticks at 0, $500, $1000, $1500, $2000 (or scale proportionally)
    // Always show 5 ticks: 0, step, 2*step, 3*step, 4*step
    const ticks = [];
    const step = maxRevenueYValue / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(i * step);
    }
    return ticks;
  }, [maxRevenueYValue]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-red-800 font-semibold">Error Loading Dashboard</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setError(null);
              fetchDashboardData();
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Helper function to get alert color based on status
  const getAlertColor = (status?: string, type?: 'quote' | 'booking') => {
    if (type === 'quote') {
      return 'bg-blue-600 hover:bg-blue-700';
    }
    
    switch (status) {
      case 'completed':
        return 'bg-green-600 hover:bg-green-700';
      case 'cancelled':
      case 'cancelled_by_customer':
      case 'cancelled_by_admin':
        return 'bg-red-600 hover:bg-red-700';
      case 'pending':
        return 'bg-orange-600 hover:bg-orange-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  // Helper function to format booking date
  const formatBookingDateDisplay = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    try {
      const date = parseISO(dateStr);
      return format(date, 'MMM d');
    } catch {
      return dateStr;
    }
  };

  // Helper function to get location display
  const getLocationDisplay = () => {
    if (!latestNotification) return 'N/A';
    const parts = [latestNotification.address_suburb, latestNotification.address_city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location TBD';
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-4 sm:p-6">
      {/* Enhanced Alert Banner */}
      {latestNotification && (
        <div 
          className={`${getAlertColor(latestNotification.status, latestNotification.type)} text-white px-6 py-4 rounded-lg shadow-lg transition-colors`}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left side - Icon and main content */}
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {/* Main title */}
                <div className="font-semibold text-base mb-2">
                  {latestNotification.type === 'booking' ? '🔔 New Booking Received' : '🔔 New Quote Received'}
                </div>
                
                {/* Service and Amount */}
                <div className="font-medium mb-2">
                  {latestNotification.service_type || 'Standard Cleaning'} – {formatCurrency(latestNotification.total_amount || 0)}
                </div>
                
                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm opacity-95">
                  {latestNotification.customer_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span><strong>Customer:</strong> {latestNotification.customer_name}</span>
                    </div>
                  )}
                  {latestNotification.booking_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span><strong>Date:</strong> {formatBookingDateDisplay(latestNotification.booking_date)}</span>
                    </div>
                  )}
                  {(latestNotification.address_suburb || latestNotification.address_city) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span><strong>Area:</strong> {getLocationDisplay()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-start gap-2 flex-shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const tab = latestNotification.type === 'quote' ? 'quotes' : 'bookings';
                  // Dispatch custom event to change admin tab
                  window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: tab }));
                  // Also update URL hash for better navigation
                  window.location.hash = tab;
                  // Scroll to top
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Eye className="h-4 w-4 mr-1.5" />
                View {latestNotification.type === 'booking' ? 'Booking' : 'Quote'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismissNotification();
                }}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Check className="h-4 w-4 mr-1.5" />
                Mark as Seen
              </Button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismissNotification();
                }}
                className="hover:bg-white/20 p-1.5 rounded transition-colors flex-shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 my-6">
        <TodaysBookingsWidget 
          bookings={stats?.bookings?.todayBookings || []} 
        />
        <ActiveCleanersWidget 
          totalCleaners={stats?.cleaners?.total || 0}
        />
        <RecentActivityWidget 
          stats={{
            bookings: {
              today: stats?.bookings?.today || 0,
              pending: stats?.bookings?.pending || 0,
              completed: 0,
            }
          }}
        />
        <QuotesWidgetDashboard 
          pendingCount={stats?.quotes?.pending || 0}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-6">
        {/* New Bookings - Large Card (2/3 width, 2 rows) */}
        <div className="lg:col-span-2 lg:row-span-2">
          <Card className="bg-white shadow-sm flex flex-col h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <DropdownMenu open={isServiceDropdownOpen} onOpenChange={setIsServiceDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
                          <span>{getServiceDisplayName()}</span>
                          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => { setSelectedServiceFilter('all'); setIsServiceDropdownOpen(false); }}
                          className={selectedServiceFilter === 'all' ? 'bg-gray-100' : ''}
                        >
                          All Services
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => { setSelectedServiceFilter('moveInMoveOut'); setIsServiceDropdownOpen(false); }}
                          className={selectedServiceFilter === 'moveInMoveOut' ? 'bg-gray-100' : ''}
                        >
                          Move In/Out
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => { setSelectedServiceFilter('standardCleaning'); setIsServiceDropdownOpen(false); }}
                          className={selectedServiceFilter === 'standardCleaning' ? 'bg-gray-100' : ''}
                        >
                          Standard Cleaning
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => { setSelectedServiceFilter('deepCleaning'); setIsServiceDropdownOpen(false); }}
                          className={selectedServiceFilter === 'deepCleaning' ? 'bg-gray-100' : ''}
                        >
                          Deep Cleaning
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => { setSelectedServiceFilter('airbnb'); setIsServiceDropdownOpen(false); }}
                          className={selectedServiceFilter === 'airbnb' ? 'bg-gray-100' : ''}
                        >
                          Airbnb
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-xs text-gray-500">Last 10 days</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 flex-grow flex flex-col">
              {/* Summary Stats with Percentages */}
              {(() => {
                const total = moveInMoveOut + standardCleaning + deepCleaning + airbnb;
                const moveInPercent = total > 0 ? Math.round((moveInMoveOut / total) * 100) : 0;
                const standardPercent = total > 0 ? Math.round((standardCleaning / total) * 100) : 0;
                const deepPercent = total > 0 ? Math.round((deepCleaning / total) * 100) : 0;
                const airbnbPercent = total > 0 ? Math.round((airbnb / total) * 100) : 0;
                
                return (
                  <div className="mb-6">
                    <div className="flex items-start gap-6">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-semibold">{total.toLocaleString()}</span>
                        <span className="text-sm text-gray-600">Total</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-semibold">{moveInMoveOut.toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Move In/Move Out</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-semibold">{standardCleaning.toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Standard Cleaning</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-semibold">{deepCleaning.toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Deep Cleaning</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-semibold">{airbnb.toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Airbnb</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Bar Chart with Daily Average Line */}
              <div className="h-full relative flex-1 px-8">
                <ResponsiveContainer width="100%" height="100%">
                  {(() => {
                    // Calculate paginated data based on offset
                    // Always include the current date (last item) in the visible range
                    const totalData = filteredBookingChartData.length;
                    if (totalData === 0) {
                      return null;
                    }
                    
                    // Always end at the last item (today's date)
                    const endIndex = totalData;
                    // Show ITEMS_PER_PAGE items, always ending with today
                    // When offset = 0: show last 10 items (9 older + today)
                    // When offset = 10: show items [totalData - 20, totalData) but we want only 10, so [totalData - 10 - offset, totalData)
                    const startIndex = Math.max(0, totalData - ITEMS_PER_PAGE - bookingsChartOffset);
                    const paginatedData = filteredBookingChartData.slice(startIndex, endIndex);
                    
                    const totalBookings = paginatedData.reduce((sum, item) => 
                      sum + (item.moveInMoveOut || 0) + (item.standardCleaning || 0) + (item.deepCleaning || 0) + (item.airbnb || 0), 0
                    );
                    const dailyAvg = paginatedData.length > 0 ? totalBookings / paginatedData.length : 0;
                    const chartDataWithAvg = paginatedData.map(item => ({
                      ...item,
                      dailyAverage: dailyAvg
                    }));
                    
                    // Can go left (to older dates) if there are more items before startIndex
                    const canGoLeft = startIndex > 0;
                    // Can go right (to newer dates) if we've scrolled left (offset > 0)
                    const canGoRight = bookingsChartOffset > 0;
                    
                    return (
                      <ComposedChart data={chartDataWithAvg} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          angle={-45}
                          textAnchor="end"
                          height={40}
                          tick={{ fontSize: 11 }}
                          stroke="#6b7280"
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          stroke="#6b7280"
                          domain={[0, maxYValue]}
                          ticks={yAxisTicks}
                          tickFormatter={(value) => value.toString()}
                        />
                        <Tooltip
                          content={(props: any) => {
                            if (!props.active || !props.payload || !props.payload.length) return null;
                            const payload = props.payload[0].payload;
                            const date = formatDate(payload.date);
                            const moveIn = payload.moveInMoveOut || 0;
                            const standard = payload.standardCleaning || 0;
                            const deep = payload.deepCleaning || 0;
                            const airbnb = payload.airbnb || 0;
                            const dayTotal = moveIn + standard + deep + airbnb;
                            const dailyAvg = payload.dailyAverage || 0;
                            
                            return (
                              <div style={{
                                backgroundColor: 'rgba(55, 65, 81, 0.95)',
                                border: '1px solid white',
                                borderRadius: '4px',
                                padding: '8px 12px',
                                color: 'white',
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{date}</div>
                                {moveIn > 0 && <div style={{ fontSize: '12px' }}>Move In/Out: {moveIn.toLocaleString()}</div>}
                                {standard > 0 && <div style={{ fontSize: '12px' }}>Standard Cleaning: {standard.toLocaleString()}</div>}
                                {deep > 0 && <div style={{ fontSize: '12px' }}>Deep Cleaning: {deep.toLocaleString()}</div>}
                                {airbnb > 0 && <div style={{ fontSize: '12px' }}>Airbnb: {airbnb.toLocaleString()}</div>}
                                {dayTotal > 0 && (
                                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '4px' }}>
                                    Total: {dayTotal.toLocaleString()}
                                  </div>
                                )}
                                {dailyAvg > 0 && (
                                  <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '4px' }}>
                                    Daily Average: {dailyAvg.toFixed(1)}
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="moveInMoveOut" fill="#3b82f6" name="Move In/Move Out" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="standardCleaning" fill="#f59e0b" name="Standard Cleaning" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="deepCleaning" fill="#ef4444" name="Deep Cleaning" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="airbnb" fill="#10b981" name="Airbnb" radius={[4, 4, 0, 0]} />
                        <Line
                          type="monotone"
                          dataKey="dailyAverage"
                          stroke="#6b7280"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Daily Average"
                          connectNulls
                        />
                      </ComposedChart>
                    );
                  })()}
                </ResponsiveContainer>

                {/* Navigation arrows */}
                {(() => {
                  const totalData = filteredBookingChartData.length;
                  if (totalData === 0) {
                    return null;
                  }
                  const startIndex = Math.max(0, totalData - ITEMS_PER_PAGE - bookingsChartOffset);
                  const canGoLeft = startIndex > 0;
                  const canGoRight = bookingsChartOffset > 0;
                  
                  return (
                    <>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (canGoLeft) {
                            setBookingsChartOffset(prev => prev + ITEMS_PER_PAGE);
                          }
                        }}
                        disabled={!canGoLeft}
                        type="button"
                        aria-label="Scroll to older dates"
                        className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white border border-gray-200 rounded shadow-sm transition-colors z-10 ${
                          !canGoLeft ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <ArrowLeft className="h-5 w-5 text-gray-700" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (canGoRight) {
                            setBookingsChartOffset(prev => Math.max(0, prev - ITEMS_PER_PAGE));
                          }
                        }}
                        disabled={!canGoRight}
                        type="button"
                        aria-label="Scroll to newer dates"
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white border border-gray-200 rounded shadow-sm transition-colors z-10 ${
                          !canGoRight ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <ArrowRight className="h-5 w-5 text-gray-700" />
                      </button>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Two Cards */}
        <div className="lg:col-span-1 lg:row-span-2 space-y-6 flex flex-col">
          {/* Quotes & Bookings Values */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <span>Quotes & Bookings Values</span>
                <span className="text-xs font-normal text-gray-500 ml-2">Today</span>
                <div className="flex items-center gap-2 ml-auto">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 gap-6 mb-4">
                {/* Quotes */}
                <div>
                  <div className="mb-1">
                    <span className="text-xl font-bold">
                      {formatCurrency(quotesToday)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Quotes</p>
                  {quotesChange !== 0 ? (
                    <>
                      {quotesChange > 0 ? (
                        <p className="text-green-600 text-sm flex items-center gap-1 mt-2 mb-1">
                          <TrendingUp className="h-4 w-4" />
                          {Math.abs(quotesChange)}%
                        </p>
                      ) : (
                        <p className="text-red-600 text-sm flex items-center gap-1 mt-2 mb-1">
                          <TrendingDown className="h-4 w-4" />
                          {Math.abs(quotesChange)}%
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Since Yesterday
                      </p>
                    </>
                  ) : null}
                </div>

                {/* Bookings */}
                <div>
                  <div className="mb-1">
                    <span className="text-xl font-bold">
                      {formatCurrency(bookingsToday)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Bookings</p>
                  {bookingsChange !== 0 ? (
                    <>
                      {bookingsChange > 0 ? (
                        <p className="text-green-600 text-sm flex items-center gap-1 mt-2 mb-1">
                          <TrendingUp className="h-4 w-4" />
                          {Math.abs(bookingsChange)}%
                        </p>
                      ) : (
                        <p className="text-red-600 text-sm flex items-center gap-1 mt-2 mb-1">
                          <TrendingDown className="h-4 w-4" />
                          {Math.abs(bookingsChange)}%
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Since Yesterday
                      </p>
                    </>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversions */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold">Conversions</span>
                  <span className="text-sm font-normal text-gray-500">Today</span>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center gap-4">
                {/* Left side: Donut Chart */}
                <div className="flex flex-col items-start">
                  <div className="relative h-32 w-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={conversionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={50}
                          paddingAngle={0}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                          stroke="#e5e7eb"
                          strokeWidth={2}
                        >
                          {conversionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#e5e7eb" strokeWidth={2} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-green-600">
                        {totalQuotes > 0 ? `${safeConversionRate}%` : 'N/A'}
                      </span>
                      <span className="text-xs text-gray-600">
                        {totalQuotes > 0 ? 'Conversion' : 'No quotes'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Breakdown */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{convertedBookings} Bookings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">{nonBooked} Quote</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-sm font-semibold text-gray-700">
                      {totalQuotes > 0 ? totalQuotes : convertedBookings} Total {totalQuotes > 0 ? 'Quotes' : 'Bookings'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row - Revenue and Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Widget */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <span>Revenue</span>
                <span className="text-sm font-normal text-gray-500">Last 10 days</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xl font-bold">{formatCurrency(revenueLast10Days)}</span>
                {revenuePrev10Days > 0 && (
                  <>
                    {revenueLast10Days > revenuePrev10Days ? (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {Math.abs(calculatePercentageChange(revenueLast10Days, revenuePrev10Days))}%
                      </span>
                    ) : revenueLast10Days < revenuePrev10Days ? (
                      <span className="text-red-600 text-sm flex items-center gap-1">
                        <TrendingDown className="h-4 w-4" />
                        {Math.abs(calculatePercentageChange(revenueLast10Days, revenuePrev10Days))}%
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            {/* Bar Chart */}
            <div className="h-[200px] relative px-12">
              <ResponsiveContainer width="100%" height="100%">
                {(() => {
                  // Calculate paginated data based on offset for revenue chart
                  // Always include the current date (last item) in the visible range
                  const totalRevenueData = revenueChartData.length;
                  if (totalRevenueData === 0) {
                    return null;
                  }
                  
                  // Always end at the last item (today's date)
                  const revenueEndIndex = totalRevenueData;
                  // Show ITEMS_PER_PAGE items, always ending with today
                  const revenueStartIndex = Math.max(0, totalRevenueData - ITEMS_PER_PAGE - revenueChartOffset);
                  const paginatedRevenueData = revenueChartData.slice(revenueStartIndex, revenueEndIndex);
                  
                  return (
                    <BarChart data={paginatedRevenueData} margin={{ top: 20, right: 40, left: 40, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" horizontal={true} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                    tickFormatter={(value) => formatCurrency(value)}
                    domain={[0, maxRevenueYValue]}
                    ticks={revenueYAxisTicks}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(55, 65, 81, 0.95)',
                      border: '1px solid white',
                      borderRadius: '4px',
                      color: 'white',
                    }}
                    labelFormatter={(label) => formatDate(label)}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue">
                    {paginatedRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#10b981" />
                    ))}
                  </Bar>
                </BarChart>
                  );
                })()}
              </ResponsiveContainer>

              {/* Navigation arrows - Left and Right */}
              {(() => {
                const totalRevenueData = revenueChartData.length;
                if (totalRevenueData === 0) {
                  return null;
                }
                const revenueStartIndex = Math.max(0, totalRevenueData - ITEMS_PER_PAGE - revenueChartOffset);
                const canGoLeft = revenueStartIndex > 0;
                const canGoRight = revenueChartOffset > 0;
                
                return (
                  <>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (canGoLeft) {
                          setRevenueChartOffset(prev => prev + ITEMS_PER_PAGE);
                        }
                      }}
                      disabled={!canGoLeft}
                      type="button"
                      aria-label="Scroll to older dates"
                      className={`absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white border border-gray-200 rounded shadow-sm transition-colors z-10 ${
                        !canGoLeft ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <ArrowLeft className="h-5 w-5 text-gray-700" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (canGoRight) {
                          setRevenueChartOffset(prev => Math.max(0, prev - ITEMS_PER_PAGE));
                        }
                      }}
                      disabled={!canGoRight}
                      type="button"
                      aria-label="Scroll to newer dates"
                      className={`absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white border border-gray-200 rounded shadow-sm transition-colors z-10 ${
                        !canGoRight ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <ArrowRight className="h-5 w-5 text-gray-700" />
                    </button>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Customers Widget */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <span>Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal text-gray-500">Last 30 days</span>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="mb-4">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-base font-semibold text-gray-900">{newCustomers.toLocaleString()}</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-5">New Customers</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-base font-semibold text-gray-900">{recurringCustomers.toLocaleString()}</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-5">Recurring Customers</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-base font-semibold text-gray-900">{returningCustomers.toLocaleString()}</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-5">Returning Customers</span>
                </div>
              </div>
            </div>

            {/* Line Chart */}
            <div className="h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customerChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    angle={-45}
                    textAnchor="end"
                    height={40}
                    interval={customerChartData.length > 14 ? Math.floor(customerChartData.length / 7) : 0}
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                    domain={[0, maxCustomerYValue]}
                    ticks={customerYAxisTicks}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(55, 65, 81, 0.95)',
                      border: '1px solid white',
                      borderRadius: '4px',
                      color: 'white',
                    }}
                    labelFormatter={(label) => formatDate(label)}
                    formatter={(value: any) => value.toLocaleString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="new" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false}
                    name="New Customers"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="recurring" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    dot={false}
                    name="Recurring Customers"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="returning" 
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    dot={false}
                    name="Returning Customers"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


