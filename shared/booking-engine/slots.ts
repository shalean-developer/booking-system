export type TimeSlotDef = { id: string; time: string };

export type SlotAvailabilityRow = {
  id: string;
  time: string;
  available: boolean;
  remaining: number;
};

/**
 * Pure mapping from slot definitions + occupancy `remaining` counts (same semantics as booking UI).
 */
export function getAvailableSlots(input: {
  slotDefs: TimeSlotDef[];
  remainingBySlotId: Record<string, number> | null;
  occupancyStatus: 'idle' | 'loading' | 'success' | 'error';
}): SlotAvailabilityRow[] {
  const { slotDefs, remainingBySlotId, occupancyStatus } = input;
  return slotDefs.map((def) => {
    if (occupancyStatus !== 'success' || !remainingBySlotId) {
      return {
        id: def.id,
        time: def.time,
        available: false,
        remaining: 0,
      };
    }
    const remaining = remainingBySlotId[def.id] ?? 0;
    return {
      id: def.id,
      time: def.time,
      available: remaining > 0,
      remaining,
    };
  });
}
