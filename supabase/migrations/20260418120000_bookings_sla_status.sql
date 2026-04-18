-- SLA tracking + one-time notification guards (admin + customer delay)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS sla_status TEXT DEFAULT 'ok';

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS sla_delay_customer_notified_at TIMESTAMPTZ;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS sla_admin_notified_at TIMESTAMPTZ;

COMMENT ON COLUMN bookings.sla_status IS 'ok | warning — workflow delay detected';
COMMENT ON COLUMN bookings.sla_delay_customer_notified_at IS 'Set when customer delay email sent (once per booking)';
COMMENT ON COLUMN bookings.sla_admin_notified_at IS 'Set when admin SLA alert email sent (once per booking)';
