-- ============================================
-- CREATE NOTIFICATION LOGS TABLE
-- ============================================
-- Stores success/failure of outbound notifications for admin review
-- ============================================

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  channel TEXT NOT NULL,                        -- 'whatsapp', 'email', etc.
  template TEXT,                                -- template name / subject
  recipient_type TEXT,                          -- 'cleaner', 'customer', 'admin'
  recipient_phone TEXT,
  recipient_email TEXT,
  booking_id TEXT,
  payload JSONB,                                -- parameters sent
  ok BOOLEAN NOT NULL DEFAULT FALSE,
  status INTEGER,                               -- HTTP status or provider status
  error TEXT
);

COMMENT ON TABLE notification_logs IS 'Operational log of outbound notifications.';

-- RLS disabled; admin reads via service role
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_booking ON notification_logs (booking_id);


