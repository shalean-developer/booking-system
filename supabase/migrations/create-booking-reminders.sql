-- Migration: Create Booking Reminders System
-- Purpose: Enable email/SMS reminders for upcoming bookings
-- Date: 2024

-- Create reminder_preferences table
CREATE TABLE IF NOT EXISTS reminder_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  email_24h BOOLEAN DEFAULT true,              -- Reminder 24 hours before
  email_2h BOOLEAN DEFAULT true,                -- Reminder 2 hours before
  sms_24h BOOLEAN DEFAULT false,                -- SMS reminder 24 hours before
  sms_2h BOOLEAN DEFAULT false,                  -- SMS reminder 2 hours before
  phone_number TEXT,                            -- Phone number for SMS (if enabled)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sent_reminders table to track sent reminders (prevent duplicates)
CREATE TABLE IF NOT EXISTS sent_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,                  -- 'email_24h', 'email_2h', 'sms_24h', 'sms_2h'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'sent',          -- 'sent', 'delivered', 'failed'
  error_message TEXT,                           -- Error message if delivery failed
  UNIQUE(booking_id, reminder_type)             -- Prevent duplicate reminders
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reminder_preferences_customer_id ON reminder_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_sent_reminders_booking_id ON sent_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_sent_reminders_customer_id ON sent_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sent_reminders_sent_at ON sent_reminders(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sent_reminders_type ON sent_reminders(reminder_type);

-- Enable Row Level Security
ALTER TABLE reminder_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reminder_preferences
-- Customers can view and update their own preferences
CREATE POLICY "Customers can view their own reminder preferences"
  ON reminder_preferences FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert their own reminder preferences"
  ON reminder_preferences FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own reminder preferences"
  ON reminder_preferences FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- RLS Policies for sent_reminders
-- Customers can view their own sent reminders
CREATE POLICY "Customers can view their own sent reminders"
  ON sent_reminders FOR SELECT
  USING (auth.uid() = customer_id);

-- Function to check if current user is an admin (if not exists)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT role INTO user_role
  FROM customers
  WHERE auth_user_id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins can view all sent reminders (for monitoring)
CREATE POLICY "Admins can view all sent reminders"
  ON sent_reminders FOR SELECT
  USING (is_admin());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reminder_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_reminder_preferences_updated_at
  BEFORE UPDATE ON reminder_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_reminder_preferences_updated_at();

-- Function to get bookings needing reminders
-- This will be used by cron jobs to find bookings that need reminders
CREATE OR REPLACE FUNCTION get_bookings_needing_reminders(
  reminder_hours INTEGER,
  reminder_type TEXT
)
RETURNS TABLE (
  booking_id TEXT,
  customer_id UUID,
  customer_email TEXT,
  customer_phone TEXT,
  booking_date TIMESTAMPTZ,
  booking_time TEXT,
  service_type TEXT,
  address_line1 TEXT,
  address_suburb TEXT,
  address_city TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id AS booking_id,
    b.customer_id,
    c.email AS customer_email,
    rp.phone_number AS customer_phone,
    (b.booking_date::date + b.booking_time::time)::timestamptz AS booking_date,
    b.booking_time,
    b.service_type,
    b.address_line1,
    b.address_suburb,
    b.address_city
  FROM bookings b
  INNER JOIN customers c ON c.id = b.customer_id
  LEFT JOIN reminder_preferences rp ON rp.customer_id = b.customer_id
  LEFT JOIN sent_reminders sr ON sr.booking_id = b.id AND sr.reminder_type = reminder_type
  WHERE 
    b.status NOT IN ('cancelled', 'canceled', 'completed')
    AND (b.booking_date::date + b.booking_time::time)::timestamptz 
        BETWEEN NOW() + (reminder_hours || ' hours')::interval 
        AND NOW() + (reminder_hours || ' hours')::interval + '1 hour'::interval
    AND sr.id IS NULL  -- No reminder sent yet
    AND (
      (reminder_type = 'email_24h' AND COALESCE(rp.email_24h, true) = true AND COALESCE(rp.email_enabled, true) = true)
      OR (reminder_type = 'email_2h' AND COALESCE(rp.email_2h, true) = true AND COALESCE(rp.email_enabled, true) = true)
      OR (reminder_type = 'sms_24h' AND COALESCE(rp.sms_24h, false) = true AND COALESCE(rp.sms_enabled, false) = true)
      OR (reminder_type = 'sms_2h' AND COALESCE(rp.sms_2h, false) = true AND COALESCE(rp.sms_enabled, false) = true)
    );
END;
$$ LANGUAGE plpgsql;

-- Create a view for easier querying of reminder preferences with customer info
CREATE OR REPLACE VIEW reminder_preferences_view AS
SELECT 
  rp.*,
  c.email,
  c.first_name,
  c.last_name,
  c.phone AS customer_phone_number
FROM reminder_preferences rp
INNER JOIN customers c ON c.id = rp.customer_id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON reminder_preferences TO authenticated;
GRANT SELECT ON sent_reminders TO authenticated;
GRANT SELECT ON reminder_preferences_view TO authenticated;

COMMENT ON TABLE reminder_preferences IS 'Stores customer preferences for booking reminders';
COMMENT ON TABLE sent_reminders IS 'Tracks sent reminders to prevent duplicates';
COMMENT ON FUNCTION get_bookings_needing_reminders IS 'Returns bookings that need reminders sent (used by cron jobs)';
