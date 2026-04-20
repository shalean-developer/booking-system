/**
 * Heuristic date badges for booking UI (max one per day).
 * Server-side booking counts per future day are not loaded on the client;
 * these rules approximate scarcity/popularity for conversion.
 */

const TODAY = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export type DateDemandBadge = {
  label: string;
  variant: 'amber' | 'violet' | 'emerald';
};

/** At most one badge: today urgency > weekend popularity > midweek calm. */
export function getDateDemandBadge(cellDate: Date): DateDemandBadge | null {
  const today = TODAY();
  if (isSameDay(cellDate, today)) {
    return { label: 'Filling fast', variant: 'amber' };
  }
  const dow = cellDate.getDay();
  if (dow === 0 || dow === 6) {
    return { label: 'Popular', variant: 'violet' };
  }
  if (dow === 2 || dow === 3) {
    return { label: 'Best slots', variant: 'emerald' };
  }
  return null;
}
