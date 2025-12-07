'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { NewHeader } from '@/components/dashboard/new-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Ticket, AlertCircle, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { devLog } from '@/lib/dev-logger';

const statusColors: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const statusIcons: Record<string, any> = {
  open: AlertCircle,
  'in-progress': Clock,
  resolved: CheckCircle,
  closed: CheckCircle,
};

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [ticket, setTicket] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const session = await safeGetSession(supabase);
        if (!session || !session.user) {
          router.push(`/login?redirect=/dashboard/tickets/${id}`);
          return;
        }

        setUser(session.user);

        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          setError('Session expired');
          setIsLoading(false);
          return;
        }

        // Fetch ticket details
        const ticketResponse = await fetch(`/api/dashboard/tickets/${id}`, {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });

        const ticketData = await ticketResponse.json();

        if (!ticketResponse.ok || !ticketData.ok || !ticketData.ticket) {
          setError(ticketData.error || 'Ticket not found');
          setIsLoading(false);
          return;
        }

        setTicket(ticketData.ticket);

        // Fetch customer data
        const customerResponse = await fetch('/api/dashboard/bookings?limit=1', {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });
        const customerData = await customerResponse.json();
        if (customerResponse.ok && customerData.ok && customerData.customer) {
          setCustomer(customerData.customer);
        }
      } catch (err) {
        devLog.error('Error fetching ticket:', err);
        setError('Failed to load ticket');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicket();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white">
        <NewHeader user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white">
        <NewHeader user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error || 'Ticket not found'}</p>
              <div className="space-y-3">
                <Button onClick={() => router.push('/dashboard/tickets')} className="w-full">
                  Back to Tickets
                </Button>
                <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[ticket.status] || Ticket;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white pb-32 lg:pb-0">
      <NewHeader user={user} customer={customer} />
      
      <main className="py-6 sm:py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/tickets')} className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Tickets
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ticket Details</h1>
          </div>

          <div className="space-y-6">
            {/* Ticket Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{ticket.subject}</CardTitle>
                      <Badge className={statusColors[ticket.status] || statusColors.open}>
                        {ticket.status}
                      </Badge>
                      {ticket.priority === 'urgent' && (
                        <Badge variant="destructive">Urgent</Badge>
                      )}
                      {ticket.priority === 'high' && (
                        <Badge className="bg-red-100 text-red-800">High Priority</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <span className="capitalize">{ticket.status}</span>
                      </div>
                      {ticket.category && (
                        <span className="capitalize">Category: {ticket.category}</span>
                      )}
                      <span>Created: {format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Ticket ID</p>
                    <p className="font-mono text-sm font-semibold">{ticket.id}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Ticket Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                </div>
              </CardContent>
            </Card>

            {/* Response Section (if resolved) */}
            {ticket.status === 'resolved' && ticket.response && (
              <Card className="border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.response}</p>
                    {ticket.resolved_at && (
                      <p className="text-sm text-gray-500 mt-4">
                        Resolved: {format(new Date(ticket.resolved_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`/contact?ticket=${ticket.id}`}>Contact Support</a>
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard/tickets')}>
                    Back to Tickets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
