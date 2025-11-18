'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  TrendingUp,
  TrendingDown,
  Star,
  CheckCircle,
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle,
  Download,
  Mail,
  Filter,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Lazy load chart components
const BarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => ({ default: mod.Bar })), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false });

interface CleanerPerformance {
  id: string;
  name: string;
  photo_url: string | null;
  rating: number;
  total_bookings: number;
  completed_bookings: number;
  completion_rate: number;
  avg_rating: number;
  total_earnings: number;
  recent_bookings: number;
  recent_earnings: number;
  performance_change: number;
}

type SortField = 'name' | 'rating' | 'completion_rate' | 'total_bookings' | 'total_earnings' | 'recent_earnings';
type SortDirection = 'asc' | 'desc';

export function CleanerPerformanceClient() {
  const [cleaners, setCleaners] = useState<CleanerPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('recent_earnings');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCleaners, setSelectedCleaners] = useState<Set<string>>(new Set());
  const [showBulkMessageDialog, setShowBulkMessageDialog] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/cleaners/performance');
      const data = await response.json();
      if (data.ok) {
        console.log('✅ Performance data received:', data.cleaners?.length || 0, 'cleaners');
        console.log('Sample cleaner data:', data.cleaners?.[0]);
        // Ensure all cleaners have valid names
        const validCleaners = (data.cleaners || []).map((c: any) => ({
          ...c,
          name: c.name || `Cleaner ${c.id?.substring(0, 8) || 'Unknown'}`,
        }));
        console.log('Valid cleaners:', validCleaners.length);
        setCleaners(validCleaners);
      } else {
        setError(data.error || 'Failed to load performance data');
      }
    } catch (err) {
      console.error('Error fetching performance:', err);
      setError('An error occurred while loading performance data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedCleaners = cleaners
    .filter((cleaner) =>
      cleaner.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'rating':
          aValue = a.avg_rating;
          bValue = b.avg_rating;
          break;
        case 'completion_rate':
          aValue = a.completion_rate;
          bValue = b.completion_rate;
          break;
        case 'total_bookings':
          aValue = a.total_bookings;
          bValue = b.total_bookings;
          break;
        case 'total_earnings':
          aValue = a.total_earnings;
          bValue = b.total_earnings;
          break;
        case 'recent_earnings':
          aValue = a.recent_earnings;
          bValue = b.recent_earnings;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

  const toggleCleanerSelection = (cleanerId: string) => {
    setSelectedCleaners((prev) => {
      const next = new Set(prev);
      if (next.has(cleanerId)) {
        next.delete(cleanerId);
      } else {
        next.add(cleanerId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedCleaners.size === filteredAndSortedCleaners.length) {
      setSelectedCleaners(new Set());
    } else {
      setSelectedCleaners(new Set(filteredAndSortedCleaners.map((c) => c.id)));
    }
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  const getPerformanceColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">Failed to load performance data</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchPerformance} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalCleaners = cleaners.length;
  const avgRating = cleaners.reduce((sum, c) => sum + c.avg_rating, 0) / totalCleaners || 0;
  const avgCompletionRate = cleaners.reduce((sum, c) => sum + c.completion_rate, 0) / totalCleaners || 0;
  const totalEarnings = cleaners.reduce((sum, c) => sum + c.total_earnings, 0);
  const recentTotalEarnings = cleaners.reduce((sum, c) => sum + c.recent_earnings, 0);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cleaner Performance Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              View and compare cleaner performance metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                // Export to CSV
                const csv = [
                  ['Name', 'Rating', 'Completion Rate', 'Total Bookings', 'Total Earnings', 'Recent Earnings'].join(','),
                  ...filteredAndSortedCleaners.map((c) =>
                    [
                      c.name,
                      c.avg_rating.toFixed(2),
                      `${c.completion_rate}%`,
                      c.total_bookings,
                      c.total_earnings.toFixed(2),
                      c.recent_earnings.toFixed(2),
                    ].join(',')
                  ),
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cleaner-performance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                a.click();
              }}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            {selectedCleaners.size > 0 && (
              <Button
                onClick={() => setShowBulkMessageDialog(true)}
                variant="outline"
                size="sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                Message ({selectedCleaners.size})
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">Total Cleaners</div>
              <div className="text-2xl font-bold text-gray-900">{totalCleaners}</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">Avg Rating</div>
              <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                {avgRating.toFixed(1)}
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">Avg Completion Rate</div>
              <div className="text-2xl font-bold text-gray-900">{avgCompletionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">Total Earnings (30d)</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(recentTotalEarnings)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search cleaners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={selectAll}
                variant="outline"
                size="sm"
              >
                {selectedCleaners.size === filteredAndSortedCleaners.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Table */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Cleaner Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3">
                      <input
                        type="checkbox"
                        checked={selectedCleaners.size === filteredAndSortedCleaners.length && filteredAndSortedCleaners.length > 0}
                        onChange={selectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left p-3">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-gray-900"
                      >
                        Name
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left p-3">
                      <button
                        onClick={() => handleSort('rating')}
                        className="flex items-center gap-1 hover:text-gray-900"
                      >
                        Rating
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left p-3">
                      <button
                        onClick={() => handleSort('completion_rate')}
                        className="flex items-center gap-1 hover:text-gray-900"
                      >
                        Completion
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left p-3">
                      <button
                        onClick={() => handleSort('total_bookings')}
                        className="flex items-center gap-1 hover:text-gray-900"
                      >
                        Total Bookings
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left p-3">
                      <button
                        onClick={() => handleSort('total_earnings')}
                        className="flex items-center gap-1 hover:text-gray-900"
                      >
                        Total Earnings
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left p-3">
                      <button
                        onClick={() => handleSort('recent_earnings')}
                        className="flex items-center gap-1 hover:text-gray-900"
                      >
                        Recent (30d)
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left p-3">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedCleaners.map((cleaner, index) => (
                    <tr
                      key={cleaner.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedCleaners.has(cleaner.id)}
                          onChange={() => toggleCleanerSelection(cleaner.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              #{index + 1}
                            </Badge>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{cleaner.name}</div>
                            <div className="text-xs text-gray-500">
                              {cleaner.completed_bookings} completed
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{cleaner.avg_rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-[#3b82f6] h-2 rounded-full"
                              style={{ width: `${cleaner.completion_rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{cleaner.completion_rate}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{cleaner.total_bookings}</div>
                        <div className="text-xs text-gray-500">
                          {cleaner.recent_bookings} recent
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{formatCurrency(cleaner.total_earnings)}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-[#3b82f6]">
                          {formatCurrency(cleaner.recent_earnings)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {cleaner.performance_change > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : cleaner.performance_change < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : null}
                          <span className={`text-sm font-medium ${getPerformanceColor(cleaner.performance_change)}`}>
                            {cleaner.performance_change > 0 ? '+' : ''}
                            {cleaner.performance_change.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Performance Chart */}
        {filteredAndSortedCleaners.length > 0 && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Earnings Comparison (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {typeof window !== 'undefined' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredAndSortedCleaners.slice(0, 10).map(c => ({
                      name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
                      earnings: c.recent_earnings,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} style={{ fontSize: '10px' }} />
                      <YAxis tickFormatter={(value) => `R${value.toFixed(0)}`} style={{ fontSize: '10px' }} />
                      <Tooltip
                        formatter={(value: any) => formatCurrency(value)}
                        contentStyle={{ fontSize: '12px', padding: '8px' }}
                      />
                      <Bar dataKey="earnings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Message Dialog */}
        <Dialog open={showBulkMessageDialog} onOpenChange={setShowBulkMessageDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Bulk Message</DialogTitle>
              <DialogDescription>
                Send a message to {selectedCleaners.size} selected cleaner{selectedCleaners.size !== 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="bulkMessage">Message</Label>
                <Textarea
                  id="bulkMessage"
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={5}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkMessageDialog(false);
                  setBulkMessage('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!bulkMessage.trim()) {
                    alert('Please enter a message');
                    return;
                  }

                  setIsSendingMessage(true);
                  try {
                    const response = await fetch('/api/admin/cleaners/bulk-message', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        cleanerIds: Array.from(selectedCleaners),
                        message: bulkMessage,
                        channel: 'whatsapp',
                      }),
                    });

                    const data = await response.json();
                    if (data.ok) {
                      alert(`Message sent to ${data.sent} cleaner(s). ${data.failed > 0 ? `${data.failed} failed.` : ''}`);
                      setShowBulkMessageDialog(false);
                      setBulkMessage('');
                      setSelectedCleaners(new Set());
                    } else {
                      alert(`Failed to send message: ${data.error}`);
                    }
                  } catch (err) {
                    console.error('Error sending bulk message:', err);
                    alert('An error occurred while sending the message');
                  } finally {
                    setIsSendingMessage(false);
                  }
                }}
                disabled={isSendingMessage || !bulkMessage.trim()}
              >
                {isSendingMessage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

