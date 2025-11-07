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
      <Card className="w-full relative">
        <CardHeader 
          className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Quotes</span>
              <span className="text-sm font-normal text-gray-500">({isLoading ? 0 : todayQuotesCount})</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0 absolute top-full left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg rounded-b-lg">
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Loading...</p>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="w-full relative">
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Quotes</span>
            <span className="text-sm font-normal text-gray-500">({todayQuotesCount})</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 absolute top-full left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg rounded-b-lg max-h-[400px] overflow-y-auto">
        <div className="mb-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Pending Quotes</span>
          </div>
          <div className="text-2xl font-bold mt-2">{pendingCount || quotes.length}</div>
        </div>
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {quotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No pending quotes</p>
            </div>
          ) : (
            quotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 mb-1">
                    {quote.first_name} {quote.last_name}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">{quote.service_type}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(quote.created_at)}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="ml-2">
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

