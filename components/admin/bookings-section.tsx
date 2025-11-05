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
  ChevronLeft,
  ChevronRight,
  CreditCard,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit,
  UserPlus,
  Users,
  UserMinus,
  RefreshCw,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { fetcher } from '@/lib/fetcher';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/lib/utils';
import { PRICING } from '@/lib/pricing';
import { EditBookingDialog } from '@/components/admin/edit-booking-dialog';
import { AssignCleanerDialog } from '@/components/admin/assign-cleaner-dialog';
import { AssignTeamDialog } from '@/components/admin/assign-team-dialog';

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
  bedrooms?: number | null;
  bathrooms?: number | null;
  extras?: string[] | null;
  price_snapshot?: any;
  notes?: string | null;
}

type BookingView = 'new' | 'previous' | 'recurring' | 'all';
type StatusFilter = 'all' | 'completed' | 'missed' | 'cancelled' | 'pending';

export function BookingsSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<BookingView>(() => {
    return (searchParams?.get('view') as BookingView) || 'new';
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    const statusParam = searchParams?.get('status');
    if (statusParam && ['all', 'completed', 'missed', 'cancelled', 'pending'].includes(statusParam)) {
      return statusParam as StatusFilter;
    }
    return 'completed';
  });
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchInput, setSearchInput] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [page, setPage] = useState(() => {
    const pageParam = searchParams?.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [bookingToAssign, setBookingToAssign] = useState<Booking | null>(null);
  const [isTeamSelectDialogOpen, setIsTeamSelectDialogOpen] = useState(false);
  const [isTeamAssignDialogOpen, setIsTeamAssignDialogOpen] = useState(false);
  const [bookingToAssignTeam, setBookingToAssignTeam] = useState<Booking | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'Team A' | 'Team B' | 'Team C'>('Team A');

  const [isRemovingCleaner, setIsRemovingCleaner] = useState(false);
  const [teamInfo, setTeamInfo] = useState<{
    teamName: string;
    supervisor: string;
    members: Array<{ name: string; earnings: number; isSupervisor: boolean; cleanerId: string }>;
    totalEarnings: number;
  } | null>(null);
  const [isLoadingTeamInfo, setIsLoadingTeamInfo] = useState(false);
  const [isRemovingTeamMember, setIsRemovingTeamMember] = useState<string | null>(null);
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [availableCleaners, setAvailableCleaners] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingBookingDetails, setIsLoadingBookingDetails] = useState(false);

  // Debounce search input
  const search = useDebouncedValue(searchInput, 500);

  // Build API URL with params
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...(search && { search }),
    // Only apply status filter if view is 'all' or not set, otherwise view filter handles it
    ...(statusFilter && statusFilter !== 'all' && (!view || view === 'all') && { status: statusFilter }),
    ...(sortOrder && { sort: sortOrder }),
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

  // Fetch full booking details when viewingBooking changes
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!viewingBooking) return;

      try {
        setIsLoadingBookingDetails(true);
        const response = await fetch(`/api/admin/bookings?id=${viewingBooking.id}&limit=1`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.ok && data.bookings && data.bookings.length > 0) {
          // Update viewingBooking with fresh data from database
          const fetchedBooking = data.bookings[0];
          
          // Ensure all fields are properly set with defaults
          const completeBooking: Booking = {
            ...fetchedBooking,
            bedrooms: fetchedBooking.bedrooms ?? null,
            bathrooms: fetchedBooking.bathrooms ?? null,
            extras: fetchedBooking.extras ?? [],
            duration: fetchedBooking.duration ?? null,
            frequency: fetchedBooking.frequency ?? null,
            price_snapshot: fetchedBooking.price_snapshot ?? null,
            notes: fetchedBooking.notes ?? null,
            address_zip: fetchedBooking.address_zip ?? null,
            customer_id: fetchedBooking.customer_id ?? null,
            requires_team: fetchedBooking.requires_team ?? false,
            team_assigned: fetchedBooking.team_assigned ?? false,
            cleaner_name: fetchedBooking.cleaner_name ?? null,
            notes_count: fetchedBooking.notes_count ?? 0,
            recurring_bookings_count: fetchedBooking.recurring_bookings_count ?? 0,
          };
          
          setViewingBooking(completeBooking);
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
      } finally {
        setIsLoadingBookingDetails(false);
      }
    };

    fetchBookingDetails();
  }, [viewingBooking?.id]); // Only fetch when booking ID changes

  // Update viewingBooking when bookings data changes (for updates from list)
  useEffect(() => {
    if (viewingBooking && bookings.length > 0) {
      const updatedBooking = bookings.find(b => b.id === viewingBooking.id);
      if (updatedBooking) {
        setViewingBooking(updatedBooking);
      }
    }
  }, [bookings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate statistics for dropdown
  const stats = {
    completed: bookings.filter(b => b.status === 'completed').length,
    missed: bookings.filter(b => b.status === 'missed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    total: totalCount,
  };

  const handleViewChange = (newView: BookingView) => {
    setView(newView);
    setPage(1); // Reset to first page when view changes
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('view', newView);
    params.set('page', '1'); // Reset page in URL
    if (statusFilter && statusFilter !== 'all') {
      params.set('status', statusFilter);
    }
    router.push(`/admin/bookings?${params.toString()}`);
  };

  const handleStatusFilterChange = (newStatus: StatusFilter) => {
    setStatusFilter(newStatus);
    setPage(1); // Reset to first page when status filter changes
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('view', view);
    params.set('page', '1'); // Reset page in URL
    if (newStatus && newStatus !== 'all') {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    router.push(`/admin/bookings?${params.toString()}`);
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

  // Check if booking requires team assignment (Deep or Move In/Out)
  const requiresTeam = (booking: Booking): boolean => {
    return booking.requires_team === true || 
           booking.service_type === 'Deep' || 
           booking.service_type === 'Move In/Out';
  };

  const handleAssignClick = (booking: Booking) => {
    if (requiresTeam(booking)) {
      // For team bookings, open team selection dialog first
      setBookingToAssignTeam(booking);
      setIsTeamSelectDialogOpen(true);
    } else {
      // For individual bookings, open cleaner assignment dialog
      setBookingToAssign(booking);
      setIsAssignDialogOpen(true);
    }
  };

  const handleTeamSelected = (team: 'Team A' | 'Team B' | 'Team C') => {
    setSelectedTeam(team);
    setIsTeamSelectDialogOpen(false);
    setIsTeamAssignDialogOpen(true);
  };

  const handleRemoveCleaner = async (bookingId: string) => {
    if (!confirm('Are you sure you want to remove the assigned cleaner from this booking?')) {
      return;
    }

    try {
      setIsRemovingCleaner(true);
      const response = await fetch('/api/admin/bookings/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookingId,
          cleanerId: null, // null means remove assignment
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to remove cleaner');
      }

      mutate(); // Refresh bookings data
      setViewingBooking(null); // Close viewing dialog
    } catch (error) {
      console.error('Error removing cleaner:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove cleaner');
    } finally {
      setIsRemovingCleaner(false);
    }
  };

  const fetchTeamInfo = async (bookingId: string) => {
    try {
      setIsLoadingTeamInfo(true);
      console.log('Fetching team info for booking:', bookingId);
      const response = await fetch(`/api/admin/bookings/team?bookingId=${bookingId}`, {
        credentials: 'include',
      });
      
      const data = await response.json();
      console.log('Team info response:', data);
      
      if (data.ok && data.team) {
        console.log('Team info fetched successfully:', data.team);
        setTeamInfo(data.team);
      } else {
        console.log('No team found for booking:', bookingId, data.message || '');
        setTeamInfo(null);
      }
    } catch (error) {
      console.error('Error fetching team info:', error);
      setTeamInfo(null);
    } finally {
      setIsLoadingTeamInfo(false);
    }
  };

  const handleRemoveTeamMember = async (bookingId: string, cleanerId: string, cleanerName: string) => {
    if (!confirm(`Are you sure you want to remove ${cleanerName} from the team?`)) {
      return;
    }

    try {
      setIsRemovingTeamMember(cleanerId);
      const response = await fetch(`/api/admin/bookings/team/members?bookingId=${bookingId}&cleanerId=${cleanerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to remove team member');
      }

      // Refresh team info
      await fetchTeamInfo(bookingId);
      mutate(); // Refresh bookings data
    } catch (error) {
      console.error('Error removing team member:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove team member');
    } finally {
      setIsRemovingTeamMember(null);
    }
  };

  const handleAddTeamMember = async (bookingId: string, cleanerId: string) => {
    try {
      setIsAddingTeamMember(true);
      const response = await fetch('/api/admin/bookings/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookingId,
          cleanerId,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to add team member');
      }

      // Refresh team info
      await fetchTeamInfo(bookingId);
      mutate(); // Refresh bookings data
      setIsAddMemberDialogOpen(false);
    } catch (error) {
      console.error('Error adding team member:', error);
      alert(error instanceof Error ? error.message : 'Failed to add team member');
    } finally {
      setIsAddingTeamMember(false);
    }
  };

  const fetchAvailableCleaners = async () => {
    try {
      const response = await fetch('/api/admin/cleaners', {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.ok && data.cleaners) {
        // Filter out cleaners already in the team
        const teamMemberIds = teamInfo?.members.map(m => m.cleanerId) || [];
        const available = data.cleaners
          .filter((c: any) => c.is_active && !teamMemberIds.includes(c.id))
          .map((c: any) => ({ id: c.id, name: c.name }));
        setAvailableCleaners(available);
      }
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    }
  };

  // Fetch team info when viewing a team booking - ALWAYS fetch for Deep/Move In/Out
  useEffect(() => {
    if (viewingBooking) {
      const isTeamBooking = viewingBooking.requires_team || 
                           viewingBooking.team_assigned || 
                           viewingBooking.service_type === 'Deep' || 
                           viewingBooking.service_type === 'Move In/Out';
      
      if (isTeamBooking) {
        console.log('Fetching team info for booking:', viewingBooking.id, 'Service type:', viewingBooking.service_type);
        fetchTeamInfo(viewingBooking.id);
      } else {
        setTeamInfo(null);
      }
    } else {
      setTeamInfo(null);
    }
  }, [viewingBooking?.id, viewingBooking?.service_type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch available cleaners when add member dialog opens
  useEffect(() => {
    if (isAddMemberDialogOpen && viewingBooking) {
      fetchAvailableCleaners();
    }
  }, [isAddMemberDialogOpen, teamInfo]); // eslint-disable-line react-hooks/exhaustive-deps

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
            onClick={() => handleStatusFilterChange('all')}
            className={cn(
              statusFilter === 'all'
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            onClick={() => handleStatusFilterChange('pending')}
            className={cn(
              statusFilter === 'pending'
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            onClick={() => handleStatusFilterChange('completed')}
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
            onClick={() => handleStatusFilterChange('missed')}
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
            onClick={() => handleStatusFilterChange('cancelled')}
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
                  className={cn(
                    "bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-4 pr-6 transition-all hover:shadow-md relative group",
                    isSelected && "border-l-4 border-l-blue-500"
                  )}
                >
                  <div className="flex items-start gap-6 flex-wrap">
                    {/* Date and Time Block */}
                    <div 
                      className="flex flex-col gap-1 min-w-[180px] cursor-pointer"
                      onClick={() => setViewingBooking(booking)}
                    >
                      <span className="text-gray-900 font-medium">
                        {formatDate(booking.booking_date)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getDayName(booking.booking_date)} {formatTimeRange(booking.booking_time)}
                      </span>
                    </div>

                    {/* Service Type and Duration Block */}
                    <div 
                      className="flex flex-col gap-1 min-w-[200px] cursor-pointer"
                      onClick={() => setViewingBooking(booking)}
                    >
                      <span className="text-gray-900 font-medium">
                        {booking.service_type}
                      </span>
                      <span className="text-sm text-gray-500">
                        Duration {booking.duration || 3.5} hours
                      </span>
                    </div>

                    {/* Customer Name and ID Block */}
                    <div 
                      className="flex flex-col gap-1 min-w-[180px] cursor-pointer"
                      onClick={() => setViewingBooking(booking)}
                    >
                      <div className="text-gray-900 font-medium">
                        {booking.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        # {booking.customer_id ? booking.customer_id.slice(-6) : booking.id.slice(-6)}
                      </div>
                    </div>

                    {/* Frequency and Count Block */}
                    <div 
                      className="flex items-center gap-2 min-w-[140px] cursor-pointer"
                      onClick={() => setViewingBooking(booking)}
                    >
                      <span className="text-gray-900 font-medium">
                        {booking.frequency 
                          ? (booking.frequency === 'bi-weekly' 
                              ? 'Bi-weekly' 
                              : booking.frequency === 'custom-weekly'
                              ? 'Custom Weekly'
                              : booking.frequency === 'custom-bi-weekly'
                              ? 'Custom Bi-weekly'
                              : booking.frequency.charAt(0).toUpperCase() + booking.frequency.slice(1))
                          : 'One-time'}
                      </span>
                      {booking.frequency && booking.recurring_bookings_count > 0 && (
                        <Badge className="bg-blue-100 text-blue-700 rounded-full h-6 px-2.5 flex items-center justify-center text-xs font-normal">
                          {booking.recurring_bookings_count}
                        </Badge>
                      )}
                    </div>

                    {/* Location Block */}
                    <div 
                      className="flex flex-col gap-1 min-w-[180px] cursor-pointer"
                      onClick={() => setViewingBooking(booking)}
                    >
                      <span className="text-gray-900 font-medium">
                        {booking.address_line1 || booking.address_suburb || booking.address_city || 'N/A'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {booking.address_suburb || booking.address_city || 'N/A'}
                      </span>
                    </div>
                    
                    {/* Actions Block */}
                    <div className="flex items-center gap-2 min-w-[140px] ml-auto">
                      {!booking.cleaner_name && !booking.team_assigned && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignClick(booking);
                          }}
                          className="text-xs"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          {requiresTeam(booking) ? 'Assign Team' : 'Assign'}
                        </Button>
                      )}
                      {booking.cleaner_name && (
                        <span className="text-xs text-gray-600">
                          {booking.cleaner_name}
                        </span>
                      )}
                      {booking.team_assigned && (
                        <Badge variant="secondary" className="text-xs">
                          Team Assigned
                        </Badge>
                      )}
                    </div>
                    
                    {/* Price and Payment Status Block */}
                    <div 
                      className="flex flex-col gap-1 min-w-[120px] cursor-pointer"
                      onClick={() => setViewingBooking(booking)}
                    >
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

        {/* Pagination */}
        {!isLoading && bookings.length > 0 && (
          <div className="flex items-center justify-between mt-6 px-4">
            <div className="text-sm text-gray-600">
              Showing {bookings.length} of {totalCount} bookings
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.max(1, page - 1);
                    setPage(newPage);
                    const params = new URLSearchParams(searchParams?.toString() || '');
                    params.set('page', newPage.toString());
                    router.push(`/admin/bookings?${params.toString()}`);
                  }}
                  disabled={page === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.min(totalPages, page + 1);
                    setPage(newPage);
                    const params = new URLSearchParams(searchParams?.toString() || '');
                    params.set('page', newPage.toString());
                    router.push(`/admin/bookings?${params.toString()}`);
                  }}
                  disabled={page === totalPages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={!!viewingBooking} onOpenChange={(open) => !open && setViewingBooking(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {isLoadingBookingDetails ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Loading Booking Details...</DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            </>
          ) : viewingBooking ? (() => {
            // Calculate pricing breakdown from price_snapshot or estimate
            let pricingDetails: {
              serviceBasePrice: number;
              extras: Array<{ name: string; price: number }>;
              serviceFee: number;
              frequencyDiscount: number;
              tax: number;
              total: number;
            };

            if (viewingBooking.price_snapshot) {
              // Use price snapshot if available
              const snapshot = viewingBooking.price_snapshot;
              const extrasFromSnapshot = snapshot.extras || [];
              const serviceBase = snapshot.service?.base || 0;
              const bedsPrice = (viewingBooking.bedrooms || 0) * (snapshot.service?.bedroom || 0);
              const bathsPrice = (viewingBooking.bathrooms || 0) * (snapshot.service?.bathroom || 0);
              const serviceBasePrice = serviceBase + bedsPrice + bathsPrice;
              
              pricingDetails = {
                serviceBasePrice: serviceBasePrice,
                extras: extrasFromSnapshot.map((e: any) => {
                  const extraName = e.name || e;
                  const extraKey = extraName as keyof typeof PRICING.extras;
                  return {
                    name: extraName,
                    price: e.price || (PRICING.extras[extraKey] || 0)
                  };
                }),
                serviceFee: snapshot.service_fee || viewingBooking.service_fee || 0,
                frequencyDiscount: snapshot.frequency_discount_amount || 0,
                tax: 0, // Calculate tax
                total: viewingBooking.total_amount ? viewingBooking.total_amount / 100 : 0,
              };
            } else {
              // Calculate service base price from PRICING structure
              const serviceType = viewingBooking.service_type as keyof typeof PRICING.services;
              const servicePricing = PRICING.services[serviceType];
              
              let serviceBasePrice = 0;
              if (servicePricing) {
                const base = servicePricing.base || 0;
                const bedsPrice = (viewingBooking.bedrooms || 0) * (servicePricing.bedroom || 0);
                const bathsPrice = (viewingBooking.bathrooms || 0) * (servicePricing.bathroom || 0);
                serviceBasePrice = base + bedsPrice + bathsPrice;
              } else {
                // Fallback: try to calculate from total_amount
                const extras = viewingBooking.extras || [];
                const extrasBreakdown = extras.map(extra => ({
                  name: extra,
                  price: PRICING.extras[extra as keyof typeof PRICING.extras] || 0
                }));
                
                const extrasTotal = extrasBreakdown.reduce((sum, e) => sum + e.price, 0);
                const basePrice = viewingBooking.total_amount ? viewingBooking.total_amount / 100 : 0;
                const serviceFeeInDollars = viewingBooking.service_fee ? viewingBooking.service_fee / 100 : 0;
                serviceBasePrice = Math.max(0, basePrice - extrasTotal - serviceFeeInDollars);
              }
              
              // Calculate extras breakdown
              const extras = viewingBooking.extras || [];
              const extrasBreakdown = extras.map(extra => ({
                name: extra,
                price: PRICING.extras[extra as keyof typeof PRICING.extras] || 0
              }));
              
              const serviceFeeInDollars = viewingBooking.service_fee ? viewingBooking.service_fee / 100 : PRICING.serviceFee;
              
              pricingDetails = {
                serviceBasePrice: serviceBasePrice,
                extras: extrasBreakdown,
                serviceFee: serviceFeeInDollars,
                frequencyDiscount: 0,
                tax: 0,
                total: viewingBooking.total_amount ? viewingBooking.total_amount / 100 : 0,
              };
            }

            // Calculate tax (assuming 10% tax rate)
            const taxRate = 0.1;
            const subtotalBeforeTax = pricingDetails.serviceBasePrice + 
              pricingDetails.extras.reduce((sum, e) => sum + e.price, 0) + 
              pricingDetails.serviceFee - 
              pricingDetails.frequencyDiscount;
            pricingDetails.tax = Math.round(subtotalBeforeTax * taxRate * 100) / 100;
            pricingDetails.total = subtotalBeforeTax + pricingDetails.tax;
            
            // Calculate duration
            const duration = viewingBooking.duration || 
              (viewingBooking.service_type === 'Move In/Out' ? 3.5 : 
               viewingBooking.service_type === 'Deep' ? 4 : 2);
            
            // Helper function to determine if field has value
            const hasValue = (value: any) => value !== null && value !== undefined && value !== '' && value !== 'None';
            
            // Helper function to get status icon
            const getStatusIcon = (hasValue: boolean) => {
              if (hasValue) {
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
              }
              return <AlertCircle className="h-4 w-4 text-orange-500" />;
            };

            // Format time range
            const bookingTime = viewingBooking.booking_time;
            let timeStart: string;
            let timeEnd: string;
            
            if (bookingTime.includes('-')) {
              const parts = bookingTime.split('-');
              timeStart = parts[0]?.trim() || bookingTime;
              timeEnd = parts[1]?.trim() || '';
            } else {
              timeStart = bookingTime;
              // Calculate end time
              const [hours, minutes] = bookingTime.split(':').map(Number);
              const endTime = new Date();
              endTime.setHours(hours, minutes + Math.round(duration * 60), 0);
              timeEnd = format(endTime, 'h:mm a');
            }

            // Format timeStart to include AM/PM if not already formatted
            if (!timeStart.includes('AM') && !timeStart.includes('PM')) {
              const [h, m] = timeStart.split(':').map(Number);
              const date = new Date();
              date.setHours(h, m || 0, 0);
              timeStart = format(date, 'h:mm a');
            }

            // Format frequency display
            const frequencyDisplay = viewingBooking.frequency === 'one-time' || !viewingBooking.frequency 
              ? 'One Time' 
              : viewingBooking.frequency.charAt(0).toUpperCase() + viewingBooking.frequency.slice(1).replace('-', ' ');

            // Calculate payment status
            const paidAmount = viewingBooking.total_amount ? viewingBooking.total_amount / 100 : 0;
            const balance = pricingDetails.total - paidAmount;
            const isPaid = balance <= 0;

            return (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Booking Details #{viewingBooking.id}</DialogTitle>
                  <DialogDescription className="text-sm text-gray-500">
                    {format(new Date(viewingBooking.created_at), 'MMM d, yyyy h:mm a')}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Booking Details Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-bold">Booking Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Left Column */}
                        <div className="space-y-4">
                          <div className="flex items-start gap-2">
                            {getStatusIcon(true)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Date</p>
                              <p className="text-sm font-medium">{format(new Date(viewingBooking.booking_date), 'MMMM d, yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon((viewingBooking.bedrooms ?? null) !== null || (viewingBooking.bathrooms ?? null) !== null)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Beds & Baths</p>
                              <p className="text-sm font-medium">
                                {(() => {
                                  // Try to get values from booking first, then from price_snapshot
                                  let bedrooms = viewingBooking.bedrooms;
                                  let bathrooms = viewingBooking.bathrooms;
                                  
                                  // Fallback to price_snapshot if bedrooms/bathrooms are null
                                  if ((bedrooms === null || bedrooms === undefined) && viewingBooking.price_snapshot) {
                                    bedrooms = viewingBooking.price_snapshot.bedrooms ?? null;
                                  }
                                  if ((bathrooms === null || bathrooms === undefined) && viewingBooking.price_snapshot) {
                                    bathrooms = viewingBooking.price_snapshot.bathrooms ?? null;
                                  }
                                  
                                  // Handle null/undefined values from database
                                  if (bedrooms === null || bedrooms === undefined) {
                                    if (bathrooms === null || bathrooms === undefined) {
                                      return 'Not specified';
                                    }
                                    return `${bathrooms} Bath${bathrooms !== 1 ? 's' : ''}`;
                                  }
                                  
                                  // bedrooms is set
                                  if (bedrooms === 0) {
                                    // Studio
                                    if (bathrooms === null || bathrooms === undefined) {
                                      return 'Studio';
                                    }
                                    return `Studio & ${bathrooms} Bath${bathrooms !== 1 ? 's' : ''}`;
                                  }
                                  
                                  // bedrooms > 0
                                  const bedroomText = `${bedrooms} Bed${bedrooms !== 1 ? 's' : ''}`;
                                  if (bathrooms === null || bathrooms === undefined) {
                                    return bedroomText;
                                  }
                                  return `${bedroomText} & ${bathrooms} Bath${bathrooms !== 1 ? 's' : ''}`;
                                })()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon(true)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">How Often</p>
                              <p className="text-sm font-medium">{frequencyDisplay}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon(hasValue(viewingBooking.customer_email))}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Email</p>
                              <p className="text-sm font-medium">{hasValue(viewingBooking.customer_email) ? viewingBooking.customer_email : 'None'}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right Column */}
                        <div className="space-y-4">
                          <div className="flex items-start gap-2">
                            {getStatusIcon(true)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Time</p>
                              <p className="text-sm font-medium">{timeStart} - {timeEnd}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon(true)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Condition</p>
                              <p className="text-sm font-medium">Excellent</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon((viewingBooking.extras || []).length > 0)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Extra Services</p>
                              <p className="text-sm font-medium">{(viewingBooking.extras || []).length > 0 ? `${(viewingBooking.extras || []).length} Service${(viewingBooking.extras || []).length !== 1 ? 's' : ''}` : 'None'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon(hasValue(viewingBooking.customer_phone))}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Phone</p>
                              <p className="text-sm font-medium">{hasValue(viewingBooking.customer_phone) ? viewingBooking.customer_phone : 'None'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="flex items-start gap-2">
                          {getStatusIcon(true)}
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Cleaning</p>
                            <p className="text-sm font-medium">{viewingBooking.service_type || 'None'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          {getStatusIcon(false)}
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Sq. Ft.</p>
                            <p className="text-sm font-medium">N/A</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          {getStatusIcon((viewingBooking.extras || []).some(e => e.toLowerCase().includes('supplies')))}
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Cleaning Supplies</p>
                            <p className="text-sm font-medium">{(viewingBooking.extras || []).some(e => e.toLowerCase().includes('supplies')) ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          {getStatusIcon(hasValue(viewingBooking.payment_reference))}
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Payment Method</p>
                            <p className="text-sm font-medium">{hasValue(viewingBooking.payment_reference) ? 'Card' : 'Cash'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Assigned Team Section */}
                      {(viewingBooking.requires_team || viewingBooking.team_assigned || viewingBooking.service_type === 'Deep' || viewingBooking.service_type === 'Move In/Out') && (
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-start gap-2">
                              {getStatusIcon(true)}
                              <div className="flex-1">
                                <p className="text-xs text-gray-500">Assigned Team</p>
                                {isLoadingTeamInfo ? (
                                  <p className="text-sm font-medium">Loading...</p>
                                ) : teamInfo && teamInfo.teamName ? (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-flex items-center justify-center bg-blue-600 text-white text-sm font-bold px-4 py-1.5 rounded-md shadow-sm border-0 antialiased tracking-wide whitespace-nowrap">
                                      {teamInfo.teamName}
                                    </span>
                                    {teamInfo.supervisor && (
                                      <span className="text-xs text-gray-500">
                                        Supervisor: {teamInfo.supervisor}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm font-medium text-gray-400">No team assigned</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  fetchTeamInfo(viewingBooking.id);
                                }}
                                disabled={isRemovingTeamMember !== null || isLoadingTeamInfo}
                                title="Refresh team information"
                              >
                                <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingTeamInfo ? 'animate-spin' : ''}`} />
                                Refresh
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleAssignClick(viewingBooking);
                                }}
                                disabled={isRemovingTeamMember !== null}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                {teamInfo ? 'Reassign Team' : 'Assign Team'}
                              </Button>
                            </div>
                          </div>
                          
                          {isLoadingTeamInfo ? (
                            <div className="mt-3 text-sm text-gray-500">Loading team information...</div>
                          ) : teamInfo && teamInfo.members && teamInfo.members.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-gray-500 mb-2">Team Members ({teamInfo.members.length}):</p>
                              {teamInfo.members.map((member) => (
                                <div
                                  key={member.cleanerId}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                >
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium">{member.name}</span>
                                    {member.isSupervisor && (
                                      <Badge variant="secondary" className="text-xs">
                                        Supervisor
                                      </Badge>
                                    )}
                                    <span className="text-xs text-gray-500">
                                      (R{(member.earnings / 100).toFixed(0)})
                                    </span>
                                  </div>
                                  {!member.isSupervisor && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveTeamMember(viewingBooking.id, member.cleanerId, member.name)}
                                      disabled={isRemovingTeamMember === member.cleanerId}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                                    >
                                      {isRemovingTeamMember === member.cleanerId ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <UserMinus className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <div className="pt-2 border-t">
                                <p className="text-xs text-gray-500">
                                  Total Team Earnings: <span className="font-medium">R{(teamInfo.totalEarnings / 100).toFixed(2)}</span>
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAddMemberDialogOpen(true)}
                                className="mt-2 w-full"
                                disabled={isRemovingTeamMember !== null}
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                Add Team Member
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-3 text-sm text-gray-500">
                              No team members assigned yet. Click "Assign Team" to assign cleaners.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Assigned Cleaner Section */}
                      {viewingBooking.cleaner_name && !viewingBooking.team_assigned && (
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-2">
                              {getStatusIcon(true)}
                              <div className="flex-1">
                                <p className="text-xs text-gray-500">Assigned Cleaner</p>
                                <p className="text-sm font-medium">{viewingBooking.cleaner_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleAssignClick(viewingBooking);
                                }}
                                disabled={isRemovingCleaner}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Reassign
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveCleaner(viewingBooking.id)}
                                disabled={isRemovingCleaner}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                {isRemovingCleaner ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <UserMinus className="h-3 w-3 mr-1" />
                                )}
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <p className="text-xs text-gray-500">Source Facebook</p>
                        {viewingBooking.notes && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Comment</p>
                            <p className="text-sm text-gray-700">{viewingBooking.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Booking Summary Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-bold">Booking Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Duration: {duration} hours of cleaning
                        </p>
                        <p className="text-sm text-gray-600">
                          {viewingBooking.address_line1 || ''} {viewingBooking.address_suburb || ''} {viewingBooking.address_city || ''} {viewingBooking.address_zip || ''}
                        </p>
                      </div>
                      
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">{viewingBooking.service_type || 'Cleaning'}</p>
                            <p className="text-xs text-gray-500">*{frequencyDisplay}*</p>
                          </div>
                          <p className="text-sm font-medium">{formatCurrency(pricingDetails.serviceBasePrice)}</p>
                        </div>
                        
                        {pricingDetails.extras.map((extra, idx) => (
                          <div key={idx} className="flex justify-between">
                            <p className="text-sm">{extra.name}</p>
                            <p className="text-sm">{formatCurrency(extra.price)}</p>
                          </div>
                        ))}
                        
                        {pricingDetails.serviceFee > 0 && (
                          <div className="flex justify-between">
                            <p className="text-sm">Cleaning Supplies</p>
                            <p className="text-sm">{formatCurrency(pricingDetails.serviceFee)}</p>
                          </div>
                        )}
                        
                        {pricingDetails.frequencyDiscount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <p className="text-sm">Frequency Discount</p>
                            <p className="text-sm">-{formatCurrency(pricingDetails.frequencyDiscount)}</p>
                          </div>
                        )}
                        
                        {pricingDetails.tax > 0 && (
                          <div className="flex justify-between">
                            <p className="text-sm">Tax</p>
                            <p className="text-sm">{formatCurrency(pricingDetails.tax)}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-4 border-t bg-gray-50 rounded-lg p-4 -mx-4 -mb-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-base font-bold">Total:</p>
                            <p className="text-xl font-bold">{formatCurrency(pricingDetails.total)}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">Paid:</p>
                            <p className="text-sm font-medium">{formatCurrency(paidAmount)}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">Balance:</p>
                            <p className={cn("text-sm font-medium", balance > 0 ? "text-red-600" : "text-green-600")}>
                              {formatCurrency(balance)}
                            </p>
                          </div>
                        </div>
                        <Button variant="destructive" className="w-full mt-4" size="sm">
                          Return Payment
                        </Button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          {format(new Date(viewingBooking.created_at), 'MMMM d, yyyy, h:mm a')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewingBooking(null)}>
                    Close
                  </Button>
                  {viewingBooking && !viewingBooking.cleaner_name && !viewingBooking.team_assigned && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        handleAssignClick(viewingBooking);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {requiresTeam(viewingBooking) ? 'Assign Team' : 'Assign Cleaner'}
                    </Button>
                  )}
                  {viewingBooking && viewingBooking.cleaner_name && !viewingBooking.team_assigned && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        handleAssignClick(viewingBooking);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reassign Cleaner
                    </Button>
                  )}
                  {viewingBooking && (viewingBooking.requires_team || viewingBooking.team_assigned || viewingBooking.service_type === 'Deep' || viewingBooking.service_type === 'Move In/Out') && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        handleAssignClick(viewingBooking);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reassign Team
                    </Button>
                  )}
                  <Button onClick={() => {
                    setEditingBooking(viewingBooking);
                    setIsEditDialogOpen(true);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogFooter>
              </div>
            );
          })() : null}
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <EditBookingDialog
        booking={editingBooking ? {
          id: editingBooking.id,
          customer_name: editingBooking.customer_name,
          customer_email: editingBooking.customer_email,
          customer_phone: editingBooking.customer_phone,
          service_type: editingBooking.service_type,
          booking_date: editingBooking.booking_date,
          booking_time: editingBooking.booking_time,
          address_line1: editingBooking.address_line1,
          address_suburb: editingBooking.address_suburb,
          address_city: editingBooking.address_city,
          total_amount: editingBooking.total_amount,
          service_fee: editingBooking.service_fee,
          cleaner_earnings: editingBooking.cleaner_earnings,
          status: editingBooking.status,
          payment_reference: editingBooking.payment_reference || '',
        } : null}
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingBooking(null);
        }}
        onSaved={() => {
          mutate(); // Refresh bookings data
          setViewingBooking(null); // Close viewing dialog
          setIsEditDialogOpen(false);
          setEditingBooking(null);
        }}
      />

      {/* Assign Cleaner Dialog */}
      <AssignCleanerDialog
        booking={bookingToAssign ? {
          id: bookingToAssign.id,
          booking_date: bookingToAssign.booking_date,
          booking_time: bookingToAssign.booking_time,
          customer_name: bookingToAssign.customer_name,
          service_type: bookingToAssign.service_type,
        } : null}
        open={isAssignDialogOpen}
        onClose={() => {
          setIsAssignDialogOpen(false);
          setBookingToAssign(null);
        }}
        onAssigned={() => {
          mutate(); // Refresh bookings data
          setIsAssignDialogOpen(false);
          setBookingToAssign(null);
          // If viewing the same booking, keep dialog open but data will refresh
          // The viewingBooking will update automatically when bookings array updates
        }}
      />

      {/* Team Selection Dialog */}
      <Dialog open={isTeamSelectDialogOpen} onOpenChange={(open) => !open && setIsTeamSelectDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Team
            </DialogTitle>
            <DialogDescription>
              Choose a team name for this booking assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {(['Team A', 'Team B', 'Team C'] as const).map((team) => (
              <Button
                key={team}
                variant={selectedTeam === team ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => handleTeamSelected(team)}
              >
                <Users className="h-4 w-4 mr-2" />
                {team}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTeamSelectDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Team Dialog */}
      {bookingToAssignTeam && (
        <AssignTeamDialog
          booking={{
            id: bookingToAssignTeam.id,
            service_type: bookingToAssignTeam.service_type,
            booking_date: bookingToAssignTeam.booking_date,
            booking_time: bookingToAssignTeam.booking_time,
            customer_name: bookingToAssignTeam.customer_name,
            address_line1: bookingToAssignTeam.address_line1 || '',
            address_city: bookingToAssignTeam.address_city || '',
            total_amount: bookingToAssignTeam.total_amount,
            requires_team: bookingToAssignTeam.requires_team,
          }}
          selectedTeam={selectedTeam}
          open={isTeamAssignDialogOpen}
          onClose={() => {
            setIsTeamAssignDialogOpen(false);
            setBookingToAssignTeam(null);
          }}
          onAssigned={async () => {
            mutate(); // Refresh bookings data
            setIsTeamAssignDialogOpen(false);
            const assignedBookingId = bookingToAssignTeam?.id;
            setBookingToAssignTeam(null);
            
            // Refresh team info if viewing the same booking
            if (viewingBooking && assignedBookingId && viewingBooking.id === assignedBookingId) {
              // Wait a bit for the database to update, then fetch team info
              setTimeout(async () => {
                console.log('Refreshing team info after assignment...');
                await fetchTeamInfo(viewingBooking.id);
                // Also refresh the bookings list to update team_assigned flag
                mutate();
              }, 1000); // Increased delay to ensure DB is updated
            } else {
              setViewingBooking(null); // Close viewing dialog if open
            }
          }}
        />
      )}

      {/* Add Team Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={(open) => !open && setIsAddMemberDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Team Member
            </DialogTitle>
            <DialogDescription>
              Select a cleaner to add to the team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
            {availableCleaners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No available cleaners to add</p>
                <p className="text-sm mt-1">All active cleaners are already in the team</p>
              </div>
            ) : (
              availableCleaners.map((cleaner) => (
                <Button
                  key={cleaner.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleAddTeamMember(viewingBooking!.id, cleaner.id)}
                  disabled={isAddingTeamMember}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {cleaner.name}
                  {isAddingTeamMember && (
                    <Loader2 className="h-4 w-4 ml-auto animate-spin" />
                  )}
                </Button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
