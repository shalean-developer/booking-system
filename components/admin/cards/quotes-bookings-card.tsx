'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MoreVertical, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Format currency with R for South African Rand
const formatCurrency = (value: number, showDecimals: boolean = true) => {
  if (isNaN(value) || !isFinite(value)) return showDecimals ? 'R0.00' : 'R0';
  const formatted = new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(value);
  return `R${formatted}`;
};

interface QuotesBookingsCardProps {
  quotesValue?: number;
  quotesChange?: number;
  bookingsValue?: number;
  bookingsChange?: number;
}

export function QuotesBookingsCard({
  quotesValue = 20293.21,
  quotesChange = 42,
  bookingsValue = 12633.12,
  bookingsChange = -16,
}: QuotesBookingsCardProps) {
  return (
    <Card className="bg-white rounded-lg shadow-sm border-0">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-gray-900">Quotes & Bookings Values</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 sm:gap-3">
            <span>Today</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quotes Metric */}
        <div className="space-y-2 pb-3">
          <span className="text-xs text-gray-500">Quotes</span>
          <div className="text-2xl font-semibold text-gray-900">{formatCurrency(quotesValue, true)}</div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-600 font-medium">
              {Math.abs(quotesChange)}% since yesterday
            </span>
          </div>
        </div>

        {/* Bookings Metric */}
        <div className="space-y-2 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">Bookings</span>
          <div className="text-2xl font-semibold text-gray-900">{formatCurrency(bookingsValue, true)}</div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-xs text-red-600 font-medium">
              {Math.abs(bookingsChange)}% since yesterday
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

