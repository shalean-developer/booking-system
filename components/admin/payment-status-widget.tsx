'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { motion } from 'framer-motion';

interface PaymentStatus {
  totalPaid: number;
  pendingPayments: number;
  overduePayments: number;
  collectionRate: number;
  avgTimeToPayment: number;
  recentPayments: Array<{
    id: string;
    customer_name: string;
    amount: number;
    created_at: string;
    status: string;
  }>;
}

interface PaymentStatusWidgetProps {
  data?: PaymentStatus;
  isLoading?: boolean;
}

export function PaymentStatusWidget({ data, isLoading }: PaymentStatusWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5 text-green-600" />
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse space-y-3 w-full">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5 text-green-600" />
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-sm text-gray-500">
            No payment data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const collectionRateColor = data.collectionRate >= 90 
    ? 'text-green-600' 
    : data.collectionRate >= 70 
    ? 'text-yellow-600' 
    : 'text-red-600';

  const collectionRateBg = data.collectionRate >= 90 
    ? 'bg-green-50' 
    : data.collectionRate >= 70 
    ? 'bg-yellow-50' 
    : 'bg-red-50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-green-600" />
              Payment Status
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {formatCurrency(data.totalPaid)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Collection Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Collection Rate</span>
              <span className={`font-semibold ${collectionRateColor}`}>
                {data.collectionRate.toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={data.collectionRate} 
              className="h-2"
            />
          </div>

          {/* Payment Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg ${collectionRateBg} border`}>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-gray-700">Paid</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(data.totalPaid)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-xs font-medium text-gray-700">Pending</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(data.pendingPayments)}
              </div>
            </div>

            {data.overduePayments > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-medium text-gray-700">Overdue</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(data.overduePayments)}
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-700">Avg Time</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {data.avgTimeToPayment.toFixed(1)}h
              </div>
            </div>
          </div>

          {/* Recent Payments */}
          {data.recentPayments && data.recentPayments.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Recent Payments</span>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'payments' }))}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-1">
                {data.recentPayments.slice(0, 3).map((payment, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="font-medium text-gray-900">{payment.customer_name}</span>
                    </div>
                    <span className="font-semibold text-gray-700">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

