'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface DayScheduleEditorProps {
  cleaner: {
    id: string;
    name: string;
    available_monday?: boolean;
    available_tuesday?: boolean;
    available_wednesday?: boolean;
    available_thursday?: boolean;
    available_friday?: boolean;
    available_saturday?: boolean;
    available_sunday?: boolean;
  };
  onUpdate?: () => void;
}

const DAYS = [
  { key: 'monday', label: 'Mon', fullName: 'Monday' },
  { key: 'tuesday', label: 'Tue', fullName: 'Tuesday' },
  { key: 'wednesday', label: 'Wed', fullName: 'Wednesday' },
  { key: 'thursday', label: 'Thu', fullName: 'Thursday' },
  { key: 'friday', label: 'Fri', fullName: 'Friday' },
  { key: 'saturday', label: 'Sat', fullName: 'Saturday' },
  { key: 'sunday', label: 'Sun', fullName: 'Sunday' },
];

export function DayScheduleEditor({ cleaner, onUpdate }: DayScheduleEditorProps) {
  const [schedule, setSchedule] = useState({
    monday: cleaner.available_monday ?? true,
    tuesday: cleaner.available_tuesday ?? true,
    wednesday: cleaner.available_wednesday ?? true,
    thursday: cleaner.available_thursday ?? true,
    friday: cleaner.available_friday ?? true,
    saturday: cleaner.available_saturday ?? true,
    sunday: cleaner.available_sunday ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleDay = (day: string) => {
    setSchedule(prev => ({ ...prev, [day]: !prev[day as keyof typeof prev] }));
  };

  const handleSelectAll = () => {
    const allTrue = DAYS.every(day => schedule[day.key as keyof typeof schedule]);
    const newSchedule = {} as typeof schedule;
    DAYS.forEach(day => {
      newSchedule[day.key as keyof typeof schedule] = !allTrue;
    });
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    // Validate at least one day is selected
    const hasAtLeastOneDay = Object.values(schedule).some(day => day === true);
    if (!hasAtLeastOneDay) {
      toast.error('At least one day must be selected');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/cleaners/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cleanerId: cleaner.id,
          schedule
        }),
      });

      const data = await response.json();
      
      if (data.ok) {
        toast.success('Schedule updated successfully');
        onUpdate?.();
      } else {
        toast.error(data.error || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('An error occurred while updating schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const activeDaysCount = Object.values(schedule).filter(day => day === true).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <Label className="text-sm font-semibold">Working Days</Label>
        </div>
        <div className="text-xs text-gray-500">
          {activeDaysCount} of 7 days selected
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {DAYS.map(day => {
          const isActive = schedule[day.key as keyof typeof schedule];
          return (
            <div key={day.key} className="flex flex-col items-center gap-2">
              <Label 
                htmlFor={`day-${day.key}`}
                className={`text-xs font-medium cursor-pointer ${
                  isActive ? 'text-primary' : 'text-gray-400'
                }`}
              >
                {day.label}
              </Label>
              <Checkbox
                id={`day-${day.key}`}
                checked={isActive}
                onCheckedChange={() => handleToggleDay(day.key)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={handleSelectAll} 
          variant="outline"
          size="sm"
          className="flex-1"
          type="button"
        >
          {activeDaysCount === 7 ? 'Deselect All' : 'Select All'}
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || activeDaysCount === 0}
          size="sm"
          className="flex-1"
          type="button"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Schedule
        </Button>
      </div>

      {activeDaysCount === 0 && (
        <p className="text-xs text-red-500 text-center">
          At least one day must be selected
        </p>
      )}
    </div>
  );
}

