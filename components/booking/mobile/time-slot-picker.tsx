'use client';

import { MobileCardSelector, type MobileCardSelectorItem } from '@/components/booking/mobile/mobile-card-selector';

export interface TimeSlotPickerItem {
  id: string;
  label: string;
  caption?: string;
  disabled?: boolean;
  recommended?: boolean;
  /** Whole percent above base when surge applies (shown on card). */
  surgePercent?: number;
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
    <div className="space-y-5">
      {groupOrder.map((group) => {
        if (grouped[group].length === 0) return null;
        const items: MobileCardSelectorItem[] = grouped[group].map((slot) => ({
          id: slot.id,
          label: slot.label,
          caption: slot.caption,
          disabled: slot.disabled,
          badge: slot.recommended ? 'Recommended' : undefined,
          surgePercent: slot.surgePercent,
        }));
        return (
          <div key={group} className="space-y-2.5">
            <h3 className="sticky top-0 z-[1] border-b border-border/60 bg-card/95 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
              {group}
            </h3>
            <MobileCardSelector items={items} selectedId={selectedSlotId} onSelect={onSelect} />
          </div>
        );
      })}
    </div>
  );
}
