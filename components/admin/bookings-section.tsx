'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  status: string;
  total_amount: number;
  payment_reference: string;
  created_at: string;
}

export function BookingsSection() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [deletingBooking, setDeleteingBooking] = useState<Booking | null>(null);
  const [editStatus, setEditStatus] = useState('');

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/bookings?${params}`, {
        credentials: 'include', // Include cookies for server-side auth
      });
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      setBookings(data.bookings);
      setTotalPages(data.pagination.totalPages);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchBookings();
  };

  const handleUpdateStatus = async () => {
    if (!editingBooking || !editStatus) return;

    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for server-side auth
        body: JSON.stringify({
          id: editingBooking.id,
          status: editStatus,
        }),
      });

      const data = await response.json();

      console.log('Update booking response:', data);

      if (!data.ok) {
        throw new Error(data.error || 'Failed to update booking');
      }

      setEditingBooking(null);
      setEditStatus('');
      fetchBookings();
    } catch (err) {
      console.error('Error updating booking:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to update booking';
      alert(`Failed to update booking: ${errorMsg}`);
    }
  };

  const handleDelete = async () => {
    if (!deletingBooking) return;

    try {
      const response = await fetch(`/api/admin/bookings?id=${deletingBooking.id}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for server-side auth
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to delete booking');
      }

      setDeleteingBooking(null);
      fetchBookings();
    } catch (err) {
      console.error('Error deleting booking:', err);
      alert('Failed to delete booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bookings Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by name, email, or booking ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No bookings found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-sm">{booking.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{booking.customer_name}</div>
                          <div className="text-sm text-gray-500">{booking.customer_email}</div>
                        </TableCell>
                        <TableCell>{booking.service_type}</TableCell>
                        <TableCell>
                          <div>{new Date(booking.booking_date).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-500">{booking.booking_time}</div>
                        </TableCell>
                        <TableCell>R{(booking.total_amount / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingBooking(booking);
                                setEditStatus(booking.status);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteingBooking(booking)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Status Dialog */}
      <Dialog open={!!editingBooking} onOpenChange={(open) => !open && setEditingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
            <DialogDescription>
              Change the status of booking {editingBooking?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={editStatus} onValueChange={setEditStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBooking(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingBooking} onOpenChange={(open) => !open && setDeleteingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete booking {deletingBooking?.id}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteingBooking(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

