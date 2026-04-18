ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS sla_severity TEXT DEFAULT 'normal';

COMMENT ON COLUMN bookings.sla_severity IS 'normal | critical — escalated when auto-reassign exhausted';
