'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { NewHeader } from '@/components/dashboard/new-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Ticket, ArrowLeft, Plus, MessageCircle, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { CreateTicketModal } from '@/components/dashboard/create-ticket-modal';
import { devLog } from '@/lib/dev-logger';

export default function TicketsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tickets, setTickets] = useState<Array<{
    id: string;
    subject: string;
    message: string;
    status: string;
    category?: string;
    priority?: string;
    created_at: string;
  }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await safeGetSession(supabase);
        if (!session || !session.user) {
          router.push('/login?redirect=/dashboard/tickets');
          return;
        }

        setUser(session.user);

        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          setIsLoading(false);
          return;
        }

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

        // Fetch tickets from API
        const ticketsResponse = await fetch('/api/dashboard/tickets', {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });
        const ticketsData = await ticketsResponse.json();
        if (ticketsResponse.ok && ticketsData.ok) {
          setTickets(ticketsData.tickets || []);
        }
      } catch (err) {
        devLog.error('Error fetching tickets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white pb-32 lg:pb-0">
      <NewHeader user={user} customer={customer} />
      
      <main className="py-6 sm:py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Support Tickets</h1>
            </div>
            <Button 
              onClick={() => setCreateModalOpen(true)}
              className="bg-gradient-to-r from-teal-500 to-green-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>

          {tickets.length === 0 ? (
            <Card className="border-2 border-dashed border-teal-300 bg-teal-50/30">
              <CardContent className="p-8 text-center">
                <Ticket className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No support tickets</h2>
                <p className="text-gray-600 mb-6">Create a ticket to get help from our support team</p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => setCreateModalOpen(true)}
                    className="w-full bg-gradient-to-r from-teal-500 to-green-500"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Create Support Ticket
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                            <Badge>{ticket.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{ticket.message}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateTicketModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onOptimisticCreate={(newTicket) => {
          // Optimistically add ticket to list
          setTickets((prev) => [newTicket, ...prev]);
        }}
        onSuccess={() => {
          // Refresh tickets list to ensure consistency
          const refreshTickets = async () => {
            try {
              const { data: { session: apiSession } } = await supabase.auth.getSession();
              if (!apiSession) return;

              const ticketsResponse = await fetch('/api/dashboard/tickets', {
                headers: {
                  'Authorization': `Bearer ${apiSession.access_token}`,
                },
              });
              const ticketsData = await ticketsResponse.json();
              if (ticketsResponse.ok && ticketsData.ok) {
                setTickets(ticketsData.tickets || []);
              }
            } catch (err) {
              devLog.error('Error refreshing tickets:', err);
            }
          };
          // Delay refresh slightly to allow optimistic update to show
          setTimeout(refreshTickets, 500);
        }}
      />
    </div>
  );
}
