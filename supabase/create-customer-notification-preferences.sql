-- ============================================
-- CREATE CUSTOMER NOTIFICATION PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS customer_notification_preferences (
  customer_id UUID PRIMARY KEY REFERENCES public.customers(id) ON DELETE CASCADE,
  email_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE customer_notification_preferences IS 'Customer opt-in preferences for notifications.';

ALTER TABLE customer_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Customers (auth) can view/update their own, admins via service role
DROP POLICY IF EXISTS "Customers can view their own prefs" ON customer_notification_preferences;
CREATE POLICY "Customers can view their own prefs"
  ON customer_notification_preferences
  FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can update their own prefs" ON customer_notification_preferences;
CREATE POLICY "Customers can update their own prefs"
  ON customer_notification_preferences
  FOR UPDATE
  USING (auth.uid() = customer_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_customer_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_customer_notification_prefs_updated_at ON customer_notification_preferences;
CREATE TRIGGER set_customer_notification_prefs_updated_at
  BEFORE UPDATE ON customer_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_notification_prefs_updated_at();


