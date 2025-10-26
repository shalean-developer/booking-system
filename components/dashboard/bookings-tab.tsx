'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Briefcase, Calendar, Clock, MapPin, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  status: string;
  total_amount: number;
  created_at: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  cleaner_id: string;
  customer_reviewed?: boolean;
  customer_review_id?: string | null;
}

interface BookingsTabProps {
  bookings: Booking[];
  onOpenReviewDialog: (booking: Booking) => void;
}

export function BookingsTab({ bookings, onOpenReviewDialog }: BookingsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter and search bookings
  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.service_type.toLowerCase().includes(query) ||
        booking.address_line1.toLowerCase().includes(query) ||
        booking.address_suburb.toLowerCase().includes(query) ||
        booking.address_city.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [bookings, statusFilter, searchQuery]);

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    'in-progress': bookings.filter(b => b.status === 'in-progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by service, address, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by status:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                      statusFilter === status
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')} ({count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </p>
        {bookings.length === 0 && (
          <Button asChild>
            <Link href="/booking/service/select">
              <Briefcase className="mr-2 h-4 w-4" />
              Book a Service
            </Link>
          </Button>
        )}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {bookings.length === 0 ? 'No bookings yet' : 'No bookings found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {bookings.length === 0
                  ? 'Book your first cleaning service to get started!'
                  : searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'No bookings match the current filter'}
              </p>
              {bookings.length === 0 && (
                <Button asChild>
                  <Link href="/booking/service/select">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Book a Service
                  </Link>
                </Button>
              )}
              {(bookings.length > 0 && (searchQuery || statusFilter !== 'all')) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left: Booking Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{booking.service_type}</h3>
                          <Badge
                            variant={booking.status === 'completed' ? 'default' : 'outline'}
                            className={cn(
                              'text-xs',
                              booking.status === 'completed' && 'bg-green-100 text-green-800 border-green-200',
                              booking.status === 'accepted' && 'bg-blue-100 text-blue-800 border-blue-200',
                              booking.status === 'pending' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                              booking.status === 'in-progress' && 'bg-purple-100 text-purple-800 border-purple-200'
                            )}
                          >
                            {booking.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(booking.booking_date).toLocaleDateString('en-ZA', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{booking.booking_time}</span>
                      </div>
                      <div className="flex items-start gap-2 sm:col-span-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{booking.address_line1}, {booking.address_suburb}, {booking.address_city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price and Actions */}
                  <div className="lg:w-48 space-y-3 border-t lg:border-t-0 lg:border-l lg:pl-6 pt-4 lg:pt-0">
                    {booking.total_amount ? (
                      <div>
                        <p className="text-2xl font-bold text-primary">R{(booking.total_amount / 100).toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Booked {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500">Price not available</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Booked {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {booking.status === 'completed' && !booking.customer_reviewed && booking.cleaner_id && booking.cleaner_id !== 'manual' && (
                      <Button
                        size="sm"
                        onClick={() => onOpenReviewDialog(booking)}
                        className="w-full"
                      >
                        Leave Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
