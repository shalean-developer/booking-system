-- ============================================
-- ADD EXPECTED END TIME TO BOOKINGS
-- ============================================
-- Optional customer-provided "finish by" time (HH:MM).
-- Used to show "Expected working hours: 7:00 – 11:00" in dashboard
-- until actual cleaner_started_at / cleaner_completed_at are set.
-- ============================================

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS expected_end_time TEXT;

COMMENT ON COLUMN bookings.expected_end_time IS 'Expected end time in HH:MM format (customer optional in booking form)';
