'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { NewHeader } from '@/components/dashboard/new-header';
import { MobileBottomNav } from '@/components/dashboard/mobile-bottom-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, MapPin, Clock, User, ArrowLeft, Search, Filter, Download } from 'lucide-react';
import { toast } from 'sonner';
import { devLog } from '@/lib/dev-logger';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Booking, Customer, AuthUser } from '@/types/dashboard';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  canceled: 'bg-red-100 text-red-800 border-red-200',
};

export default function BookingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const session = await safeGetSession(supabase);
        if (!session || !session.user) {
          router.push('/login?redirect=/dashboard/bookings');
          return;
        }
        
        setUser(session.user);

        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          setError('Session expired');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/dashboard/bookings?limit=100', {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.ok) {
          const allBookings = data.bookings || [];
          setBookings(allBookings);
        setCustomer(data.customer);
          setFilteredBookings(allBookings);
          setTotalPages(Math.ceil(allBookings.length / itemsPerPage));
        } else {
          setError(data.error || 'Failed to load bookings');
        }
      } catch (err) {
        devLog.error('Error fetching bookings:', err);
        setError('Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [router]);

  // Filter and search bookings
  useEffect(() => {
    let filtered = [...bookings];

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'upcoming') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter(b => {
          const bookingDate = new Date(b.booking_date);
          return bookingDate >= today && b.status !== 'cancelled' && b.status !== 'canceled';
        });
      } else if (statusFilter === 'past') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter(b => {
          const bookingDate = new Date(b.booking_date);
          return bookingDate < today || b.status === 'completed' || b.status === 'cancelled' || b.status === 'canceled';
        });
      } else {
        filtered = filtered.filter(b => b.status === statusFilter);
      }
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.service_type.toLowerCase().includes(query) ||
        b.id.toLowerCase().includes(query) ||
        `${b.address_line1} ${b.address_suburb} ${b.address_city}`.toLowerCase().includes(query) ||
        b.status.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [bookings, searchQuery, statusFilter, itemsPerPage]);

  // Paginate filtered bookings
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Separate paginated bookings into upcoming and past
  const upcomingBookings = paginatedBookings.filter(b => {
    const bookingDate = new Date(b.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today && b.status !== 'cancelled' && b.status !== 'canceled';
  });

  const pastBookings = paginatedBookings.filter(b => {
    const bookingDate = new Date(b.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate < today || b.status === 'completed' || b.status === 'cancelled' || b.status === 'canceled';
  });

  // Export to CSV
  const handleExportCSV = () => {
    try {
      // Prepare CSV data
      const csvHeaders = [
        'Booking ID',
        'Service Type',
        'Date',
        'Time',
        'Status',
        'Address',
        'Suburb',
        'City',
        'Amount (R)',
        'Payment Reference',
        'Notes'
      ];

      const csvRows = filteredBookings.map(booking => [
        booking.id,
        booking.service_type || '',
        booking.booking_date,
        booking.booking_time,
        booking.status,
        booking.address_line1 || '',
        booking.address_suburb || '',
        booking.address_city || '',
        ((booking.total_amount || 0) / 100).toFixed(2),
        booking.payment_reference || '',
        (booking.notes || '').replace(/,/g, ';').replace(/\n/g, ' ') // Clean notes for CSV
      ]);

      // Convert to CSV string
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${filteredBookings.length} bookings to CSV`);
    } catch (error) {
      devLog.error('Error exporting CSV:', error);
      toast.error('Failed to export bookings. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white">
        <NewHeader user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
        <MobileBottomNav activeTab="bookings" onTabChange={() => {}} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white">
        <NewHeader user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
        <MobileBottomNav activeTab="bookings" onTabChange={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white pb-32 lg:pb-0">
      <NewHeader user={user} customer={customer} />

      <main className="py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => router.push('/dashboard')} 
                  className="gap-2 flex-shrink-0"
                  aria-label="Back to Dashboard"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
              </Button>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 truncate">My Bookings</h1>
              </div>
              <Button variant="outline" size="sm" asChild className="gap-2 flex-shrink-0">
                <Link href="/dashboard/bookings/calendar">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Calendar View</span>
                  <span className="sm:hidden">Calendar</span>
                </Link>
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                <Input
                  placeholder="Search by service, address, or booking ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 h-10 sm:h-11 text-sm sm:text-base"
                  aria-label="Search bookings"
                />
              </div>
              <div className="flex gap-3 sm:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-11 text-sm sm:text-base">
                    <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookings</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {filteredBookings.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                    className="gap-2 h-10 sm:h-11 text-sm sm:text-base flex-shrink-0"
                    aria-label="Export bookings to CSV"
                >
                    <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">Export</span>
                </Button>
              )}
              </div>
            </div>
          </div>

          {/* Results Count */}
          {filteredBookings.length > 0 && (
            <div className="mb-4 text-xs sm:text-sm lg:text-base text-gray-600 font-medium">
              Showing {paginatedBookings.length} of {filteredBookings.length} bookings
              </div>
          )}

          {/* Upcoming Bookings */}
          {upcomingBookings.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Upcoming</h2>
              <div className="space-y-3 sm:space-y-4">
                {upcomingBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow border border-gray-200">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1 space-y-3 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <Badge className={`${statusColors[booking.status] || statusColors.pending} text-xs sm:text-sm font-medium`}>
                                {booking.status}
                              </Badge>
                              <span className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 truncate">{booking.service_type}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 sm:gap-x-4">
                              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base text-gray-600">
                                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 flex-shrink-0" />
                                <span className="font-medium">{format(new Date(booking.booking_date), 'MMM d, yyyy')}</span>
                              </div>
                              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base text-gray-600">
                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 flex-shrink-0" />
                                <span>{booking.booking_time}</span>
                              </div>
                              <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base text-gray-600 sm:col-span-2 lg:col-span-1">
                                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{booking.address_line1}, {booking.address_suburb}, {booking.address_city}</span>
                              </div>
                            </div>
                            <div className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
                              R{(booking.total_amount / 100).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex flex-row sm:flex-col lg:flex-row gap-2 flex-shrink-0">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                              className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
                            >
                              <Link href={`/dashboard/bookings/${booking.id}`}>View</Link>
                            </Button>
                            {booking.status !== 'cancelled' && booking.status !== 'canceled' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                asChild
                                className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
                              >
                                <Link href={`/booking/reschedule?id=${booking.id}`}>Reschedule</Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Past Bookings */}
          {pastBookings.length > 0 && (
                    <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Past Bookings</h2>
              <div className="space-y-3 sm:space-y-4">
                {pastBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (upcomingBookings.length + index) * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow border border-gray-200">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1 space-y-3 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <Badge className={`${statusColors[booking.status] || statusColors.pending} text-xs sm:text-sm font-medium`}>
                                {booking.status}
                              </Badge>
                              <span className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 truncate">{booking.service_type}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 sm:gap-x-4">
                              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base text-gray-600">
                                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 flex-shrink-0" />
                                <span className="font-medium">{format(new Date(booking.booking_date), 'MMM d, yyyy')}</span>
                              </div>
                              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base text-gray-600">
                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 flex-shrink-0" />
                                <span>{booking.booking_time}</span>
                              </div>
                              <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base text-gray-600 sm:col-span-2 lg:col-span-1">
                                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{booking.address_line1}, {booking.address_suburb}, {booking.address_city}</span>
                              </div>
                            </div>
                            <div className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
                              R{(booking.total_amount / 100).toFixed(2)}
                            </div>
                    </div>
                          <div className="flex flex-row sm:flex-col lg:flex-row gap-2 flex-shrink-0">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                              className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
                            >
                            <Link href={`/dashboard/bookings/${booking.id}`}>View</Link>
                      </Button>
                          </div>
                    </div>
                  </CardContent>
                </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-9 sm:h-10 text-xs sm:text-sm touch-manipulation"
                aria-label="Previous page"
              >
                Previous
              </Button>
              <span className="text-xs sm:text-sm lg:text-base text-gray-600 font-medium min-w-[100px] text-center">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-9 sm:h-10 text-xs sm:text-sm touch-manipulation"
                aria-label="Next page"
              >
                Next
              </Button>
          </div>
          )}

          {/* Empty State */}
          {bookings.length === 0 && (
            <Card className="border-2 border-dashed border-teal-300 bg-teal-50/30">
              <CardContent className="p-6 sm:p-8 text-center">
                <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-teal-600 mx-auto mb-4" />
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-2">No bookings yet</h2>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-6">Book your first service to get started!</p>
                <Button asChild className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-sm sm:text-base h-10 sm:h-11">
                  <Link href="/booking/service/select">Book a Service</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* No Results from Search/Filter */}
          {bookings.length > 0 && filteredBookings.length === 0 && (
            <Card className="border-2 border-dashed border-gray-300 bg-gray-50/30">
              <CardContent className="p-6 sm:p-8 text-center">
                <Search className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-2">No bookings found</h2>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  toast.info('Filters cleared');
                  }}
                  className="text-sm sm:text-base h-10 sm:h-11"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <MobileBottomNav activeTab="bookings" onTabChange={() => {}} />
    </div>
  );
}
