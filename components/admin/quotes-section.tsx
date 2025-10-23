'use client';

import { useState } from 'react';
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
  FileText
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
import { fetcher } from '@/lib/fetcher';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

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

export function QuotesSection() {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Debounce search input to reduce API calls
  const search = useDebouncedValue(searchInput, 500);

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
    pagination: { totalPages: number };
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
    if (!price) return 'N/A';
    return `R${price.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Quotations Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by name, email, phone, or quote ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <div className="flex items-center text-gray-500">
                <Search className="h-4 w-4" />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No quotes found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell className="font-mono text-sm">{quote.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{quote.first_name} {quote.last_name}</div>
                          <div className="text-sm text-gray-500">{quote.email}</div>
                          <div className="text-sm text-gray-500">{quote.phone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{quote.service_type}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{quote.bedrooms} bedroom(s), {quote.bathrooms} bathroom(s)</div>
                            {quote.extras.length > 0 && (
                              <div className="text-gray-500">
                                Extras: {quote.extras.join(', ')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatPrice(quote.estimated_price)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(quote.status)}>
                            {quote.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(quote.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(quote.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingQuote(quote)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(quote)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.location.href = `mailto:${quote.email}`}
                              title="Email Customer"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingQuote(quote)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quote Details</DialogTitle>
            <DialogDescription>
              Quote ID: {viewingQuote?.id}
            </DialogDescription>
          </DialogHeader>
          {viewingQuote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Customer Name</Label>
                  <p className="text-sm mt-1">{viewingQuote.first_name} {viewingQuote.last_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm mt-1">{viewingQuote.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="text-sm mt-1">{viewingQuote.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(viewingQuote.status)}>
                      {viewingQuote.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Service Type</Label>
                  <p className="text-sm mt-1">{viewingQuote.service_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Estimated Price</Label>
                  <p className="text-sm mt-1 font-medium">{formatPrice(viewingQuote.estimated_price)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Bedrooms</Label>
                  <p className="text-sm mt-1">{viewingQuote.bedrooms}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Bathrooms</Label>
                  <p className="text-sm mt-1">{viewingQuote.bathrooms}</p>
                </div>
              </div>
              {viewingQuote.extras.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Extra Services</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {viewingQuote.extras.map((extra, idx) => (
                      <Badge key={idx} variant="outline">{extra}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {viewingQuote.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{viewingQuote.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created</Label>
                  <p className="text-sm mt-1">
                    {new Date(viewingQuote.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="text-sm mt-1">
                    {new Date(viewingQuote.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
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

