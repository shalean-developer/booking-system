-- Generic lifecycle timestamp aliases (kept in sync with cleaner_* in API)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS on_my_way_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

UPDATE bookings
SET accepted_at = cleaner_accepted_at
WHERE accepted_at IS NULL AND cleaner_accepted_at IS NOT NULL;

UPDATE bookings
SET on_my_way_at = cleaner_on_my_way_at
WHERE on_my_way_at IS NULL AND cleaner_on_my_way_at IS NOT NULL;

UPDATE bookings
SET started_at = cleaner_started_at
WHERE started_at IS NULL AND cleaner_started_at IS NOT NULL;

UPDATE bookings
SET completed_at = cleaner_completed_at
WHERE completed_at IS NULL AND cleaner_completed_at IS NOT NULL;
