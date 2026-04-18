import type {
  Booking,
  BookingStatus,
  DatabaseBooking,
  DatabaseEarnings,
  EarningsRecord,
  ScheduleEvent,
} from './cleanerTypes';

export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) return 'Today';
    if (compareDate.getTime() === yesterday.getTime()) return 'Yesterday';

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  } catch {
    return timeStr;
  }
};

export const formatTimeRange = (timeStr: string): string => {
  const formatted = formatTime(timeStr);
  const hour = parseInt(timeStr.split(':')[0], 10);
  const endHour = (hour + 2) % 24;
  const endTime = `${endHour.toString().padStart(2, '0')}:${timeStr.split(':')[1]}`;
  const endFormatted = formatTime(endTime);
  return `${formatted} - ${endFormatted}`;
};

const combineAddress = (line1?: string, suburb?: string, city?: string): string => {
  const parts = [line1, suburb, city].filter(Boolean);
  return parts.join(', ') || 'Address not provided';
};

const mapStatus = (dbStatus: string): BookingStatus => {
  const upcomingStatuses = [
    'pending',
    'paid',
    'assigned',
    'accepted',
    'on_my_way',
    'in-progress',
  ];
  if (upcomingStatuses.includes(dbStatus)) return 'upcoming';
  if (dbStatus === 'completed') return 'completed';
  return 'cancelled';
};

export const transformBooking = (db: DatabaseBooking, estimateEarnings = true): Booking => {
  const serviceTypeLower = (db.service_type || '').toLowerCase();
  const isFixedRateService =
    serviceTypeLower.includes('deep') ||
    serviceTypeLower.includes('move') ||
    serviceTypeLower.includes('carpet');

  let earnings: number;

  if (isFixedRateService) {
    earnings = 250;
  } else if (!estimateEarnings && db.cleaner_earnings) {
    earnings = db.cleaner_earnings / 100;
  } else {
    earnings = db.total_amount ? (db.total_amount / 100) * 0.7 : 0;
  }

  return {
    id: db.id,
    clientName: db.customer_name || 'Unknown Client',
    address: combineAddress(db.address_line1, db.address_suburb, db.address_city),
    time: formatTimeRange(db.booking_time),
    date: formatDate(db.booking_date),
    status: mapStatus(db.status),
    earnings,
    serviceType: db.service_type || 'Standard Cleaning',
  };
};

export const transformScheduleEvent = (db: DatabaseBooking): ScheduleEvent => ({
  id: db.id,
  date: db.booking_date,
  time: db.booking_time,
  clientName: db.customer_name || 'Unknown Client',
  address:
    combineAddress(db.address_line1, db.address_suburb, db.address_city) || 'Address not provided',
  duration: '2h',
});

export const transformEarnings = (db: DatabaseEarnings): EarningsRecord => {
  const totalEarnings = (db.cleaner_earnings || 0) / 100;
  return {
    id: db.id,
    date: formatDate(db.booking_date),
    booking_date: db.booking_date,
    clientName: db.customer_name || 'Unknown Client',
    amount: totalEarnings,
    status: 'paid',
  };
};
