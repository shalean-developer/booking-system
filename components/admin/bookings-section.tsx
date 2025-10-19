'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Loader2, 
  Search, 
  Trash2, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  UserPlus,
  Eye,
  Mail,
  MessageSquare,
  Download,
  CheckSquare,
  MoreVertical
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssignCleanerDialog } from './assign-cleaner-dialog';
import { EditBookingDialog } from './edit-booking-dialog';
import { BookingDetailsDialog } from './booking-details-dialog';
import { SendEmailDialog } from './send-email-dialog';
import { AddNoteDialog } from './add-note-dialog';
import { fetcher } from '@/lib/fetcher';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

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
  service_fee: number;
  cleaner_earnings: number;
  payment_reference: string;
  created_at: string;
  cleaner_id: string | null;
  cleaner_name?: string | null;
  customer_id: string | null;
  notes_count?: number;
}

export function BookingsSection() {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [deletingBooking, setDeleteingBooking] = useState<Booking | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [assigningBooking, setAssigningBooking] = useState<Booking | null>(null);
  const [emailingBooking, setEmailingBooking] = useState<Booking | null>(null);
  const [notingBooking, setNotingBooking] = useState<Booking | null>(null);

  // Debounce search input to reduce API calls
  const search = useDebouncedValue(searchInput, 500);

  // Build API URL with params
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...(search && { search }),
    ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
  });

  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate } = useSWR<{
    bookings: Booking[];
    pagination: { totalPages: number };
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

  const handleUpdateStatus = async () => {
    if (!editingBooking || !editStatus) return;

    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: editingBooking.id,
          status: editStatus,
        }),
      });

      const responseData = await response.json();

      if (!responseData.ok) {
        throw new Error(responseData.error || 'Failed to update booking');
      }

      setEditingBooking(null);
      setEditStatus('');
      mutate(); // Revalidate SWR cache
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
        credentials: 'include',
      });

      const responseData = await response.json();

      if (!responseData.ok) {
        throw new Error(responseData.error || 'Failed to delete booking');
      }

      setDeleteingBooking(null);
      mutate(); // Revalidate SWR cache
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

  const handleSelectAll = () => {
    if (selectedBookings.size === bookings.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(bookings.map(b => b.id)));
    }
  };

  const handleSelectBooking = (bookingId: string) => {
    const newSelected = new Set(selectedBookings);
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId);
    } else {
      newSelected.add(bookingId);
    }
    setSelectedBookings(newSelected);
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

  const handleBulkExport = async () => {
    try {
      const ids = Array.from(selectedBookings).join(',');
      window.open(`/api/admin/bookings/export?ids=${ids}`, '_blank');
    } catch (err) {
      console.error('Error exporting selected bookings:', err);
      alert('Failed to export selected bookings');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
          <CardTitle>Bookings Management</CardTitle>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions Bar */}
          {selectedBookings.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedBookings.size} booking(s) selected
              </span>
              <div className="flex gap-2">
                <Button onClick={handleBulkExport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </Button>
                <Button 
                  onClick={() => setSelectedBookings(new Set())} 
                  variant="outline" 
                  size="sm"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by name, email, or booking ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <div className="flex items-center text-gray-500">
                <Search className="h-4 w-4" />
              </div>
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
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedBookings.size === bookings.length && bookings.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Cleaner</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedBookings.has(booking.id)}
                            onChange={() => handleSelectBooking(booking.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
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
                        <TableCell>
                          {booking.cleaner_name ? (
                            <div className="text-sm">{booking.cleaner_name}</div>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">Unassigned</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>R{(booking.total_amount / 100).toFixed(2)}</div>
                            <div className="text-xs text-gray-500">
                              Fee: R{(booking.service_fee / 100).toFixed(2)} | 
                              Cleaner: R{(booking.cleaner_earnings / 100).toFixed(2)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setViewingBooking(booking)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setAssigningBooking(booking)}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Assign Cleaner
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditingBooking(booking)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Booking
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEmailingBooking(booking)}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setNotingBooking(booking)}
                              title="Add Note"
                            >
                              <MessageSquare className="h-4 w-4" />
                              {booking.notes_count ? (
                                <span className="ml-1 text-xs">{booking.notes_count}</span>
                              ) : null}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteingBooking(booking)}
                              title="Delete"
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

      {/* Action Dialogs */}
      <BookingDetailsDialog
        booking={viewingBooking}
        open={!!viewingBooking}
        onClose={() => setViewingBooking(null)}
        onEdit={() => {
          setEditingBooking(viewingBooking);
          setViewingBooking(null);
        }}
        onAssign={() => {
          setAssigningBooking(viewingBooking);
          setViewingBooking(null);
        }}
        onEmail={() => {
          setEmailingBooking(viewingBooking);
          setViewingBooking(null);
        }}
        onAddNote={() => {
          setNotingBooking(viewingBooking);
          setViewingBooking(null);
        }}
      />

      <AssignCleanerDialog
        booking={assigningBooking}
        open={!!assigningBooking}
        onClose={() => setAssigningBooking(null)}
        onAssigned={() => {
          setAssigningBooking(null);
          mutate(); // Revalidate SWR cache
        }}
      />

      <EditBookingDialog
        booking={editingBooking}
        open={!!editingBooking}
        onClose={() => setEditingBooking(null)}
        onSaved={() => {
          setEditingBooking(null);
          mutate(); // Revalidate SWR cache
        }}
      />

      <SendEmailDialog
        booking={emailingBooking}
        open={!!emailingBooking}
        onClose={() => setEmailingBooking(null)}
        onSent={() => {
          setEmailingBooking(null);
        }}
      />

      <AddNoteDialog
        booking={notingBooking}
        open={!!notingBooking}
        onClose={() => setNotingBooking(null)}
        onAdded={() => {
          setNotingBooking(null);
          mutate(); // Revalidate SWR cache
        }}
      />

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

