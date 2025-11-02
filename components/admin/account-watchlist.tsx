'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WatchlistItem {
  name: string;
  balance: number;
}

interface AccountWatchlistProps {
  items: WatchlistItem[];
}

export function AccountWatchlist({ items }: AccountWatchlistProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">Account Watchlist</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
            >
              <span className="text-sm text-gray-700">{item.name}</span>
              <span
                className={`text-sm font-medium ${
                  item.balance >= 0 ? 'text-gray-900' : 'text-red-600'
                }`}
              >
                {formatCurrency(item.balance)}
              </span>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No watchlist items configured
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

