'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface Quote {
  id: string;
  first_name: string;
  last_name: string;
  service_type: string;
  created_at: string;
  status: string;
}

interface QuotesWidgetDashboardProps {
  pendingCount?: number;
}

export function QuotesWidgetDashboard({ pendingCount }: QuotesWidgetDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [todayQuotesCount, setTodayQuotesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        // Fetch today's quotes
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const response = await fetch(`/api/admin/quotes?limit=1000`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.ok && data.quotes) {
          // Filter quotes created today
          const todayQuotes = data.quotes.filter((quote: Quote) => {
            const quoteDate = new Date(quote.created_at).toISOString().split('T')[0];
            return quoteDate === todayStr;
          });
          setTodayQuotesCount(todayQuotes.length);
          
          // Set pending quotes for the expanded view
          setQuotes(data.quotes.filter((q: Quote) => q.status === 'pending').slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching quotes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotes();
    // Refresh every 60 seconds
    const interval = setInterval(fetchQuotes, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card className="relative w-full text-sm sm:text-base">
        <CardHeader 
          className="px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors sm:px-4 sm:py-3"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center justify-between text-sm font-semibold sm:text-base">
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:text-left sm:gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              <div className="flex flex-col items-center sm:flex-row sm:items-center">
                <span className="leading-tight">Quotes</span>
                <span className="text-xs font-normal text-gray-500 sm:ml-1 sm:text-sm">
                  ({isLoading ? 0 : todayQuotesCount})
                </span>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-gray-500 sm:h-4 sm:w-4" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-gray-500 sm:h-4 sm:w-4" />
            )}
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent className="absolute left-0 right-0 top-full z-50 rounded-b-lg border-t border-gray-200 bg-white pt-0 shadow-lg">
            <div className="py-6 text-center text-xs text-gray-500 sm:py-8 sm:text-sm">
              <p>Loading...</p>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="relative w-full text-sm sm:text-base">
      <CardHeader 
        className="px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors sm:px-4 sm:py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-sm font-semibold sm:text-base">
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:text-left sm:gap-2">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            <div className="flex flex-col items-center sm:flex-row sm:items-center">
              <span className="leading-tight">Quotes</span>
              <span className="text-xs font-normal text-gray-500 sm:ml-1 sm:text-sm">
                ({todayQuotesCount})
              </span>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-500 sm:h-4 sm:w-4" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-500 sm:h-4 sm:w-4" />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="absolute left-0 right-0 top-full z-50 max-h-[320px] overflow-y-auto rounded-b-lg border-t border-gray-200 bg-white pt-0 shadow-lg">
        <div className="mb-3 border-b pb-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-700 sm:gap-2 sm:text-sm">
            <FileText className="h-3.5 w-3.5 text-gray-500 sm:h-4 sm:w-4" />
            <span className="font-medium">Pending Quotes</span>
          </div>
          <div className="mt-2 text-lg font-bold sm:text-2xl">{pendingCount || quotes.length}</div>
        </div>
        <div className="max-h-[240px] space-y-2.5 overflow-y-auto">
          {quotes.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500 sm:py-8 sm:text-sm">
              <FileText className="mx-auto mb-2 h-7 w-7 text-gray-400 sm:h-8 sm:w-8" />
              <p>No pending quotes</p>
            </div>
          ) : (
            quotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-2 text-xs transition-colors hover:bg-gray-100 sm:p-3 sm:text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 font-medium text-gray-900">
                    {quote.first_name} {quote.last_name}
                  </div>
                  <div className="mb-1 text-[11px] text-gray-600 sm:text-xs">{quote.service_type}</div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 sm:text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(quote.created_at)}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="ml-2 px-2 py-1 text-[11px] sm:px-3 sm:text-xs">
                  Pending
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
      )}
    </Card>
  );
}

