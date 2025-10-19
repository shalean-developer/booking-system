'use client';

import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface DayAvailabilityDisplayProps {
  schedule: {
    available_monday?: boolean;
    available_tuesday?: boolean;
    available_wednesday?: boolean;
    available_thursday?: boolean;
    available_friday?: boolean;
    available_saturday?: boolean;
    available_sunday?: boolean;
  };
  compact?: boolean; // For table view
}

const DAYS = [
  { key: 'monday', label: 'M', fullName: 'Monday' },
  { key: 'tuesday', label: 'T', fullName: 'Tuesday' },
  { key: 'wednesday', label: 'W', fullName: 'Wednesday' },
  { key: 'thursday', label: 'T', fullName: 'Thursday' },
  { key: 'friday', label: 'F', fullName: 'Friday' },
  { key: 'saturday', label: 'S', fullName: 'Saturday' },
  { key: 'sunday', label: 'S', fullName: 'Sunday' },
];

export function DayAvailabilityDisplay({ schedule, compact = false }: DayAvailabilityDisplayProps) {
  return (
    <div className="flex items-center gap-1">
      {compact && <Calendar className="h-3 w-3 text-gray-400 mr-1" />}
      {DAYS.map((day) => {
        const isAvailable = schedule[`available_${day.key}` as keyof typeof schedule] ?? true;
        
        return (
          <Badge
            key={day.key}
            variant={isAvailable ? 'default' : 'secondary'}
            className={`
              text-[10px] px-1.5 py-0.5 font-medium
              ${isAvailable 
                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100' 
                : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-100'
              }
            `}
            title={`${day.fullName}: ${isAvailable ? 'Available' : 'Not available'}`}
          >
            {day.label}
          </Badge>
        );
      })}
    </div>
  );
}

