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
  Play,
  Pause,
  Calendar,
  Clock,
  User,
  MoreVertical,
  Plus
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
import { CreateBookingDialog } from './create-booking-dialog';
import { EditRecurringScheduleDialog } from './edit-recurring-schedule-dialog';
import { GenerateBookingsDialog } from './generate-bookings-dialog';
import { fetcher } from '@/lib/fetcher';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { RecurringScheduleWithCustomer, Frequency } from '@/types/recurring';
import { formatBookingDate, formatBookingTime, getNextBookingDate, formatNextGeneratingDate, getNextGeneratingMonth } from '@/lib/recurring-bookings';

export function RecurringSchedulesSection() {
  const [searchInput, setSearchInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deletingSchedule, setDeletingSchedule] = useState<RecurringScheduleWithCustomer | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<RecurringScheduleWithCustomer | null>(null);
  const [generatingSchedule, setGeneratingSchedule] = useState<RecurringScheduleWithCustomer | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGenerateAllDialog, setShowGenerateAllDialog] = useState(false);

  // Debounce search input to reduce API calls
  const search = useDebouncedValue(searchInput, 500);

  // Build API URL with params
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...(search && { search }),
    ...(activeFilter !== 'all' && { active: activeFilter }),
  });

  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate } = useSWR<{
    schedules: RecurringScheduleWithCustomer[];
    pagination: { totalPages: number };
  }>(
    `/api/admin/recurring-schedules?${params}`,
    fetcher
  );

  const handleDeleteSchedule = async (schedule: RecurringScheduleWithCustomer) => {
    try {
      const response = await fetch(`/api/admin/recurring-schedules?id=${schedule.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to delete schedule');
      }

      mutate(); // Refresh the data
      setDeletingSchedule(null);
    } catch (err) {
      console.error('Error deleting schedule:', err);
    }
  };

  const handleToggleActive = async (schedule: RecurringScheduleWithCustomer) => {
    try {
      const response = await fetch('/api/admin/recurring-schedules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: schedule.id,
          is_active: !schedule.is_active,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to update schedule');
      }

      mutate(); // Refresh the data
    } catch (err) {
      console.error('Error updating schedule:', err);
    }
  };

  const getFrequencyBadgeColor = (frequency: Frequency) => {
    switch (frequency) {
      case 'weekly':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'bi-weekly':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'monthly':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load recurring schedules</p>
            <p className="text-sm text-gray-600 mt-1">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recurring Schedules</h2>
          <p className="text-gray-600">Manage recurring booking schedules for customers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowGenerateAllDialog(true)} variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Generate All
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Schedule
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search schedules..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schedules</SelectItem>
                <SelectItem value="true">Active Only</SelectItem>
                <SelectItem value="false">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recurring Schedules
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-gray-600">Loading schedules...</span>
            </div>
          ) : !data?.schedules || data.schedules.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No recurring schedules</h3>
              <p className="text-gray-600 mb-4">Create your first recurring schedule to get started.</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Schedule
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Next Booking</TableHead>
                      <TableHead>Next Generate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Generated</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.schedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {schedule.customer.first_name} {schedule.customer.last_name}
                              </div>
                              <div className="text-sm text-gray-600">{schedule.customer.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{schedule.service_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getFrequencyBadgeColor(schedule.frequency)}>
                            {schedule.frequency}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {schedule.frequency === 'monthly' ? (
                              <span>Day {schedule.day_of_month} at {formatBookingTime(schedule.preferred_time)}</span>
                            ) : schedule.frequency === 'custom-weekly' || schedule.frequency === 'custom-bi-weekly' ? (
                              <span>
                                {schedule.frequency === 'custom-weekly' ? 'Every week on ' : 'Every other week on '} {' '}
                                {schedule.days_of_week?.map((day: number) => {
                                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                  return days[day];
                                }).join(', ')} {' '}
                                at {formatBookingTime(schedule.preferred_time)}
                              </span>
                            ) : (
                              <span>
                                {schedule.frequency === 'weekly' ? 'Every' : 'Every other'} {' '}
                                {schedule.day_of_week === 0 ? 'Sunday' : 
                                 schedule.day_of_week === 1 ? 'Monday' :
                                 schedule.day_of_week === 2 ? 'Tuesday' :
                                 schedule.day_of_week === 3 ? 'Wednesday' :
                                 schedule.day_of_week === 4 ? 'Thursday' :
                                 schedule.day_of_week === 5 ? 'Friday' : 'Saturday'} {' '}
                                at {formatBookingTime(schedule.preferred_time)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {(() => {
                              const nextDate = getNextBookingDate(schedule);
                              return nextDate ? formatBookingDate(nextDate) : 'N/A';
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium text-primary">
                              {getNextGeneratingMonth(schedule)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatNextGeneratingDate(schedule)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={schedule.is_active ? 'default' : 'secondary'}
                            className={schedule.is_active ? 'bg-green-100 text-green-800 border-green-200' : ''}
                          >
                            {schedule.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {schedule.last_generated_month || 'Never'}
                          </div>
                        </TableCell>
                        <TableCell>
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
                              <DropdownMenuItem onClick={() => handleToggleActive(schedule)}>
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
                              <DropdownMenuItem 
                                onClick={() => setDeletingSchedule(schedule)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
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
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Page {page} of {data.pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= data.pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateBookingDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          mutate();
          setShowCreateDialog(false);
        }}
      />

      {editingSchedule && (
        <EditRecurringScheduleDialog
          schedule={editingSchedule}
          open={!!editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSuccess={() => {
            mutate();
            setEditingSchedule(null);
          }}
        />
      )}

      {generatingSchedule && (
        <GenerateBookingsDialog
          schedule={generatingSchedule}
          open={!!generatingSchedule}
          onClose={() => setGeneratingSchedule(null)}
          onSuccess={() => {
            mutate();
            setGeneratingSchedule(null);
          }}
        />
      )}

      <GenerateBookingsDialog
        open={showGenerateAllDialog}
        onClose={() => setShowGenerateAllDialog(false)}
        onSuccess={() => {
          mutate();
          setShowGenerateAllDialog(false);
        }}
      />

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
