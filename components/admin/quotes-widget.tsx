'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarWithInitials } from '@/components/admin/avatar-with-initials';
import { StatusBadge } from '@/components/admin/status-badge';
import { FileText, Calendar, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Quote {
  id: string;
  first_name: string;
  last_name: string;
  service_type: string;
  status: string;
  created_at: string;
}

interface QuotesWidgetProps {
  quotes: Quote[];
  pendingCount?: number;
}

export function QuotesWidget({
  quotes,
  pendingCount,
}: QuotesWidgetProps) {
  const router = useRouter();

  const formatDate = (dateStr: string) => {
    try {
      const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const handleApprove = (quoteId: string, customerName: string) => {
    toast.success(`Quote approved for ${customerName}`);
    // TODO: Implement approve logic
  };

  const handleReject = (quoteId: string, customerName: string) => {
    toast.error(`Quote rejected for ${customerName}`);
    // TODO: Implement reject logic
  };

  const getStatusVariant = (status: string): any => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'pending';
      case 'contacted':
        return 'in_progress';
      case 'converted':
        return 'completed';
      default:
        return 'pending';
    }
  };

  const fullName = (quote: Quote) => `${quote.first_name} ${quote.last_name}`;

  return (
    <Card className="bg-white rounded-xl shadow-card border border-gray-200 hover:shadow-card-hover transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Quotes</CardTitle>
          {quotes.length > 0 && (
            <button
              onClick={() => router.push('/admin/quotes')}
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-2 pb-4 border-b">
            <FileText className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-600">Pending Quotes</div>
              <div className="text-sm font-semibold text-gray-900">
                {pendingCount !== undefined ? pendingCount : quotes.filter(q => q.status === 'pending').length}
              </div>
            </div>
          </div>

          {/* Quote List */}
          <div className="space-y-3">
            {quotes.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">No pending quotes</div>
            ) : (
              quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <AvatarWithInitials 
                      name={fullName(quote)} 
                      size="sm"
                      variant="green"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {fullName(quote)}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5 truncate">
                            {quote.service_type}
                          </div>
                        </div>
                        <StatusBadge status={getStatusVariant(quote.status)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(quote.created_at)}</span>
                        </div>
                        {quote.status === 'pending' && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => handleApprove(quote.id, fullName(quote))}
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => handleReject(quote.id, fullName(quote))}
                            >
                              <XCircle className="h-3.5 w-3.5 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
