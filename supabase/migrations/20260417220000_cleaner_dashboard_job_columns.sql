-- Cleaner dashboard: assignment mirror + time aliases (see also cleaner_id, booking_time, expected_end_time)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_cleaner_id UUID REFERENCES cleaners(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_time TEXT;

COMMENT ON COLUMN bookings.assigned_cleaner_id IS 'Mirror of cleaner_id when UUID; used for reporting and dashboards.';
COMMENT ON COLUMN bookings.start_time IS 'Job start (HH:MM); mirrors booking_time when set.';
COMMENT ON COLUMN bookings.end_time IS 'Expected end (HH:MM); mirrors expected_end_time when set.';

UPDATE bookings
SET start_time = booking_time::text
WHERE start_time IS NULL AND booking_time IS NOT NULL;

UPDATE bookings
SET end_time = expected_end_time
WHERE end_time IS NULL AND expected_end_time IS NOT NULL;

UPDATE bookings
SET assigned_cleaner_id = cleaner_id::uuid
WHERE assigned_cleaner_id IS NULL
  AND cleaner_id IS NOT NULL
  AND cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

CREATE INDEX IF NOT EXISTS idx_bookings_assigned_cleaner_date ON bookings(assigned_cleaner_id, booking_date);
