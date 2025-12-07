-- Migration: Create Booking Templates System
-- Purpose: Allow customers to save booking configurations for quick reuse
-- Date: 2024

-- Create booking_templates table
CREATE TABLE IF NOT EXISTS booking_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Template name (e.g., "Weekly Home Cleaning")
  service_type TEXT NOT NULL CHECK (service_type IN ('Standard', 'Deep', 'Move In/Out', 'Airbnb')),
  bedrooms INTEGER NOT NULL DEFAULT 2,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  extras TEXT[] DEFAULT '{}', -- Array of extra service names
  extras_quantities JSONB DEFAULT '{}', -- JSON object mapping extra names to quantities
  notes TEXT DEFAULT '',
  frequency TEXT CHECK (frequency IN ('one-time', 'weekly', 'bi-weekly', 'monthly')) DEFAULT 'one-time',
  address_line1 TEXT,
  address_suburb TEXT,
  address_city TEXT,
  cleaner_id UUID REFERENCES cleaners(id) ON DELETE SET NULL, -- Preferred cleaner (optional)
  selected_team TEXT CHECK (selected_team IN ('Team A', 'Team B', 'Team C')), -- Preferred team (optional)
  requires_team BOOLEAN DEFAULT false,
  tip_amount INTEGER DEFAULT 0, -- Tip amount in cents
  is_default BOOLEAN DEFAULT false, -- Mark one template as default per customer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_templates_customer_id ON booking_templates(customer_id);
CREATE INDEX IF NOT EXISTS idx_booking_templates_created_at ON booking_templates(created_at DESC);

-- Create partial unique index to ensure only one default template per customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_templates_customer_default 
  ON booking_templates(customer_id) 
  WHERE is_default = true;

-- Enable Row Level Security
ALTER TABLE booking_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_templates
-- Customers can view their own templates
CREATE POLICY "Customers can view their own booking templates"
  ON booking_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = booking_templates.customer_id
      AND customers.auth_user_id = auth.uid()
    )
  );

-- Customers can insert their own templates
CREATE POLICY "Customers can insert their own booking templates"
  ON booking_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = booking_templates.customer_id
      AND customers.auth_user_id = auth.uid()
    )
  );

-- Customers can update their own templates
CREATE POLICY "Customers can update their own booking templates"
  ON booking_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = booking_templates.customer_id
      AND customers.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = booking_templates.customer_id
      AND customers.auth_user_id = auth.uid()
    )
  );

-- Customers can delete their own templates
CREATE POLICY "Customers can delete their own booking templates"
  ON booking_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = booking_templates.customer_id
      AND customers.auth_user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON booking_templates TO authenticated;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_booking_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_booking_templates_updated_at
  BEFORE UPDATE ON booking_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_templates_updated_at();

-- Function to ensure only one default template per customer
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this template as default, unset other defaults for this customer
  IF NEW.is_default = true THEN
    UPDATE booking_templates
    SET is_default = false
    WHERE customer_id = NEW.customer_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure single default template
CREATE TRIGGER ensure_single_default_template_trigger
  BEFORE INSERT OR UPDATE ON booking_templates
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_template();

-- Comments for documentation
COMMENT ON TABLE booking_templates IS 'Stores customer booking templates for quick booking';
COMMENT ON COLUMN booking_templates.name IS 'Template name for easy identification';
COMMENT ON COLUMN booking_templates.extras_quantities IS 'JSON object mapping extra service names to quantities';
COMMENT ON COLUMN booking_templates.is_default IS 'Mark one template as default per customer for quick access';
COMMENT ON COLUMN booking_templates.tip_amount IS 'Default tip amount in cents';
