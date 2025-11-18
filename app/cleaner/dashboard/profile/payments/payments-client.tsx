'use client';

import { useState, useEffect } from 'react';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import { CreditCard as CreditCardIcon, ArrowLeft, Loader2, Calendar, MapPin, DollarSign, Settings } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CleanerSession {
  id: string;
  name: string;
  phone: string;
  photo_url: string | null;
  rating: number;
  areas: string[];
  is_available: boolean;
}

interface PaymentsClientProps {
  cleaner: CleanerSession;
}

interface Transaction {
  id: string;
  tip_amount?: number;
  service_fee?: number;
  commission_earnings?: number;
  service_subtotal?: number;
  booking_date: string;
  booking_time: string;
  service_type: string;
  total_amount: number;
  cleaner_earnings: number;
  status: string;
  customer_name?: string;
  address_line1?: string;
  address_suburb?: string;
  address_city?: string;
  created_at: string;
}

interface PaymentsSummary {
  total_earnings: number;
  total_tip?: number;
  total_commission?: number;
  total_bookings: number;
  monthly_earnings: number;
  monthly_tip?: number;
  monthly_commission?: number;
  monthly_bookings: number;
}

export function PaymentsClient({ cleaner }: PaymentsClientProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<PaymentsSummary>({
    total_earnings: 0,
    total_bookings: 0,
    monthly_earnings: 0,
    monthly_bookings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payout, setPayout] = useState({
    bank_name: '',
    account_holder: '',
    account_number: '',
    account_type: 'cheque',
    branch_code: '',
  });

  // Fetch payments data
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch('/api/cleaner/payments');

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API response not OK:', response.status, errorText);
          setErrorMessage(`Failed to load payments (${response.status})`);
          setIsLoading(false);
          return;
        }

        const data = await response.json();

        if (data.ok) {
          setTransactions(data.transactions || []);
          setSummary(data.summary || {
            total_earnings: 0,
            total_bookings: 0,
            monthly_earnings: 0,
            monthly_bookings: 0,
          });
        } else {
          setErrorMessage(data.error || 'Failed to load payments');
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while loading payments';
        setErrorMessage(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const formatCurrency = (cents: number) => {
    if (!cents || cents === 0) return 'R0.00';
    return `R${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const toRand = (cents?: number) => {
    if (!cents || cents === 0) return '0.00';
    return (cents / 100).toFixed(2);
  };

  const csvEscape = (value: unknown) => {
    const s = value === null || value === undefined ? '' : String(value);
    // If value contains comma, quote or newline, wrap in quotes and escape quotes
    if (/[",\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const handleExportCsv = () => {
    try {
      if (!transactions || transactions.length === 0) {
        setErrorMessage('No transactions to export.');
        return;
      }
      const headers = [
        'booking_id',
        'booking_date',
        'booking_time',
        'service_type',
        'status',
        'tip_amount_rand',
        'commission_earnings_rand',
        'cleaner_earnings_rand',
        'customer_name',
        'address_line1',
        'address_suburb',
        'address_city',
        'created_at',
      ];
      const rows = transactions.map((t) => {
        const commission = t.commission_earnings ?? Math.max((t.cleaner_earnings || 0) - (t.tip_amount || 0), 0);
        return [
          t.id,
          formatDate(t.booking_date),
          formatTime(t.booking_time),
          (t.service_type || '').replace('-', ' '),
          t.status,
          toRand(t.tip_amount),
          toRand(commission),
          toRand(t.cleaner_earnings),
          t.customer_name || '',
          t.address_line1 || '',
          t.address_suburb || '',
          t.address_city || '',
          new Date(t.created_at).toISOString(),
        ].map(csvEscape).join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const month = new Date().toISOString().slice(0, 7); // YYYY-MM
      a.href = url;
      a.download = `payments_${month}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setErrorMessage('Failed to export CSV');
    }
  };

  const getCurrentMonthName = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[new Date().getMonth()];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-[#3b82f6] text-white py-4 px-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Link href="/cleaner/dashboard/profile" className="p-1">
              <ArrowLeft className="h-6 w-6" strokeWidth={2} />
            </Link>
            <h1 className="text-lg font-semibold">Payments</h1>
            <CreditCardIcon className="h-6 w-6" strokeWidth={2} />
          </div>
        </header>
        <main className="bg-white pb-24">
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
            </div>
          </div>
        </main>
        <CleanerMobileBottomNav />
        <div className="h-20 sm:h-0" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Blue Header */}
      <header className="bg-[#3b82f6] text-white py-4 px-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Link href="/cleaner/dashboard/profile" className="p-1">
              <ArrowLeft className="h-6 w-6" strokeWidth={2} />
            </Link>
            <h1 className="text-lg font-semibold">Payments</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="p-1 rounded-md hover:bg-white/10 text-sm"
                disabled={transactions.length === 0}
                aria-label="Export CSV"
                title="Export CSV"
              >
                Export
              </button>
              <button
              onClick={async () => {
                setPayoutOpen(true);
                try {
                  const res = await fetch('/api/cleaner/payouts/settings');
                  const data = await res.json();
                  if (res.ok && data.ok && data.settings) {
                    setPayout({
                      bank_name: data.settings.bank_name || '',
                      account_holder: data.settings.account_holder || '',
                      account_number: data.settings.account_number || '',
                      account_type: data.settings.account_type || 'cheque',
                      branch_code: data.settings.branch_code || '',
                    });
                  } else {
                    setPayout({
                      bank_name: '',
                      account_holder: '',
                      account_number: '',
                      account_type: 'cheque',
                      branch_code: '',
                    });
                  }
                } catch {}
              }}
              aria-label="Payout settings"
              className="p-1 rounded-md hover:bg-white/10"
            >
              <Settings className="h-6 w-6" strokeWidth={2} />
            </button>
            </div>
          </div>
      </header>

      {/* Main Content */}
      <main className="bg-white pb-24">
        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Summary Cards - horizontal compact stack on mobile */}
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:mx-0 sm:px-0">
            {/* Monthly Earnings Card */}
            <Card className="border border-gray-200 shadow-sm min-w-[180px] shrink-0 sm:min-w-0">
              <CardContent className="p-3">
                <div className="text-[10px] text-gray-500 mb-0.5">{getCurrentMonthName()}</div>
                <div className="text-base font-semibold text-gray-900">
                  {formatCurrency(summary.monthly_earnings)}
                </div>
                {/* Monthly Breakdown */}
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="flex flex-col items-start gap-0.5 rounded bg-yellow-50 border border-yellow-100 pl-1 pr-0.5 py-0.5 leading-tight w-auto">
                    <div className="text-[10px] uppercase tracking-wide text-yellow-700">Tip</div>
                    <div className="font-semibold text-yellow-700 text-[11px]">
                      {formatCurrency(summary.monthly_tip || 0)}
                    </div>
                  </div>
                  <div className="rounded-md bg-gray-50 border border-gray-100 px-1.5 py-1">
                    <div className="text-[10px] uppercase tracking-wide text-gray-500">Commission</div>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(summary.monthly_commission || 0)}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  {summary.monthly_bookings} {summary.monthly_bookings === 1 ? 'booking' : 'bookings'}
                </div>
              </CardContent>
            </Card>

            {/* Total Earnings Card */}
            <Card className="border border-gray-200 shadow-sm min-w-[180px] shrink-0 sm:min-w-0">
              <CardContent className="p-3">
                <div className="text-[10px] text-gray-500 mb-0.5">Total</div>
                <div className="text-base font-semibold text-gray-900">
                  {formatCurrency(summary.total_earnings)}
                </div>
                {/* Total Breakdown */}
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="flex flex-col items-start gap-0.5 rounded bg-yellow-50 border border-yellow-100 pl-1 pr-0.5 py-0.5 leading-tight w-auto">
                    <div className="text-[10px] uppercase tracking-wide text-yellow-700">Tip</div>
                    <div className="font-semibold text-yellow-700 text-[11px]">
                      {formatCurrency(summary.total_tip || 0)}
                    </div>
                  </div>
                  <div className="rounded-md bg-gray-50 border border-gray-100 px-1.5 py-1">
                    <div className="text-[10px] uppercase tracking-wide text-gray-500">Commission</div>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(summary.total_commission || 0)}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  {summary.total_bookings} {summary.total_bookings === 1 ? 'booking' : 'bookings'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions List */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h2>
            
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCardIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 font-medium mb-1">No transactions yet</p>
                <p className="text-sm text-gray-500">
                  Completed bookings will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <Card key={transaction.id} className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header with Date and Amount */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(transaction.booking_date)} at {formatTime(transaction.booking_time)}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-[#3b82f6]">
                              {formatCurrency(transaction.cleaner_earnings)}
                            </div>
                          </div>
                        </div>

                        {/* Service Type */}
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700 capitalize">
                            {transaction.service_type?.replace('-', ' ') || 'N/A'}
                          </span>
                        </div>

                        {/* Earnings Breakdown - single horizontal row */}
                        <div className="flex items-stretch gap-2 text-xs text-gray-600 pt-1 overflow-x-auto no-scrollbar">
                          <div className="rounded-md bg-gray-50 border border-gray-100 px-2 py-1 min-w-[120px]">
                            <div className="text-[10px] uppercase tracking-wide text-gray-500">Commission</div>
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(transaction.commission_earnings ?? Math.max((transaction.cleaner_earnings || 0) - (transaction.tip_amount || 0), 0))}
                            </div>
                          </div>
                          <div className="flex flex-col items-start gap-0.5 rounded bg-yellow-50 border border-yellow-100 pl-1 pr-0.5 py-0.5 leading-tight w-auto min-w-[100px]">
                            <div className="text-[10px] uppercase tracking-wide text-yellow-700">Tip</div>
                            <div className="font-semibold text-yellow-700 text-[11px]">
                              {formatCurrency(transaction.tip_amount || 0)}
                            </div>
                          </div>
                        </div>

                        {/* Customer Name */}
                        {transaction.customer_name && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">
                              Customer: <span className="font-medium">{transaction.customer_name}</span>
                            </span>
                          </div>
                        )}

                        {/* Address */}
                        {(transaction.address_line1 || transaction.address_suburb || transaction.address_city) && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-gray-600 flex-1">
                              {[
                                transaction.address_line1,
                                transaction.address_suburb,
                                transaction.address_city,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Booking ID */}
                        <div className="pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500">
                            Booking: {transaction.id}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />

      {/* Bottom Spacer */}
      <div className="h-20 sm:h-0" />

      {/* Payout Settings Modal */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payout settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="bank_name" className="text-xs text-gray-600">Bank name</Label>
              <Input id="bank_name" value={payout.bank_name} onChange={(e) => setPayout({ ...payout, bank_name: e.target.value.trimStart() })} />
            </div>
            <div>
              <Label htmlFor="account_holder" className="text-xs text-gray-600">Account holder</Label>
              <Input id="account_holder" value={payout.account_holder} onChange={(e) => setPayout({ ...payout, account_holder: e.target.value.trimStart() })} />
            </div>
            <div>
              <Label htmlFor="account_number" className="text-xs text-gray-600">Account number</Label>
              <Input
                id="account_number"
                inputMode="numeric"
                value={payout.account_number}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^\d]/g, '');
                  setPayout({ ...payout, account_number: next });
                }}
              />
            </div>
            <div>
              <Label htmlFor="account_type" className="text-xs text-gray-600">Account type</Label>
              <select
                id="account_type"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={payout.account_type}
                onChange={(e) => setPayout({ ...payout, account_type: e.target.value })}
              >
                <option value="cheque">Cheque</option>
                <option value="savings">Savings</option>
                <option value="business">Business</option>
              </select>
            </div>
            <div>
              <Label htmlFor="branch_code" className="text-xs text-gray-600">Branch code</Label>
              <Input
                id="branch_code"
                inputMode="numeric"
                value={payout.branch_code}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^\d]/g, '');
                  setPayout({ ...payout, branch_code: next });
                }}
              />
            </div>
            {payoutError && (
              <div className="text-xs text-red-600">
                {payoutError}
              </div>
            )}
            <div className="text-xs text-gray-500">
              We’ll use these details for scheduled payouts. Ensure they are correct.
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <button
              onClick={() => setPayoutOpen(false)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setSavingPayout(true);
                try {
                  setPayoutError(null);
                  const trimmed = {
                    bank_name: payout.bank_name.trim(),
                    account_holder: payout.account_holder.trim(),
                    account_number: payout.account_number.trim(),
                    account_type: payout.account_type,
                    branch_code: payout.branch_code.trim(),
                  };
                  if (!trimmed.bank_name || !trimmed.account_holder || !trimmed.account_number) {
                    setPayoutError('Bank name, account holder and account number are required.');
                    return;
                  }
                  if (trimmed.account_number.length < 6) {
                    setPayoutError('Account number looks too short.');
                    return;
                  }
                  const res = await fetch('/api/cleaner/payouts/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(trimmed),
                  });
                  const data = await res.json();
                  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to save');
                  setPayoutOpen(false);
                } catch (e) {
                  setPayoutError(e instanceof Error ? e.message : 'Failed to save');
                } finally {
                  setSavingPayout(false);
                }
              }}
              className="rounded-md bg-[#3b82f6] text-white px-3 py-2 text-sm hover:bg-[#2563eb] disabled:opacity-70"
              disabled={savingPayout}
              type="button"
            >
              {savingPayout ? 'Saving...' : 'Save'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
