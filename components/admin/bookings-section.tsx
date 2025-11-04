'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Search,
  Calendar,
  Download,
  ChevronDown,
  CreditCard,
  X,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { fetcher } from '@/lib/fetcher';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  address_zip?: string;
  status: string;
  total_amount: number;
  service_fee: number;
  cleaner_earnings: number;
  payment_reference: string;
  created_at: string;
  cleaner_id: string | null;
  cleaner_name?: string | null;
  customer_id: string | null;
  requires_team?: boolean;
  team_assigned?: boolean;
  notes_count?: number;
  frequency?: string;
  duration?: number;
  recurring_bookings_count?: number;
}

type BookingView = 'new' | 'previous' | 'recurring' | 'all';
type StatusFilter = 'all' | 'completed' | 'missed' | 'cancelled';

export function BookingsSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<BookingView>(() => {
    return (searchParams?.get('view') as BookingView) || 'recurring';
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('completed');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchInput, setSearchInput] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [page, setPage] = useState(1);
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());

  // Debounce search input
  const search = useDebouncedValue(searchInput, 500);

  // Build API URL with params
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...(search && { search }),
    ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
    ...(sortOrder && { sort: sortOrder }),
    ...(view && { view }),
    ...(view && { view }),
  });

  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR<{
    bookings: Booking[];
    pagination: { totalPages: number; total: number };
  }>(
    `/api/admin/bookings?${params}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const bookings = data?.bookings || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalCount = data?.pagination?.total || 0;

  // Calculate statistics for dropdown
  const stats = {
    completed: bookings.filter(b => b.status === 'completed').length,
    missed: bookings.filter(b => b.status === 'missed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    total: totalCount,
  };

  const handleViewChange = (newView: BookingView) => {
    setView(newView);
    router.push(`/admin/bookings?view=${newView}`);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
      });
      window.open(`/api/admin/bookings/export?${params}`, '_blank');
    } catch (err) {
      console.error('Error exporting bookings:', err);
      alert('Failed to export bookings');
    }
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy');
  };

  const formatTimeRange = (time: string) => {
    // Assuming time is in format "HH:MM" or "HH:MM - HH:MM"
    if (time.includes('-')) {
      return time;
    }
    // If single time, try to format it
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  // Determine payment status - this would come from the booking data
  const getPaymentStatus = (booking: Booking) => {
    // You may need to add a payment_status field to the Booking interface
    // For now, we'll check if status is 'declined' or similar
    const isDeclined = booking.status === 'declined' || booking.payment_reference === 'declined';
    return { isDeclined };
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'R0.00';
    }
    // If amount is in cents (stored as integer), divide by 100
    // If amount is already in dollars, use it directly
    // Check if amount seems to be in cents (> 1000 for a reasonable price)
    const dollarAmount = amount > 1000 ? amount / 100 : amount;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollarAmount);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => handleViewChange('new')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                view === 'new'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              New Bookings
            </button>
            <button
              onClick={() => handleViewChange('previous')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                view === 'previous'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              Previous Bookings
            </button>
            <button
              onClick={() => handleViewChange('recurring')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                view === 'recurring'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              Recurring Bookings
            </button>
            <button
              onClick={() => handleViewChange('all')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                view === 'all'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              All Bookings
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Buttons */}
        <div className="flex space-x-2 mb-6">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            className={cn(
              statusFilter === 'all'
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('completed')}
            className={cn(
              statusFilter === 'completed'
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            Completed
          </Button>
          <Button
            variant={statusFilter === 'missed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('missed')}
            className={cn(
              statusFilter === 'missed'
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            Missed
          </Button>
          <Button
            variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('cancelled')}
            className={cn(
              statusFilter === 'cancelled'
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            Cancelled
          </Button>
        </div>

        {/* Page Title, Sort, Search, Date Picker, and Download */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Recurring Bookings
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none">
                  <span className="text-gray-500 font-normal">({totalCount})</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Booking Statistics</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center justify-between">
                  <span>Total Bookings</span>
                  <span className="font-semibold">{stats.total}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-between">
                  <span>Completed</span>
                  <span className="font-semibold text-green-600">{stats.completed}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-between">
                  <span>Missed</span>
                  <span className="font-semibold text-orange-600">{stats.missed}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-between">
                  <span>Cancelled</span>
                  <span className="font-semibold text-red-600">{stats.cancelled}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </h1>
          
          <div className="flex items-center space-x-3">
            {/* Sort Dropdown */}
            <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
              <SelectTrigger className="w-[140px] border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Bar */}
            <div className="relative">
              <Input
                placeholder="Search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-[200px] border-gray-300"
              />
            </div>

            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal border-gray-300",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    ? <span>Today</span>
                    : selectedDate
                    ? format(selectedDate, 'PPP')
                    : <span>Today</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Download Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleExport}
              className="border-gray-300"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Column Headers */}
        {!isLoading && bookings.length > 0 && (
          <div className="bg-transparent text-gray-500 text-sm font-medium py-2 px-4 mb-2 hidden md:flex items-center">
            <div className="flex items-center gap-6 flex-wrap w-full">
              <div className="min-w-[180px] text-blue-600 cursor-pointer hover:text-blue-700">Date</div>
              <div className="min-w-[200px]">Services</div>
              <div className="min-w-[180px]">Customer</div>
              <div className="min-w-[140px]">Frequency</div>
              <div className="min-w-[180px]">Location</div>
              <div className="min-w-[120px] ml-auto text-right">Price</div>
            </div>
          </div>
        )}

        {/* Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
            No bookings found
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const isSelected = selectedBookings.has(booking.id);
              const paymentStatus = getPaymentStatus(booking);

              return (
                <div
                  key={booking.id}
                  onClick={() => toggleBookingSelection(booking.id)}
                  className={cn(
                    "bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-4 pr-6 cursor-pointer transition-all hover:shadow-md relative",
                    isSelected && "border-l-4 border-l-blue-500"
                  )}
                >
                  <div className="flex items-start gap-6 flex-wrap">
                    {/* Date and Time Block */}
                    <div className="flex flex-col gap-1 min-w-[180px]">
                      <span className="text-gray-900 font-medium">
                        {formatDate(booking.booking_date)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getDayName(booking.booking_date)} {formatTimeRange(booking.booking_time)}
                      </span>
                    </div>

                    {/* Service Type and Duration Block */}
                    <div className="flex flex-col gap-1 min-w-[200px]">
                      <span className="text-gray-900 font-medium">
                        {booking.service_type}
                      </span>
                      <span className="text-sm text-gray-500">
                        Duration {booking.duration || 3.5} hours
                      </span>
                    </div>

                    {/* Customer Name and ID Block */}
                    <div className="flex flex-col gap-1 min-w-[180px]">
                      <div className="text-gray-900 font-medium">
                        {booking.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        # {booking.id.slice(-6)}
                      </div>
                    </div>

                    {/* Frequency and Count Block */}
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <span className="text-gray-900 font-medium">
                        {booking.frequency || 'Bi-weekly'}
                      </span>
                      <Badge className="bg-blue-100 text-blue-700 rounded-full h-6 px-2.5 flex items-center justify-center text-xs font-normal">
                        {booking.recurring_bookings_count || 0}
                      </Badge>
                    </div>

                    {/* Location Block */}
                    <div className="flex flex-col gap-1 min-w-[180px]">
                      <span className="text-gray-900 font-medium">
                        {booking.address_line1 || booking.address_suburb || booking.address_city || 'N/A'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {booking.address_suburb || booking.address_city || 'N/A'}
                      </span>
                    </div>
                    {/* Price and Payment Status Block */}
                    <div className="flex flex-col gap-1 min-w-[120px] ml-auto">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <CreditCard className="h-4 w-4 text-gray-600" />
                          {paymentStatus.isDeclined && (
                            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 flex items-center justify-center">
                              <X className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-gray-900 font-medium text-right">
                          {formatCurrency(booking.total_amount)}
                        </span>
                      </div>
                      {paymentStatus.isDeclined && (
                        <span className="text-sm text-red-500 ml-6">Declined</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
