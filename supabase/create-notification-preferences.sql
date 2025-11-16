-- ============================================
-- CREATE NOTIFICATION PREFERENCES TABLE
-- ============================================
-- Stores cleaner opt-in preferences for WhatsApp and Email
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  cleaner_id UUID PRIMARY KEY REFERENCES public.cleaners(id) ON DELETE CASCADE,
  email_opt_in BOOLEAN NOT NULL DEFAULT false,
  whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false,
  email TEXT,
  phone TEXT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE notification_preferences IS 'Cleaner notification channel opt-ins and contact details.';

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies: cleaners can manage their own preferences
DROP POLICY IF EXISTS "Cleaners can view their own notification preferences" ON notification_preferences;
CREATE POLICY "Cleaners can view their own notification preferences"
  ON notification_preferences
  FOR SELECT
  USING (cleaner_id = auth.uid());

DROP POLICY IF EXISTS "Cleaners can update their own notification preferences" ON notification_preferences;
CREATE POLICY "Cleaners can update their own notification preferences"
  ON notification_preferences
  FOR UPDATE
  USING (cleaner_id = auth.uid());

DROP POLICY IF EXISTS "Cleaners can insert their own notification preferences" ON notification_preferences;
CREATE POLICY "Cleaners can insert their own notification preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (COALESCE(cleaner_id, auth.uid()) = auth.uid());

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER set_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();


