-- Add new timestamp columns for workflow tracking
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cleaner_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cleaner_on_my_way_at TIMESTAMPTZ;

-- Add helpful comments
COMMENT ON COLUMN bookings.cleaner_accepted_at IS 'Timestamp when cleaner accepted the booking';
COMMENT ON COLUMN bookings.cleaner_on_my_way_at IS 'Timestamp when cleaner marked themselves as on the way';
