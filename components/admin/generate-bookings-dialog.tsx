'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  Clock,
  User
} from 'lucide-react';
import { RecurringScheduleWithCustomer } from '@/types/recurring';

interface GenerateBookingsDialogProps {
  schedule?: RecurringScheduleWithCustomer;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GenerateBookingsDialog({ 
  schedule, 
  open, 
  onClose, 
  onSuccess 
}: GenerateBookingsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
  // Get current month/year as default
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const url = schedule 
        ? `/api/admin/recurring-schedules/${schedule.id}/generate`
        : '/api/admin/recurring-schedules/generate-all';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month, year }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to generate bookings');
      }

      setResult(data);
      onSuccess();

    } catch (err) {
      console.error('Error generating bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthName = (monthNum: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNum - 1];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {schedule ? 'Generate Bookings' : 'Generate All Bookings'}
          </DialogTitle>
          <DialogDescription>
            {schedule 
              ? `Generate bookings for ${schedule.customer.first_name} ${schedule.customer.last_name}'s recurring schedule`
              : 'Generate bookings for all active recurring schedules'
            }
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Success!</span>
            </div>
            <div className="text-green-700 text-sm mt-2">
              <p>{result.message}</p>
              {result.bookings_created > 0 && (
                <p className="mt-1">
                  Created {result.bookings_created} booking{result.bookings_created !== 1 ? 's' : ''}
                </p>
              )}
              {result.conflicting_dates > 0 && (
                <p className="mt-1 text-orange-600">
                  Skipped {result.conflicting_dates} conflicting date{result.conflicting_dates !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {!result && (
          <div className="space-y-4">
            {/* Schedule Info (if single schedule) */}
            {schedule && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Schedule Details</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{schedule.customer.first_name} {schedule.customer.last_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {schedule.frequency === 'monthly' 
                        ? `Day ${schedule.day_of_month} at ${schedule.preferred_time}`
                        : `Every ${schedule.frequency === 'weekly' ? '' : 'other '}${schedule.day_of_week === 0 ? 'Sunday' : 
                           schedule.day_of_week === 1 ? 'Monday' :
                           schedule.day_of_week === 2 ? 'Tuesday' :
                           schedule.day_of_week === 3 ? 'Wednesday' :
                           schedule.day_of_week === 4 ? 'Thursday' :
                           schedule.day_of_week === 5 ? 'Friday' : 'Saturday'} at ${schedule.preferred_time}`
                      }
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Last generated: {schedule.last_generated_month || 'Never'}
                  </div>
                </div>
              </div>
            )}

            {/* Month/Year Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  min="2024"
                  max="2030"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value) || 2024)}
                />
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Generate bookings for <strong>{getMonthName(month)} {year}</strong>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Generate Bookings
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
