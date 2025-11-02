-- Company Settings Table
-- Stores company information and business hours

CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Shalean Cleaning Services',
  contact_email TEXT NOT NULL DEFAULT 'info@shalean.com',
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  business_hours JSONB DEFAULT '[
    {"day": "Monday", "open": "08:00", "close": "17:00", "isOpen": true},
    {"day": "Tuesday", "open": "08:00", "close": "17:00", "isOpen": true},
    {"day": "Wednesday", "open": "08:00", "close": "17:00", "isOpen": true},
    {"day": "Thursday", "open": "08:00", "close": "17:00", "isOpen": true},
    {"day": "Friday", "open": "08:00", "close": "17:00", "isOpen": true},
    {"day": "Saturday", "open": "09:00", "close": "13:00", "isOpen": true},
    {"day": "Sunday", "open": "09:00", "close": "13:00", "isOpen": false}
  ]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only allow one row (singleton pattern)
CREATE UNIQUE INDEX IF NOT EXISTS company_settings_singleton ON company_settings ((company_name IS NOT NULL));

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admin can view company settings" ON company_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.role = 'admin'
      AND customers.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can update company settings" ON company_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.role = 'admin'
      AND customers.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can insert company settings" ON company_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.role = 'admin'
      AND customers.auth_user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_settings_updated_at();

