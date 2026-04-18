-- Job length for dispatch: overlap detection and expected_end_time alignment
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

COMMENT ON COLUMN bookings.duration_minutes IS 'Computed job length in minutes (bedrooms/bathrooms/extras); used for cleaner overlap and expected_end_time.';
