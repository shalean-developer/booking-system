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
  compact?: boolean;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon', fullLabel: 'Monday', prop: 'available_monday' },
  { key: 'tuesday', label: 'Tue', fullLabel: 'Tuesday', prop: 'available_tuesday' },
  { key: 'wednesday', label: 'Wed', fullLabel: 'Wednesday', prop: 'available_wednesday' },
  { key: 'thursday', label: 'Thu', fullLabel: 'Thursday', prop: 'available_thursday' },
  { key: 'friday', label: 'Fri', fullLabel: 'Friday', prop: 'available_friday' },
  { key: 'saturday', label: 'Sat', fullLabel: 'Saturday', prop: 'available_saturday' },
  { key: 'sunday', label: 'Sun', fullLabel: 'Sunday', prop: 'available_sunday' },
];

export function DayAvailabilityDisplay({ schedule, compact = false }: DayAvailabilityDisplayProps) {
  return (
    <div className={compact ? 'flex flex-wrap gap-2' : 'grid grid-cols-7 gap-2'}>
      {DAYS_OF_WEEK.map((day) => {
        const isAvailable = schedule[day.prop as keyof typeof schedule] === true;
        
        return (
          <div
            key={day.key}
            className={`
              flex items-center justify-center rounded-md text-sm font-medium transition-all
              ${compact 
                ? 'px-2 py-1 min-w-[3rem]' 
                : 'px-3 py-2'
              }
              ${isAvailable
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
              }
            `}
            title={compact ? `${day.fullLabel}: ${isAvailable ? 'Available' : 'Not Available'}` : undefined}
          >
            {day.label}
          </div>
        );
      })}
    </div>
  );
}




























































