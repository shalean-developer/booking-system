-- Secure public booking management links (reschedule / cancel via email)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS manage_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_manage_token ON bookings (manage_token)
  WHERE manage_token IS NOT NULL;

COMMENT ON COLUMN bookings.manage_token IS
  'Opaque secret for /booking/manage?token=… — never expose internal booking UUID in customer URLs.';
