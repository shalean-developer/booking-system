'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, CheckCircle, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { devLog } from '@/lib/dev-logger';

interface PaymentCardProps {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  reference?: string | null;
  dueDate?: string;
}

export function PaymentCard({
  id,
  date,
  amount,
  status,
  reference,
  dueDate,
}: PaymentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const paymentDate = new Date(date);
  const isOverdue = status === 'overdue' || (dueDate && new Date(dueDate) < new Date() && status === 'pending');

  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to download invoices');
        setIsDownloading(false);
        return;
      }

      // Fetch invoice HTML and open in new window
      const response = await fetch(`/api/dashboard/invoices/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
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
      link.download = `invoice-${id.slice(-8)}.html`;
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
      setIsDownloading(false);
    }
  };

  return (
    <Card className={cn(
      "bg-white border transition-shadow duration-200",
      isOverdue ? "border-red-200 bg-red-50/30" : "border-gray-100 hover:shadow-md"
    )}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base">
                {reference ? `Payment #${reference.slice(-8)}` : `Invoice #${id.slice(-8)}`}
              </h3>
              <Badge
                variant={
                  status === 'paid' ? 'default' :
                  isOverdue ? 'destructive' :
                  'secondary'
                }
                className="text-[10px] px-1.5 py-0 h-4 shrink-0"
              >
                {status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs lg:text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span>{format(paymentDate, 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className={cn(
              "font-bold text-sm sm:text-base lg:text-lg",
              status === 'paid' ? "text-blue-600" :
              isOverdue ? "text-red-600" :
              "text-gray-900"
            )}>
              R{typeof amount === 'number' ? (amount / 100).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
