'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Phone, MapPin, Calendar, DollarSign, Edit, UserPlus, MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface BookingNote {
  id: string;
  note: string;
  admin_id: string;
  created_at: string;
}

interface CustomerBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  status: string;
  total_amount: number;
  cleaner_earnings: number;
  cleaner_name?: string;
}

interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  total_bookings: number;
}

interface BookingDetailsDialogProps {
  booking: {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    service_type: string;
    booking_date: string;
    booking_time: string;
    address_line1: string;
    address_suburb: string;
    address_city: string;
    total_amount: number;
    service_fee: number;
    cleaner_earnings: number;
    status: string;
    payment_reference: string;
    cleaner_name?: string | null;
    customer_id: string | null;
    requires_team?: boolean;
    cleaner_accepted_at?: string | null;
    cleaner_on_my_way_at?: string | null;
    cleaner_started_at?: string | null;
    cleaner_completed_at?: string | null;
  } | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onAssign: () => void;
  onEmail: () => void;
  onAddNote: () => void;
}

export function BookingDetailsDialog({
  booking,
  open,
  onClose,
  onEdit,
  onAssign,
  onEmail,
  onAddNote,
}: BookingDetailsDialogProps) {
  const [notes, setNotes] = useState<BookingNote[]>([]);
  const [customerHistory, setCustomerHistory] = useState<CustomerBooking[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [teamInfo, setTeamInfo] = useState<{
    teamName: string;
    supervisor: string;
    members: Array<{ name: string; earnings: number }>;
    totalEarnings: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && booking) {
      fetchDetails();
    }
  }, [open, booking]);

  const fetchDetails = async () => {
    if (!booking) return;

    try {
      setIsLoading(true);

      // Fetch notes
      const notesResponse = await fetch(`/api/admin/bookings/notes?bookingId=${booking.id}`, {
        credentials: 'include',
      });
      const notesData = await notesResponse.json();
      if (notesData.ok) {
        setNotes(notesData.notes);
      }

      // Fetch customer history if customer_id exists
      if (booking.customer_id) {
        const customerResponse = await fetch(`/api/admin/customers/${booking.customer_id}`, {
          credentials: 'include',
        });
        const customerData = await customerResponse.json();
        if (customerData.ok) {
          setCustomer(customerData.customer);
          setCustomerHistory(customerData.bookings);
        }
      }

      // Fetch team information if booking requires team
      if (booking.requires_team) {
        const teamResponse = await fetch(`/api/admin/bookings/team?bookingId=${booking.id}`, {
          credentials: 'include',
        });
        const teamData = await teamResponse.json();
        if (teamData.ok && teamData.team) {
          setTeamInfo(teamData.team);
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching details:', err);
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'on_my_way': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={onEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={onAssign} variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                {booking.requires_team ? 'Assign Team' : 'Assign Cleaner'}
              </Button>
              <Button onClick={onEmail} variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button onClick={onAddNote} variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>

            <Separator />

            {/* Booking Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Booking Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Booking ID</p>
                  <p className="font-mono">{booking.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service Type</p>
                  <p>{booking.service_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p>
                    {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-semibold">R{(booking.total_amount / 100).toFixed(2)}</p>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <p className="text-sm text-gray-600">Service Fee</p>
                  <p className="font-semibold text-orange-600">
                    R{(booking.service_fee / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subtotal (before fee)</p>
                  <p className="font-medium">
                    R{((booking.total_amount - booking.service_fee) / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cleaner Earnings</p>
                  <p className="font-semibold text-green-600">
                    R{(booking.cleaner_earnings / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company Earnings</p>
                  <p className="font-semibold text-blue-600">
                    R{((booking.total_amount - booking.cleaner_earnings) / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    (Service fee + {(((booking.total_amount - booking.cleaner_earnings - booking.service_fee) / (booking.total_amount - booking.service_fee)) * 100).toFixed(0)}% of subtotal)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Commission Rate</p>
                  <p className="font-semibold">
                    {(((booking.cleaner_earnings) / (booking.total_amount - booking.service_fee)) * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Reference</p>
                  <p className="font-mono text-sm">{booking.payment_reference || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">
                    {booking.requires_team ? 'Assigned Team' : 'Assigned Cleaner'}
                  </p>
                  {booking.requires_team ? (
                    teamInfo ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{teamInfo.teamName}</Badge>
                          <span className="text-sm text-gray-600">
                            ({teamInfo.members.length} members)
                          </span>
                        </div>
                        <div className="text-sm">
                          <p><strong>Supervisor:</strong> {teamInfo.supervisor}</p>
                          <p><strong>Total Earnings:</strong> R{(teamInfo.totalEarnings / 100).toFixed(2)}</p>
                        </div>
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            View Team Members
                          </summary>
                          <div className="mt-2 space-y-1 pl-4">
                            {teamInfo.members.map((member, index) => (
                              <div key={index} className="flex justify-between">
                                <span>{member.name} {member.isSupervisor && '(Supervisor)'}</span>
                                <span>R{(member.earnings / 100).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    ) : (
                      <span className="text-gray-400">Team not assigned yet</span>
                    )
                  ) : (
                    <p>{booking.cleaner_name || <span className="text-gray-400">Not assigned</span>}</p>
                  )}
                </div>
                {booking.cleaner_accepted_at && (
                  <div>
                    <p className="text-sm text-gray-500">Accepted At</p>
                    <p className="font-medium">
                      {new Date(booking.cleaner_accepted_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {booking.cleaner_on_my_way_at && (
                  <div>
                    <p className="text-sm text-gray-500">On My Way At</p>
                    <p className="font-medium">
                      {new Date(booking.cleaner_on_my_way_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {booking.cleaner_started_at && (
                  <div>
                    <p className="text-sm text-gray-500">Started At</p>
                    <p className="font-medium">
                      {new Date(booking.cleaner_started_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {booking.cleaner_completed_at && (
                  <div>
                    <p className="text-sm text-gray-500">Completed At</p>
                    <p className="font-medium">
                      {new Date(booking.cleaner_completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Customer Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{booking.customer_name}</span>
                  {customer && (
                    <Badge variant="outline" className="ml-2">
                      {customer.total_bookings} booking(s)
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{booking.customer_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{booking.customer_phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                  <span>
                    {booking.address_line1}, {booking.address_suburb}, {booking.address_city}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer History */}
            {customerHistory.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-3">Customer Booking History</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {customerHistory.map((historyBooking) => (
                      <div
                        key={historyBooking.id}
                        className={`p-3 rounded-lg border ${
                          historyBooking.id === booking.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{historyBooking.service_type}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(historyBooking.booking_date).toLocaleDateString()} at{' '}
                              {historyBooking.booking_time}
                            </p>
                            {historyBooking.cleaner_name && (
                              <p className="text-xs text-gray-500">
                                Cleaner: {historyBooking.cleaner_name}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(historyBooking.status)} variant="outline">
                              {historyBooking.status}
                            </Badge>
                            <p className="text-xs mt-1">
                              R{historyBooking.total_amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {notes.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-3">Internal Notes ({notes.length})</h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">{note.note}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {note.admin_id} - {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

