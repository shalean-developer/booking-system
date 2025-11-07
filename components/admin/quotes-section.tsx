'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  Search, 
  Trash2, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Mail,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { fetcher } from '@/lib/fetcher';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { calcTotalSync, PRICING } from '@/lib/pricing';
import type { ServiceType } from '@/types/booking';

interface Quote {
  id: string;
  service_type: string;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  estimated_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface QuotesStats {
  quotes: {
    newToday: number;
    change: number;
    total: number;
  };
  quotesValue: {
    today: number;
    change: number;
  };
  conversions: {
    rate: number;
    bookings: number;
    quotes: number;
    total: number;
  };
  cleanings: {
    total: number;
    standard: number;
    deepCleaning: number;
    moveInMoveOut: number;
  };
}

export function QuotesSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => {
    const statusParam = searchParams?.get('status');
    return statusParam || 'all';
  });
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [cleaningsPeriod, setCleaningsPeriod] = useState<'today' | 'all_time'>('all_time');
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Debounce search input to reduce API calls
  const search = useDebouncedValue(searchInput, 500);

  // Fetch stats
  const { data: statsData } = useSWR<{ ok: boolean; stats: QuotesStats }>(
    `/api/admin/quotes/stats?period=${cleaningsPeriod === 'all_time' ? 'all_time' : 'today'}`,
    fetcher
  );

  const stats = statsData?.stats;

  // Build API URL with params
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...(search && { search }),
    ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
  });

  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate } = useSWR<{
    quotes: Quote[];
    pagination: { totalPages: number; total: number };
  }>(
    `/api/admin/quotes?${params}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const quotes = data?.quotes || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalQuotes = data?.pagination?.total || 0;

  const handleUpdateQuote = async () => {
    if (!editingQuote) return;

    try {
      const response = await fetch('/api/admin/quotes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: editingQuote.id,
          status: editStatus,
          notes: editNotes,
        }),
      });

      const responseData = await response.json();

      if (!responseData.ok) {
        throw new Error(responseData.error || 'Failed to update quote');
      }

      setEditingQuote(null);
      setEditStatus('');
      setEditNotes('');
      mutate(); // Revalidate SWR cache
    } catch (err) {
      console.error('Error updating quote:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to update quote';
      alert(`Failed to update quote: ${errorMsg}`);
    }
  };

  const handleDelete = async () => {
    if (!deletingQuote) return;

    try {
      const response = await fetch(`/api/admin/quotes?id=${deletingQuote.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const responseData = await response.json();

      if (!responseData.ok) {
        throw new Error(responseData.error || 'Failed to delete quote');
      }

      setDeletingQuote(null);
      mutate(); // Revalidate SWR cache
    } catch (err) {
      console.error('Error deleting quote:', err);
      alert('Failed to delete quote');
    }
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    alert('Export functionality coming soon');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'contacted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'converted': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const openEditDialog = (quote: Quote) => {
    setEditingQuote(quote);
    setEditStatus(quote.status);
    setEditNotes(quote.notes || '');
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'R0.00';
    // Convert from cents to rands (consistent with API - always divide by 100)
    const randAmount = price / 100;
    return `R${randAmount.toFixed(2)}`;
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  // Sort quotes
  const sortedQuotes = [...quotes].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Calculate max cleaning type for progress bars
  const maxCleanings = stats?.cleanings.total || 1;
  const standardPercent = stats ? (stats.cleanings.standard / maxCleanings) * 100 : 0;
  const deepPercent = stats ? (stats.cleanings.deepCleaning / maxCleanings) * 100 : 0;
  const moveInMoveOutPercent = stats ? (stats.cleanings.moveInMoveOut / maxCleanings) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quotes Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-bold text-gray-900">Quotes</CardTitle>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 font-normal">Today</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Today</DropdownMenuItem>
                  <DropdownMenuItem>This Week</DropdownMenuItem>
                  <DropdownMenuItem>This Month</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-4xl font-bold text-gray-900 mb-4">{stats?.quotes.newToday || 0} new quotes</div>
            <div className="flex flex-col items-start">
              <div className="flex items-center text-base">
                {stats && stats.quotes.change >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1.5" />
                    <span className="text-green-500 font-bold">{Math.abs(stats.quotes.change)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1.5" />
                    <span className="text-red-500 font-bold">{stats ? Math.abs(stats.quotes.change) : 0}%</span>
                  </>
                )}
              </div>
              <span className="text-sm text-gray-500 font-normal mt-0.5">since yesterday</span>
            </div>
          </CardContent>
        </Card>

        {/* Cleanings Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col">
              <CardTitle className="text-sm font-medium">Cleanings</CardTitle>
              <span className="text-xs text-gray-500 mt-1">{cleaningsPeriod === 'all_time' ? 'All the time' : 'Today'}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCleaningsPeriod('today')}>Today</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCleaningsPeriod('all_time')}>All the time</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total</span>
                <span className="text-sm font-medium">{stats?.cleanings.total || 0}</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all" style={{ width: '100%' }} />
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm">Standard</span>
                <span className="text-sm font-medium">{stats?.cleanings.standard || 0}</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all" style={{ width: `${standardPercent}%` }} />
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm">Deep Cleaning</span>
                <span className="text-sm font-medium">{stats?.cleanings.deepCleaning || 0}</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-orange-500 rounded-full transition-all" style={{ width: `${deepPercent}%` }} />
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm">Move In/Move Out</span>
                <span className="text-sm font-medium">{stats?.cleanings.moveInMoveOut || 0}</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all" style={{ width: `${moveInMoveOutPercent}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quotes Value Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotes Value</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Today</DropdownMenuItem>
                <DropdownMenuItem>This Week</DropdownMenuItem>
                <DropdownMenuItem>This Month</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? formatCurrency(stats.quotesValue.today) : 'R0.00'}</div>
            <div className="flex items-center text-sm mt-2">
              {stats && stats.quotesValue.change >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">{Math.abs(stats.quotesValue.change)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-500">{stats ? Math.abs(stats.quotesValue.change) : 0}%</span>
                </>
              )}
              <span className="text-gray-500 ml-1">since yesterday</span>
            </div>
          </CardContent>
        </Card>

        {/* Conversions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Today</DropdownMenuItem>
                <DropdownMenuItem>This Week</DropdownMenuItem>
                <DropdownMenuItem>This Month</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(stats?.conversions.rate || 0) * 2.26} 226.2`}
                      className="text-green-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-medium">{stats?.conversions.rate || 0}%</span>
                    <span className="text-[10px] text-gray-500">Booked</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{stats?.conversions.total || 0} Total</div>
              </div>
              <div className="space-y-2 ml-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">{stats?.conversions.bookings || 0} Bookings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  <span className="text-sm">{stats?.conversions.quotes || 0} Quotes</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotes List Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Quotes</CardTitle>
              <span className="text-sm text-gray-500">{totalQuotes} Total</span>
            </div>
            <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    ? <span>Today</span>
                    : selectedDate
                    ? format(selectedDate, 'PPP')
                    : <span>Today</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedQuotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No quotes found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cleaning</TableHead>
                      <TableHead>Zip</TableHead>
                      <TableHead>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedQuotes.map((quote) => (
                      <TableRow 
                        key={quote.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setViewingQuote(quote)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{new Date(quote.created_at).getDate()}</Badge>
                            <span className="text-sm">{format(new Date(quote.created_at), 'MMM d, yyyy')}</span>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{quote.email}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{quote.service_type || 'None'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">N/A</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{formatPrice(quote.estimated_price)}</span>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Quote Dialog */}
      <Dialog open={!!viewingQuote} onOpenChange={(open) => !open && setViewingQuote(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {viewingQuote && (() => {
            // Calculate pricing breakdown using actual pricing calculation
            const pricingDetails = calcTotalSync(
              {
                service: viewingQuote.service_type as ServiceType,
                bedrooms: viewingQuote.bedrooms,
                bathrooms: viewingQuote.bathrooms,
                extras: viewingQuote.extras,
              },
              'one-time'
            );

            // Calculate extras breakdown
            const extrasBreakdown = viewingQuote.extras.map(extra => ({
              name: extra,
              price: PRICING.extras[extra as keyof typeof PRICING.extras] || 0
            }));

            const extrasTotal = extrasBreakdown.reduce((sum, e) => sum + e.price, 0);
            const serviceBasePrice = pricingDetails.subtotal - extrasTotal;
            
            // Calculate tax (assuming 10% tax rate)
            const taxRate = 0.1;
            const tax = Math.round((pricingDetails.subtotal + pricingDetails.serviceFee) * taxRate * 100) / 100;
            
            // Calculate total (subtotal + service fee + tax - discount)
            const total = pricingDetails.total + tax;
            
            // Calculate duration (estimate based on service type and size)
            const baseHours = viewingQuote.service_type === 'Move In/Out' ? 3.5 : viewingQuote.service_type === 'Deep' ? 4 : 2;
            const roomHours = (viewingQuote.bedrooms + viewingQuote.bathrooms) * 0.3;
            const duration = Math.round((baseHours + roomHours) * 10) / 10;
            
            // Helper function to determine if field has value
            const hasValue = (value: any) => value !== null && value !== undefined && value !== '' && value !== 'None';
            
            // Helper function to get status icon
            const getStatusIcon = (hasValue: boolean) => {
              if (hasValue) {
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
              }
              return <AlertCircle className="h-4 w-4 text-orange-500" />;
            };
            
            // Format time from created_at (show time of quote creation)
            const quoteTime = format(new Date(viewingQuote.created_at), 'h:mm a');
            const timeEnd = format(new Date(new Date(viewingQuote.created_at).getTime() + duration * 60 * 60 * 1000), 'h:mm a');
            
            return (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Quote Details #{viewingQuote.id}</DialogTitle>
                  <DialogDescription className="text-sm text-gray-500">
                    {format(new Date(viewingQuote.created_at), 'MMM d, yyyy h:mm a')}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quote Details Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-bold">Quote Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        {/* Left Column */}
                        <div className="space-y-4">
                          <div className="flex items-start gap-2">
                            {getStatusIcon(true)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Date</p>
                              <p className="text-sm font-medium">{format(new Date(viewingQuote.created_at), 'MMMM d, yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon(viewingQuote.bedrooms > 0 || viewingQuote.bathrooms > 0)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Beds & Baths</p>
                              <p className="text-sm font-medium">
                                {viewingQuote.bedrooms === 0 ? 'Studio' : `${viewingQuote.bedrooms} Bed${viewingQuote.bedrooms !== 1 ? 's' : ''}`} & {viewingQuote.bathrooms} Bath{viewingQuote.bathrooms !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon(true)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">How Often</p>
                              <p className="text-sm font-medium">One Time</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon(hasValue(viewingQuote.first_name))}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Name</p>
                              <p className="text-sm font-medium">{hasValue(viewingQuote.first_name) ? `${viewingQuote.first_name} ${viewingQuote.last_name}` : 'None'}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Middle Column */}
                        <div className="space-y-4">
                          <div className="flex items-start gap-2">
                            {getStatusIcon(true)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Time</p>
                              <p className="text-sm font-medium">{quoteTime} - {timeEnd}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon(true)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Condition</p>
                              <p className="text-sm font-medium">Not Specified</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon(viewingQuote.extras.length > 0)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Extra Services</p>
                              <p className="text-sm font-medium">{viewingQuote.extras.length > 0 ? `${viewingQuote.extras.length} Service${viewingQuote.extras.length !== 1 ? 's' : ''}` : 'None'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon(hasValue(viewingQuote.phone))}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Number</p>
                              <p className="text-sm font-medium">{hasValue(viewingQuote.phone) ? viewingQuote.phone : 'None'}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right Column */}
                        <div className="space-y-4">
                          <div className="flex items-start gap-2">
                            {getStatusIcon(true)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Cleaning</p>
                              <p className="text-sm font-medium">{viewingQuote.service_type || 'None'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon(false)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Sq. Ft.</p>
                              <p className="text-sm font-medium">N/A</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon(viewingQuote.extras.some(e => e.toLowerCase().includes('supplies') || e.toLowerCase().includes('cleaning supplies')))}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Cleaning Supplies</p>
                              <p className="text-sm font-medium">{viewingQuote.extras.some(e => e.toLowerCase().includes('supplies')) ? 'Yes' : 'No'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            {getStatusIcon(false)}
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Payment Method</p>
                              <p className="text-sm font-medium">None</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-xs text-gray-500">Source: Quote Form</p>
                        {viewingQuote.notes && (
                          <p className="text-xs text-gray-500 mt-1">Notes: {viewingQuote.notes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Quote Summary Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-bold">Quote Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Duration: {duration} hours of cleaning
                        </p>
                        <p className="text-sm text-gray-600">
                          {viewingQuote.email}
                        </p>
                        {viewingQuote.phone && (
                          <p className="text-sm text-gray-600">
                            {viewingQuote.phone}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">{viewingQuote.service_type || 'Cleaning'}</p>
                            <p className="text-xs text-gray-500">*One Time*</p>
                          </div>
                          <p className="text-sm font-medium">{formatCurrency(serviceBasePrice)}</p>
                        </div>
                        
                        {extrasBreakdown.map((extra, idx) => (
                          <div key={idx} className="flex justify-between">
                            <p className="text-sm">{extra.name}</p>
                            <p className="text-sm">{formatCurrency(extra.price)}</p>
                          </div>
                        ))}
                        
                        {pricingDetails.serviceFee > 0 && (
                          <div className="flex justify-between">
                            <p className="text-sm">Service Fee</p>
                            <p className="text-sm">{formatCurrency(pricingDetails.serviceFee)}</p>
                          </div>
                        )}
                        
                        {pricingDetails.frequencyDiscount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <p className="text-sm">Frequency Discount</p>
                            <p className="text-sm">-{formatCurrency(pricingDetails.frequencyDiscount)}</p>
                          </div>
                        )}
                        
                        {tax > 0 && (
                          <div className="flex justify-between">
                            <p className="text-sm">Tax</p>
                            <p className="text-sm">{formatCurrency(tax)}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-4 border-t bg-gray-50 rounded-lg p-4 -mx-4 -mb-4">
                        <div className="flex justify-between items-center">
                          <p className="text-base font-bold">Total:</p>
                          <p className="text-xl font-bold">{formatCurrency(total)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewingQuote(null)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    if (viewingQuote) {
                      openEditDialog(viewingQuote);
                      setViewingQuote(null);
                    }
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Quote Dialog */}
      <Dialog open={!!editingQuote} onOpenChange={(open) => !open && setEditingQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Quote</DialogTitle>
            <DialogDescription>
              Update the status and notes for quote {editingQuote?.id}
            </DialogDescription>
          </DialogHeader>
          {editingQuote && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this quote..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuote(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateQuote}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingQuote} onOpenChange={(open) => !open && setDeletingQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete quote {deletingQuote?.id}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingQuote(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
