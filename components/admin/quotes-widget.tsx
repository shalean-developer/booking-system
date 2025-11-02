'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

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
  const formatDate = (dateStr: string) => {
    try {
      const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'default'; // yellow/amber
      case 'contacted':
        return 'secondary'; // blue
      case 'converted':
        return 'outline'; // green
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">Quotes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 pb-4 border-b">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-xs text-gray-600">Pending Quotes</div>
                <div className="text-sm font-semibold text-gray-900">
                  {pendingCount !== undefined ? pendingCount : quotes.filter(q => q.status === 'pending').length}
                </div>
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
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        {quote.first_name} {quote.last_name}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {quote.service_type}
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(quote.status)} className="ml-2">
                      {getStatusLabel(quote.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(quote.created_at)}</span>
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
