ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reassigned_at TIMESTAMPTZ;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reassignment_count INT DEFAULT 0;

COMMENT ON COLUMN bookings.reassigned_at IS 'Last automatic cleaner reassignment (SLA)';
COMMENT ON COLUMN bookings.reassignment_count IS 'Number of automatic reassignments (capped in app)';
