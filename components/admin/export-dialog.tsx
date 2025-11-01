'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileText, TrendingUp, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [exportType, setExportType] = useState<string>('bookings');
  const [dateRange, setDateRange] = useState<string>('30');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let url = '';
      
      switch (exportType) {
        case 'bookings':
          url = `/api/admin/bookings/export?days=${dateRange}`;
          break;
        case 'revenue':
          url = `/api/admin/stats/report?format=csv&days=${dateRange}`;
          break;
        case 'cleaners':
          url = `/api/admin/cleaners/export?format=csv`;
          break;
        default:
          return;
      }

      window.open(url, '_blank');
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Select the type of data you want to export and the date range.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Type</label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bookings">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Bookings
                  </div>
                </SelectItem>
                <SelectItem value="revenue">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Revenue Report
                  </div>
                </SelectItem>
                <SelectItem value="cleaners">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Cleaners
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportType !== 'cleaners' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="180">Last 6 Months</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
