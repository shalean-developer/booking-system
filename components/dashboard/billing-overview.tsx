'use client';

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaymentCard } from './payment-card';
import { BillingOverviewSkeleton } from './Skeleton';
import { CreditCard, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Payment {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  reference?: string | null;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  dueDate: string;
}

interface BillingOverviewProps {
  outstandingBalance: number;
  recentPayments: Payment[];
  nextInvoice: Invoice | null;
  isLoading?: boolean;
  onQuickPay?: () => void;
}

export const BillingOverview = memo(function BillingOverview({
  outstandingBalance,
  recentPayments,
  nextInvoice,
  isLoading = false,
  onQuickPay,
}: BillingOverviewProps) {
  const router = useRouter();

  const handleQuickPay = useCallback(() => {
    if (onQuickPay) {
      onQuickPay();
    } else if (nextInvoice) {
      router.push(`/booking/payment?bookingId=${nextInvoice.id}`);
    } else {
      router.push('/dashboard/payments');
    }
  }, [onQuickPay, nextInvoice, router]);

  if (isLoading) {
    return <BillingOverviewSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-white to-blue-50/30 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-3 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base lg:text-lg font-semibold">
          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
          <span className="truncate">Billing & Payments</span>
        </CardTitle>
        {recentPayments.length > 3 && (
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex flex-shrink-0">
            <Link href="/dashboard/payments" className="text-[10px] sm:text-xs">
              View All <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Outstanding Balance Alert */}
        {outstandingBalance > 0 && (
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-red-900">Outstanding Balance</p>
                <p className="text-[10px] sm:text-xs text-red-700">Payment required</p>
              </div>
            </div>
            <p className="text-base sm:text-lg font-bold text-red-600">R{(outstandingBalance / 100).toFixed(2)}</p>
          </div>
        )}

        {/* Next Invoice */}
        {nextInvoice && (
          <div>
            <h4 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-2">Next Invoice</h4>
            <PaymentCard
              id={nextInvoice.id}
              date={nextInvoice.date}
              amount={nextInvoice.amount}
              status="pending"
              dueDate={nextInvoice.dueDate}
            />
            <Button
              className="w-full mt-3 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-sm sm:text-base h-10 sm:h-11"
              onClick={handleQuickPay}
            >
              <CreditCard className="h-4 w-4 mr-2 flex-shrink-0" />
              Quick Pay
            </Button>
          </div>
        )}

        {/* Recent Payments */}
        <div>
          <h4 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 mb-2">Recent Payments</h4>
          {recentPayments.length === 0 ? (
            <div className="text-center py-4">
              <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3" />
              <p className="text-xs sm:text-sm lg:text-base text-gray-600">No payment history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPayments.slice(0, 2).map((payment) => (
                <PaymentCard
                  key={payment.id}
                  id={payment.id}
                  date={payment.date}
                  amount={payment.amount}
                  status={payment.status}
                  reference={payment.reference}
                />
              ))}
              {recentPayments.length > 2 && (
                <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm h-9 sm:h-10 touch-manipulation" asChild>
                  <Link href="/dashboard/payments">View All</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
});
