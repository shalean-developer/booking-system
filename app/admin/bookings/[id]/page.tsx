'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin/shared/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { ArrowLeft, Edit, Mail, UserPlus, FileText } from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_amount: number;
  cleaner_name?: string | null;
  bedrooms?: number;
  bathrooms?: number;
  extras?: string[];
  extrasQuantities?: Record<string, number>;
  notes?: string;
  address_line1?: string;
  address_suburb?: string;
  address_city?: string;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'in-progress': 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  declined: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/bookings/${id}`);
      const data = await response.json();

      if (data.ok && data.booking) {
        setBooking(data.booking);
      } else {
        setError(data.error || 'Failed to fetch booking');
      }
    } catch (err) {
      setError('Failed to fetch booking');
      console.error('Error fetching booking:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Booking Details"
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: 'Bookings', href: '/admin/bookings' },
            { label: 'Details' },
          ]}
        />
        <LoadingState variant="cards" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Booking Details"
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: 'Bookings', href: '/admin/bookings' },
            { label: 'Details' },
          ]}
        />
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-600">{error || 'Booking not found'}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/admin/bookings">Back to Bookings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Booking ${booking.id}`}
        description={formatDate(booking.booking_date)}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Bookings', href: '/admin/bookings' },
          { label: booking.id },
        ]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/admin/bookings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/admin/bookings/${booking.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Booking Information */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Booking ID</p>
                  <p className="font-medium">{booking.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant="outline" className={statusColors[booking.status]}>
                    {booking.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service Type</p>
                  <p className="font-medium">{booking.service_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">
                    {formatDate(booking.booking_date)} at {booking.booking_time}
                  </p>
                </div>
                {booking.bedrooms !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Bedrooms</p>
                    <p className="font-medium">{booking.bedrooms}</p>
                  </div>
                )}
                {booking.bathrooms !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Bathrooms</p>
                    <p className="font-medium">{booking.bathrooms}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium text-lg">{formatCurrency(booking.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cleaner</p>
                  <p className="font-medium">{booking.cleaner_name || 'Unassigned'}</p>
                </div>
              </div>

              {booking.extras && booking.extras.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Extras</p>
                  <div className="flex flex-wrap gap-2">
                    {booking.extras.map((extra, idx) => {
                      const quantity = booking.extrasQuantities?.[extra] || 1;
                      return (
                        <Badge key={idx} variant="outline">
                          {extra} {quantity > 1 && `(x${quantity})`}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {booking.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <p className="text-sm">{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address */}
          {(booking.address_line1 || booking.address_suburb || booking.address_city) && (
            <Card>
              <CardHeader>
                <CardTitle>Service Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {booking.address_line1}
                  <br />
                  {booking.address_suburb}
                  <br />
                  {booking.address_city}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{booking.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium break-all">{booking.customer_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{booking.customer_phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/bookings/${booking.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Booking
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Cleaner
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-gray-500">Created</p>
                <p>{new Date(booking.created_at).toLocaleString('en-ZA')}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p>{new Date(booking.updated_at).toLocaleString('en-ZA')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
