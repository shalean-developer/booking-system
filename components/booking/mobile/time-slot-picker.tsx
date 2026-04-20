'use client';

import { MobileCardSelector, type MobileCardSelectorItem } from '@/components/booking/mobile/mobile-card-selector';

export interface TimeSlotPickerItem {
  id: string;
  label: string;
  caption?: string;
  disabled?: boolean;
  recommended?: boolean;
}

interface TimeSlotPickerProps {
  slots: TimeSlotPickerItem[];
  selectedSlotId: string | null;
  onSelect: (id: string) => void;
}

function slotMinutes(slotId: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(slotId.trim());
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function slotGroup(slotId: string): 'Morning' | 'Afternoon' | 'Evening' {
  const mins = slotMinutes(slotId);
  if (mins < 12 * 60) return 'Morning';
  if (mins < 17 * 60) return 'Afternoon';
  return 'Evening';
}

export function TimeSlotPicker({ slots, selectedSlotId, onSelect }: TimeSlotPickerProps) {
  const grouped = slots.reduce<Record<'Morning' | 'Afternoon' | 'Evening', TimeSlotPickerItem[]>>(
    (acc, slot) => {
      acc[slotGroup(slot.id)].push(slot);
      return acc;
    },
    { Morning: [], Afternoon: [], Evening: [] }
  );

  const groupOrder: Array<'Morning' | 'Afternoon' | 'Evening'> = ['Morning', 'Afternoon', 'Evening'];

  return (
    <div className="space-y-3">
      {groupOrder.map((group) => {
        if (grouped[group].length === 0) return null;
        const items: MobileCardSelectorItem[] = grouped[group].map((slot) => ({
          id: slot.id,
          label: slot.label,
          caption: slot.caption,
          disabled: slot.disabled,
          badge: slot.recommended ? 'Recommended' : undefined,
        }));
        return (
          <div key={group} className="space-y-2">
            <p className="text-xs font-semibold text-gray-500">{group}</p>
            <MobileCardSelector items={items} selectedId={selectedSlotId} onSelect={onSelect} />
          </div>
        );
      })}
    </div>
  );
}
