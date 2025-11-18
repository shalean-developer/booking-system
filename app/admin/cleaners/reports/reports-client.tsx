'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Download,
  Calendar,
  Loader2,
  AlertCircle,
  FileText,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface CleanerReport {
  cleaner_id: string;
  cleaner_name: string;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_earnings: number;
  total_tips: number;
  bookings: Array<{
    id: string;
    date: string;
    time: string;
    service_type: string;
    status: string;
    total_amount: number;
    earnings: number;
    tip: number;
  }>;
}

interface ReportSummary {
  period: { startDate: string; endDate: string };
  total_cleaners: number;
  total_bookings: number;
  total_completed: number;
  total_earnings: number;
  total_tips: number;
}

export function CleanerReportsClient() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return format(date, 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [cleanerIds, setCleanerIds] = useState<string[]>([]);
  const [allCleaners, setAllCleaners] = useState<Array<{ id: string; name: string }>>([]);
  const [reports, setReports] = useState<CleanerReport[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  useEffect(() => {
    fetchCleaners();
  }, []);

  const fetchCleaners = async () => {
    try {
      const response = await fetch('/api/admin/cleaners');
      const data = await response.json();
      if (data.ok && data.cleaners) {
        setAllCleaners(data.cleaners.map((c: any) => ({ id: c.id, name: c.name })));
      }
    } catch (err) {
      console.error('Error fetching cleaners:', err);
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Invalid date format');
      return;
    }
    if (end < start) {
      setError('End date must be greater than or equal to start date');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        format: 'json',
      });

      if (cleanerIds.length > 0) {
        params.append('cleanerIds', cleanerIds.join(','));
      }

      const response = await fetch(`/api/admin/cleaners/reports?${params.toString()}`);
      const data = await response.json();

      if (data.ok) {
        setReports(data.reports || []);
        setSummary(data.summary || null);
      } else {
        setError(data.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError('An error occurred while generating the report');
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        format: 'csv',
      });

      if (cleanerIds.length > 0) {
        params.append('cleanerIds', cleanerIds.join(','));
      }

      const response = await fetch(`/api/admin/cleaners/reports?${params.toString()}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleaner-report-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV');
    }
  };

  const toggleCleaner = (cleanerId: string) => {
    setCleanerIds((prev) =>
      prev.includes(cleanerId)
        ? prev.filter((id) => id !== cleanerId)
        : [...prev, cleanerId]
    );
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cleaner Reports</h1>
            <p className="text-sm text-gray-600 mt-1">
              Generate custom reports for cleaner performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowFilterDialog(true)}
              variant="outline"
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            {reports.length > 0 && (
              <Button onClick={exportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {/* Date Range Selector */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Report Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={generateReport} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs text-gray-500 mb-1">Total Cleaners</div>
                <div className="text-2xl font-bold text-gray-900">{summary.total_cleaners}</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs text-gray-500 mb-1">Total Bookings</div>
                <div className="text-2xl font-bold text-gray-900">{summary.total_bookings}</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs text-gray-500 mb-1">Completed</div>
                <div className="text-2xl font-bold text-gray-900">{summary.total_completed}</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs text-gray-500 mb-1">Total Earnings</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.total_earnings)}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs text-gray-500 mb-1">Total Tips</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.total_tips)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Table */}
        {reports.length > 0 && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Cleaner Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3">Cleaner</th>
                      <th className="text-left p-3">Total Bookings</th>
                      <th className="text-left p-3">Completed</th>
                      <th className="text-left p-3">Cancelled</th>
                      <th className="text-left p-3">Total Earnings</th>
                      <th className="text-left p-3">Total Tips</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr
                        key={report.cleaner_id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3 font-medium">{report.cleaner_name}</td>
                        <td className="p-3">{report.total_bookings}</td>
                        <td className="p-3 text-green-600">{report.completed_bookings}</td>
                        <td className="p-3 text-red-600">{report.cancelled_bookings}</td>
                        <td className="p-3 font-medium">{formatCurrency(report.total_earnings)}</td>
                        <td className="p-3">{formatCurrency(report.total_tips)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Dialog */}
        <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filter by Cleaners</DialogTitle>
              <DialogDescription>
                Select specific cleaners to include in the report. Leave empty to include all cleaners.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {allCleaners.map((cleaner) => (
                <label
                  key={cleaner.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={cleanerIds.includes(cleaner.id)}
                    onChange={() => toggleCleaner(cleaner.id)}
                    className="rounded"
                  />
                  <span>{cleaner.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCleanerIds([]);
                }}
              >
                Clear All
              </Button>
              <Button onClick={() => setShowFilterDialog(false)}>Done</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


