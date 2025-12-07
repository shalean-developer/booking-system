'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { NewHeader } from '@/components/dashboard/new-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, ArrowLeft, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { devLog } from '@/lib/dev-logger';

interface Payment {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  reference?: string | null;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [nextInvoice, setNextInvoice] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadInvoice = async (paymentId: string) => {
    setDownloadingId(paymentId);
    try {
      const { data: { session: apiSession } } = await supabase.auth.getSession();
      if (!apiSession) {
        toast.error('Session expired. Please log in again.');
        setDownloadingId(null);
        return;
      }

      // Fetch invoice HTML and download
      const response = await fetch(`/api/dashboard/invoices/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${apiSession.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download invoice');
      }

      const html = await response.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = `invoice-${paymentId.slice(-8)}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded');
    } catch (error: unknown) {
      devLog.error('Error downloading invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download invoice';
      toast.error(errorMessage);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const session = await safeGetSession(supabase);
        if (!session || !session.user) {
          router.push('/login?redirect=/dashboard/payments');
          return;
        }

        setUser(session.user);

        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          setError('Session expired');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/dashboard/payments', {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.ok) {
          setPayments(data.recentPayments || []);
          setOutstandingBalance(data.outstandingBalance || 0);
          setNextInvoice(data.nextInvoice);
        } else {
          setError(data.error || 'Failed to load payments');
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
      } catch (err) {
        devLog.error('Error fetching payments:', err);
        setError('Failed to load payments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white pb-32 lg:pb-0">
      <NewHeader user={user} customer={customer} />
      
      <main className="py-6 sm:py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payment History</h1>
          </div>

          <div className="space-y-6">
            {/* Outstanding Balance */}
            {outstandingBalance > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    Outstanding Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-red-600">
                      R{(outstandingBalance / 100).toFixed(2)}
                    </p>
                    {nextInvoice && (
                      <Button asChild className="bg-gradient-to-r from-teal-500 to-green-500">
                        <Link href={`/booking/payment?bookingId=${nextInvoice.id}`}>
                          Pay Now
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Invoice */}
            {nextInvoice && (
              <Card>
                <CardHeader>
                  <CardTitle>Next Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="font-medium">{format(new Date(nextInvoice.dueDate), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-bold text-lg">R{(nextInvoice.amount / 100).toFixed(2)}</p>
                    </div>
                    <Button asChild className="bg-gradient-to-r from-teal-500 to-green-500">
                      <Link href={`/booking/payment?bookingId=${nextInvoice.id}`}>
                        Pay Now
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No payment history yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment, index) => (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          {payment.status === 'paid' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : payment.status === 'pending' ? (
                            <Clock className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">
                              {format(new Date(payment.date), 'MMM d, yyyy')}
                            </p>
                            {payment.reference && (
                              <p className="text-sm text-gray-500 font-mono">{payment.reference}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={
                            payment.status === 'paid' 
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }>
                            {payment.status}
                          </Badge>
                          <p className="font-semibold text-lg">R{(payment.amount / 100).toFixed(2)}</p>
                          {payment.status === 'paid' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadInvoice(payment.id)}
                              disabled={downloadingId === payment.id}
                              className="text-teal-600 border-teal-200 hover:bg-teal-50"
                            >
                              {downloadingId === payment.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-1" />
                                  Receipt
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
