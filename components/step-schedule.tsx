'use client';

import { useBooking } from '@/lib/useBooking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { generateTimeSlots } from '@/lib/pricing';

const timeSlots = generateTimeSlots();

export function StepSchedule() {
  const { state, updateField, next, back } = useBooking();

  const selectedDate = state.date ? new Date(state.date) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      updateField('date', format(date, 'yyyy-MM-dd'));
    }
  };

  const handleTimeSelect = (time: string) => {
    updateField('time', time);
  };

  const canProceed = state.date !== null && state.time !== null;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Choose Your Schedule</CardTitle>
        <CardDescription>Select a date and time that works for you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Picker */}
        <div className="space-y-2">
          <Label>Preferred Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Slots */}
        <div className="space-y-2">
          <Label>Preferred Time</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {timeSlots.map((time) => {
              const isSelected = state.time === time;
              return (
                <Button
                  key={time}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'font-mono text-sm',
                    isSelected && 'shadow-md'
                  )}
                  onClick={() => handleTimeSelect(time)}
                >
                  {time}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        {state.date && state.time && (
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              <strong>Scheduled for:</strong>{' '}
              {format(selectedDate!, 'EEEE, MMMM d, yyyy')} at {state.time}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={back} size="lg">
            Back
          </Button>
          <Button onClick={next} disabled={!canProceed} size="lg">
            Next: Contact Info
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

