'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface HistoryRecord {
  id: string;
  service_type: string | null;
  price_type: string;
  item_name: string | null;
  old_price: number | null;
  new_price: number;
  changed_at: string;
  effective_date: string | null;
}

export function PriceHistoryTimeline() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('price_type', filter);
      }
      params.append('limit', '50');

      const response = await fetch(`/api/admin/pricing/history?${params.toString()}`);
      const data = await response.json();

      if (data.ok) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const getPriceTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      base: 'Base Price',
      bedroom: 'Bedroom Rate',
      bathroom: 'Bathroom Rate',
      extra: 'Extra Service',
      service_fee: 'Service Fee',
      frequency_discount: 'Frequency Discount',
    };
    return labels[type] || type;
  };

  const getDisplayName = (record: HistoryRecord) => {
    if (record.service_type && record.item_name) {
      return `${record.service_type} - ${record.item_name}`;
    }
    if (record.service_type) {
      return `${record.service_type} ${getPriceTypeLabel(record.price_type)}`;
    }
    if (record.item_name) {
      return record.item_name;
    }
    return getPriceTypeLabel(record.price_type);
  };

  const getPriceChange = (record: HistoryRecord) => {
    if (record.old_price === null) {
      return { type: 'new', label: 'New', color: 'bg-green-100 text-green-800' };
    }
    const change = record.new_price - record.old_price;
    if (change > 0) {
      return { type: 'increase', label: `+R${change.toFixed(2)}`, color: 'bg-red-100 text-red-800' };
    } else if (change < 0) {
      return { type: 'decrease', label: `R${change.toFixed(2)}`, color: 'bg-green-100 text-green-800' };
    }
    return { type: 'same', label: 'No change', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
        <span className="text-gray-600">Loading history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Filter by type:</label>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="base">Base Price</SelectItem>
            <SelectItem value="bedroom">Bedroom Rate</SelectItem>
            <SelectItem value="bathroom">Bathroom Rate</SelectItem>
            <SelectItem value="extra">Extra Services</SelectItem>
            <SelectItem value="service_fee">Service Fee</SelectItem>
            <SelectItem value="frequency_discount">Frequency Discounts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {history.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          No price history found
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((record, index) => {
            const priceChange = getPriceChange(record);
            const isFirst = index === 0;

            return (
              <Card key={record.id} className={`p-4 ${isFirst ? 'border-primary' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {getDisplayName(record)}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {getPriceTypeLabel(record.price_type)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      {record.old_price !== null && (
                        <span className="text-gray-500 line-through">
                          R{record.old_price}
                        </span>
                      )}
                      <span className="font-semibold text-gray-900">
                        R{record.new_price}
                      </span>
                      <Badge className={priceChange.color}>
                        {priceChange.type === 'increase' && <TrendingUp className="h-3 w-3 mr-1" />}
                        {priceChange.type === 'decrease' && <TrendingDown className="h-3 w-3 mr-1" />}
                        {priceChange.label}
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-600 mt-2">
                      Changed on {format(new Date(record.changed_at), 'PPpp')}
                      {record.effective_date && 
                        ` • Effective: ${format(new Date(record.effective_date), 'PP')}`
                      }
                    </p>
                  </div>

                  {isFirst && (
                    <Badge variant="default">Latest</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

