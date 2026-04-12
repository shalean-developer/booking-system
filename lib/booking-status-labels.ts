/** Maps DB booking.status values to customer-facing labels (no mock data). */
export function getBookingPipelineLabel(status: string | null | undefined): string {
  const s = (status || '').toLowerCase().trim();
  switch (s) {
    case 'pending':
      return 'Pending';
    case 'paid':
      return 'Paid — awaiting assignment';
    case 'confirmed':
      return 'Confirmed';
    case 'accepted':
      return 'Cleaner accepted';
    case 'on_my_way':
      return 'On the way';
    case 'in-progress':
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
    case 'canceled':
      return 'Cancelled';
    case 'declined':
      return 'Declined';
    case 'reschedule_requested':
      return 'Reschedule requested';
    default:
      return s ? s.replace(/_/g, ' ') : 'Scheduled';
  }
}
