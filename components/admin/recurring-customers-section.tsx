'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Loader2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Repeat, 
  Eye, 
  Plus,
  MoreVertical,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Edit,
  Trash2,
  Play,
  Pause
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { CreateBookingDialog } from './create-booking-dialog';
import { EditRecurringScheduleDialog } from './edit-recurring-schedule-dialog';
import { GenerateBookingsDialog } from './generate-bookings-dialog';
import { RecurringScheduleWithCustomer } from '@/types/recurring';
import { formatBookingTime } from '@/lib/recurring-bookings';

interface Customer {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  total_bookings: number;
  recurring_schedules_count: number;
  role: string;
  created_at: string;
}

export function RecurringCustomersSection() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [customerSchedules, setCustomerSchedules] = useState<RecurringScheduleWithCustomer[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<RecurringScheduleWithCustomer | null>(null);
  const [generatingSchedule, setGeneratingSchedule] = useState<RecurringScheduleWithCustomer | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<RecurringScheduleWithCustomer | null>(null);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        recurring: 'true',
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/customers?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch recurring customers');
      }

      setCustomers(data.customers || []);
      setTotalPages(data.pagination.totalPages);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching recurring customers:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchCustomers();
  };

  const fetchCustomerSchedules = async (customerId: string) => {
    try {
      setLoadingSchedules(true);
      const response = await fetch(`/api/admin/recurring-schedules?customer_id=${customerId}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.ok) {
        setCustomerSchedules(data.schedules || []);
      }
    } catch (err) {
      console.error('Error fetching customer schedules:', err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleViewCustomer = async (customer: Customer) => {
    setViewingCustomer(customer);
    await fetchCustomerSchedules(customer.id);
  };

  const handleToggleScheduleActive = async (schedule: RecurringScheduleWithCustomer) => {
    try {
      const response = await fetch('/api/admin/recurring-schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: schedule.id,
          is_active: !schedule.is_active,
        }),
      });

      const data = await response.json();
      if (data.ok && viewingCustomer) {
        await fetchCustomerSchedules(viewingCustomer.id);
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
    }
  };

  const handleDeleteSchedule = async (schedule: RecurringScheduleWithCustomer) => {
    try {
      const response = await fetch(`/api/admin/recurring-schedules?id=${schedule.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.ok) {
        setDeletingSchedule(null);
        if (viewingCustomer) {
          await fetchCustomerSchedules(viewingCustomer.id);
        }
        fetchCustomers(); // Refresh customer list
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
    }
  };

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'bi-weekly': return 'bg-green-100 text-green-800 border-green-200';
      case 'monthly': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-primary" />
              <CardTitle>Recurring Customers</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No recurring customers found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Total Bookings</TableHead>
                      <TableHead>Recurring Schedules</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {customer.first_name} {customer.last_name}
                        </TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell>
                          {customer.address_suburb && customer.address_city
                            ? `${customer.address_suburb}, ${customer.address_city}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{customer.total_bookings}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            <Repeat className="h-3 w-3 mr-1" />
                            {customer.recurring_schedules_count || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={customer.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800 border-purple-200' 
                              : 'bg-gray-100 text-gray-800 border-gray-200'}
                          >
                            {customer.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(customer.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setViewingCustomer(customer);
                                  setShowCreateDialog(true);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Schedule
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Customer Details Dialog */}
      <Dialog open={!!viewingCustomer} onOpenChange={(open) => !open && setViewingCustomer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details & Schedules</DialogTitle>
            <DialogDescription>
              Manage recurring schedules for {viewingCustomer?.first_name} {viewingCustomer?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          {viewingCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="font-semibold">{viewingCustomer.first_name} {viewingCustomer.last_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {viewingCustomer.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {viewingCustomer.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {viewingCustomer.address_suburb && viewingCustomer.address_city
                      ? `${viewingCustomer.address_suburb}, ${viewingCustomer.address_city}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                  <Badge variant="outline">{viewingCustomer.total_bookings}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Recurring Schedules</p>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Repeat className="h-3 w-3 mr-1" />
                    {viewingCustomer.recurring_schedules_count || 0}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Schedules Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recurring Schedules</h3>
                  <Button 
                    size="sm" 
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Schedule
                  </Button>
                </div>

                {loadingSchedules ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : customerSchedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Repeat className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No recurring schedules found</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Schedule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerSchedules.map((schedule) => (
                      <Card key={schedule.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{schedule.service_type}</Badge>
                                <Badge className={getFrequencyBadgeColor(schedule.frequency)}>
                                  {schedule.frequency}
                                </Badge>
                                <Badge 
                                  variant={schedule.is_active ? 'default' : 'secondary'}
                                  className={schedule.is_active ? 'bg-green-100 text-green-800 border-green-200' : ''}
                                >
                                  {schedule.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {schedule.frequency === 'monthly' 
                                    ? `Day ${schedule.day_of_month} at ${formatBookingTime(schedule.preferred_time)}`
                                    : schedule.frequency === 'weekly'
                                    ? `Every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.day_of_week || 0]} at ${formatBookingTime(schedule.preferred_time)}`
                                    : `Every other ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.day_of_week || 0]} at ${formatBookingTime(schedule.preferred_time)}`}
                                </p>
                                {schedule.address_line1 && (
                                  <p className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {schedule.address_line1}, {schedule.address_suburb}, {schedule.address_city}
                                  </p>
                                )}
                                {schedule.last_generated_month && (
                                  <p className="text-xs text-gray-500">
                                    Last generated: {schedule.last_generated_month}
                                  </p>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingSchedule(schedule)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setGeneratingSchedule(schedule)}>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Generate Month
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleScheduleActive(schedule)}>
                                  {schedule.is_active ? (
                                    <>
                                      <Pause className="mr-2 h-4 w-4" />
                                      Pause
                                    </>
                                  ) : (
                                    <>
                                      <Play className="mr-2 h-4 w-4" />
                                      Resume
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setDeletingSchedule(schedule)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingCustomer(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Schedule Dialog */}
      <CreateBookingDialog
        open={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          if (viewingCustomer) {
            fetchCustomerSchedules(viewingCustomer.id);
          }
        }}
        onSuccess={() => {
          fetchCustomers();
          if (viewingCustomer) {
            fetchCustomerSchedules(viewingCustomer.id);
          }
          setShowCreateDialog(false);
        }}
        defaultCustomerId={viewingCustomer?.id}
      />

      {/* Edit Schedule Dialog */}
      {editingSchedule && (
        <EditRecurringScheduleDialog
          schedule={editingSchedule}
          open={!!editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSuccess={() => {
            if (viewingCustomer) {
              fetchCustomerSchedules(viewingCustomer.id);
            }
            fetchCustomers();
            setEditingSchedule(null);
          }}
        />
      )}

      {/* Generate Bookings Dialog */}
      {generatingSchedule && (
        <GenerateBookingsDialog
          schedule={generatingSchedule}
          open={!!generatingSchedule}
          onClose={() => setGeneratingSchedule(null)}
          onSuccess={() => {
            if (viewingCustomer) {
              fetchCustomerSchedules(viewingCustomer.id);
            }
            setGeneratingSchedule(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingSchedule} onOpenChange={() => setDeletingSchedule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recurring Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this recurring schedule? This will also cancel all future bookings for this schedule.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingSchedule(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deletingSchedule && handleDeleteSchedule(deletingSchedule)}
            >
              Delete Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

