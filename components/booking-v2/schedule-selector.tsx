'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateTimeSlots } from '@/lib/pricing';
import { format, startOfToday, addDays, parseISO } from 'date-fns';

interface ScheduleSelectorProps {
  date: string | null;
  time: string | null;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}

export function ScheduleSelector({
  date,
  time,
  onDateChange,
  onTimeChange,
}: ScheduleSelectorProps) {
  // Generate date options (90 days)
  const dateOptions = useMemo(() => {
    const today = startOfToday();
    const options: { value: string; label: string }[] = [];
    
    for (let i = 0; i < 90; i++) {
      const date = addDays(today, i);
      const dateValue = format(date, 'yyyy-MM-dd');
      
      let label: string;
      if (i === 0) {
        label = 'Today';
      } else if (i === 1) {
        label = 'Tomorrow';
      } else if (i === 2) {
        label = 'Day after tomorrow';
      } else {
        label = format(date, 'MMM d, yyyy');
      }
      
      options.push({ value: dateValue, label });
    }
    
    return options;
  }, []);

  // Generate time options with filtering
  const timeOptions = useMemo(() => {
    const allSlots = generateTimeSlots();
    const selectedDate = date ? format(parseISO(date), 'yyyy-MM-dd') : null;
    const today = format(startOfToday(), 'yyyy-MM-dd');
    
    // Filter past times only if today is selected
    if (selectedDate === today) {
      const now = new Date();
      return allSlots.filter((time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(hours, minutes, 0, 0);
        return slotTime >= now;
      });
    }
    
    return allSlots;
  }, [date]);

  return (
    <section className="space-y-4" aria-labelledby="schedule-selection">
      <h3 id="schedule-selection" className="text-base font-semibold text-gray-900">
        Schedule
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date-select" className="text-sm font-semibold text-gray-900">
            Which day would you like us to come?
          </Label>
          <Select value={date || ''} onValueChange={onDateChange}>
            <SelectTrigger id="date-select" className="h-11">
              <SelectValue placeholder="Select a date" />
            </SelectTrigger>
            <SelectContent>
              {dateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time-select" className="text-sm font-semibold text-gray-900">
            What time would you like us to arrive?
          </Label>
          <Select 
            value={time || ''} 
            onValueChange={onTimeChange}
            disabled={!date}
          >
            <SelectTrigger id="time-select" className="h-11">
              <SelectValue placeholder={date ? "Select a time" : "Select date first"} />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.length > 0 ? (
                timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1.5 text-sm text-gray-500 text-center">
                  No available times for selected date
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}

