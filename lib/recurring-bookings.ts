// Utility functions for recurring bookings and date calculations

import { RecurringSchedule, Frequency } from '@/types/recurring';

/**
 * Calculate all booking dates for a given month based on recurring schedule
 */
export function calculateBookingDatesForMonth(
  schedule: RecurringSchedule,
  year: number,
  month: number
): Date[] {
  const dates: Date[] = [];
  const startDate = new Date(year, month - 1, 1); // First day of month
  const endDate = new Date(year, month, 0); // Last day of month

  switch (schedule.frequency) {
    case 'weekly':
      dates.push(...calculateWeeklyDates(schedule, startDate, endDate));
      break;
    case 'bi-weekly':
      dates.push(...calculateBiWeeklyDates(schedule, startDate, endDate));
      break;
    case 'monthly':
      dates.push(...calculateMonthlyDates(schedule, startDate, endDate));
      break;
    case 'custom-weekly':
      dates.push(...calculateCustomWeeklyDates(schedule, startDate, endDate));
      break;
    case 'custom-bi-weekly':
      dates.push(...calculateCustomBiWeeklyDates(schedule, startDate, endDate));
      break;
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Calculate weekly booking dates
 */
function calculateWeeklyDates(
  schedule: RecurringSchedule,
  startDate: Date,
  endDate: Date
): Date[] {
  if (schedule.day_of_week === undefined) return [];

  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  // Find first occurrence of the target day in the month
  while (currentDate <= endDate) {
    if (currentDate.getDay() === schedule.day_of_week) {
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * Calculate bi-weekly booking dates
 */
function calculateBiWeeklyDates(
  schedule: RecurringSchedule,
  startDate: Date,
  endDate: Date
): Date[] {
  if (schedule.day_of_week === undefined) return [];

  const dates: Date[] = [];
  const scheduleStartDate = new Date(schedule.start_date);
  
  // Find the first occurrence of the target day after schedule start
  const firstOccurrence = new Date(scheduleStartDate);
  while (firstOccurrence.getDay() !== schedule.day_of_week) {
    firstOccurrence.setDate(firstOccurrence.getDate() + 1);
  }

  // Calculate dates every 14 days from first occurrence
  const currentDate = new Date(firstOccurrence);
  while (currentDate <= endDate) {
    if (currentDate >= startDate) {
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 14);
  }

  return dates;
}

/**
 * Calculate monthly booking dates
 */
function calculateMonthlyDates(
  schedule: RecurringSchedule,
  startDate: Date,
  endDate: Date
): Date[] {
  if (schedule.day_of_month === undefined) return [];

  const dates: Date[] = [];
  const dayOfMonth = schedule.day_of_month;
  
  // Get the last day of the target month
  const lastDayOfMonth = endDate.getDate();
  
  // Use the requested day, or the last day of month if it doesn't exist
  const actualDay = Math.min(dayOfMonth, lastDayOfMonth);
  
  const bookingDate = new Date(startDate.getFullYear(), startDate.getMonth(), actualDay);
  
  if (bookingDate >= startDate && bookingDate <= endDate) {
    dates.push(bookingDate);
  }

  return dates;
}

/**
 * Calculate custom weekly booking dates (multiple days per week)
 */
function calculateCustomWeeklyDates(
  schedule: RecurringSchedule,
  startDate: Date,
  endDate: Date
): Date[] {
  if (!schedule.days_of_week || schedule.days_of_week.length === 0) return [];

  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  // Find all occurrences of each selected day in the month
  while (currentDate <= endDate) {
    if (schedule.days_of_week.includes(currentDate.getDay())) {
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * Calculate custom bi-weekly booking dates (multiple days every other week)
 */
function calculateCustomBiWeeklyDates(
  schedule: RecurringSchedule,
  startDate: Date,
  endDate: Date
): Date[] {
  if (!schedule.days_of_week || schedule.days_of_week.length === 0) return [];

  const dates: Date[] = [];
  const scheduleStartDate = new Date(schedule.start_date);
  
  // For each selected day, calculate bi-weekly occurrences
  for (const dayOfWeek of schedule.days_of_week) {
    // Find the first occurrence of this day after schedule start
    const firstOccurrence = new Date(scheduleStartDate);
    while (firstOccurrence.getDay() !== dayOfWeek) {
      firstOccurrence.setDate(firstOccurrence.getDate() + 1);
    }

    // Calculate dates every 14 days from first occurrence
    const currentDate = new Date(firstOccurrence);
    while (currentDate <= endDate) {
      if (currentDate >= startDate) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 14);
    }
  }

  return dates;
}

/**
 * Get the next booking date for a recurring schedule
 */
export function getNextBookingDate(schedule: RecurringSchedule): Date | null {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // Check current month
  let dates = calculateBookingDatesForMonth(schedule, currentYear, currentMonth);
  let nextDate = dates.find(date => date >= today);

  if (nextDate) return nextDate;

  // Check next month
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  
  dates = calculateBookingDatesForMonth(schedule, nextYear, nextMonth);
  return dates.length > 0 ? dates[0] : null;
}

/**
 * Validate a recurring schedule
 */
export function validateRecurringSchedule(schedule: Partial<RecurringSchedule>): string[] {
  const errors: string[] = [];

  if (!schedule.customer_id) {
    errors.push('Customer is required');
  }

  if (!schedule.service_type) {
    errors.push('Service type is required');
  }

  if (!schedule.frequency) {
    errors.push('Frequency is required');
  }

  if (!schedule.preferred_time) {
    errors.push('Preferred time is required');
  }

  if (!schedule.bedrooms || schedule.bedrooms < 1) {
    errors.push('Number of bedrooms must be at least 1');
  }

  if (!schedule.bathrooms || schedule.bathrooms < 1) {
    errors.push('Number of bathrooms must be at least 1');
  }

  if (!schedule.address_line1) {
    errors.push('Address is required');
  }

  if (!schedule.address_suburb) {
    errors.push('Suburb is required');
  }

  if (!schedule.address_city) {
    errors.push('City is required');
  }

  if (!schedule.start_date) {
    errors.push('Start date is required');
  }

  // Validate frequency-specific fields
  if (schedule.frequency === 'weekly' || schedule.frequency === 'bi-weekly') {
    if (schedule.day_of_week === undefined || schedule.day_of_week < 0 || schedule.day_of_week > 6) {
      errors.push('Day of week is required for weekly/bi-weekly schedules');
    }
  }

  if (schedule.frequency === 'monthly') {
    if (schedule.day_of_month === undefined || schedule.day_of_month < 1 || schedule.day_of_month > 31) {
      errors.push('Day of month is required for monthly schedules');
    }
  }

  if (schedule.frequency === 'custom-weekly' || schedule.frequency === 'custom-bi-weekly') {
    if (!schedule.days_of_week || schedule.days_of_week.length === 0) {
      errors.push('At least one day must be selected for custom frequency');
    }
    if (schedule.days_of_week && schedule.days_of_week.some(d => d < 0 || d > 6)) {
      errors.push('Invalid day of week selected');
    }
  }

  // Validate end date is after start date
  if (schedule.start_date && schedule.end_date) {
    const startDate = new Date(schedule.start_date);
    const endDate = new Date(schedule.end_date);
    if (endDate <= startDate) {
      errors.push('End date must be after start date');
    }
  }

  return errors;
}

/**
 * Format a date for display
 */
export function formatBookingDate(date: Date): string {
  return date.toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatBookingTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Generate booking ID
 */
export function generateBookingId(): string {
  return `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a date conflicts with existing bookings
 */
export function checkBookingConflict(
  customerId: string,
  bookingDate: Date,
  bookingTime: string,
  excludeBookingId?: string
): boolean {
  // This would typically make an API call to check for conflicts
  // For now, return false (no conflict)
  return false;
}

/**
 * Get the month/year string in YYYY-MM format
 */
export function getMonthYearString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Parse month/year string from YYYY-MM format
 */
export function parseMonthYearString(monthYear: string): { year: number; month: number } {
  const [year, month] = monthYear.split('-').map(Number);
  return { year, month };
}

/**
 * Get next month/year
 */
export function getNextMonth(currentMonthYear: string): string {
  const { year, month } = parseMonthYearString(currentMonthYear);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
}

/**
 * Get the next month that needs booking generation for a recurring schedule
 * Returns the month/year string (YYYY-MM) that should be generated next
 */
export function getNextGeneratingMonth(schedule: RecurringSchedule): string {
  const today = new Date();
  const currentMonthYear = getMonthYearString(today);
  
  // If never generated, generate current month
  if (!schedule.last_generated_month) {
    return currentMonthYear;
  }
  
  // If last generated is before current month, generate current month
  if (schedule.last_generated_month < currentMonthYear) {
    return currentMonthYear;
  }
  
  // Otherwise, generate next month
  return getNextMonth(schedule.last_generated_month);
}

/**
 * Get the next generating date (first day of next month to generate)
 */
export function getNextGeneratingDate(schedule: RecurringSchedule): Date {
  const nextMonthYear = getNextGeneratingMonth(schedule);
  const { year, month } = parseMonthYearString(nextMonthYear);
  return new Date(year, month - 1, 1); // First day of the month
}

/**
 * Format next generating date for display
 */
export function formatNextGeneratingDate(schedule: RecurringSchedule): string {
  const nextDate = getNextGeneratingDate(schedule);
  return nextDate.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get previous month/year
 */
export function getPreviousMonth(currentMonthYear: string): string {
  const { year, month } = parseMonthYearString(currentMonthYear);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
}
