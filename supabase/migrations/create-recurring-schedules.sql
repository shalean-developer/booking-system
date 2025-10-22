-- Migration: Create Recurring Schedules System
-- Purpose: Enable admin to create recurring bookings for customers
-- Date: 2024

-- Create recurring_schedules table
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly')),
  day_of_week INTEGER, -- 0=Sunday, 1=Monday, etc. (for weekly/bi-weekly)
  day_of_month INTEGER, -- 1-31 (for monthly)
  preferred_time TIME NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  extras TEXT[] DEFAULT '{}',
  notes TEXT,
  address_line1 TEXT NOT NULL,
  address_suburb TEXT NOT NULL,
  address_city TEXT NOT NULL,
  cleaner_id UUID REFERENCES cleaners(id),
  is_active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL,
  end_date DATE,
  last_generated_month TEXT, -- Format: 'YYYY-MM' to track last generation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_customer ON recurring_schedules(customer_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_active ON recurring_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_frequency ON recurring_schedules(frequency);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_cleaner ON recurring_schedules(cleaner_id) WHERE cleaner_id IS NOT NULL;

-- Add column to bookings table to link to recurring schedules
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS recurring_schedule_id UUID REFERENCES recurring_schedules(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_recurring_schedule ON bookings(recurring_schedule_id) WHERE recurring_schedule_id IS NOT NULL;

-- Add table comments
COMMENT ON TABLE recurring_schedules IS 'Stores recurring booking schedules for customers';
COMMENT ON COLUMN recurring_schedules.frequency IS 'How often bookings occur: weekly, bi-weekly, or monthly';
COMMENT ON COLUMN recurring_schedules.day_of_week IS 'Day of week (0=Sunday, 1=Monday, etc.) for weekly/bi-weekly schedules';
COMMENT ON COLUMN recurring_schedules.day_of_month IS 'Day of month (1-31) for monthly schedules';
COMMENT ON COLUMN recurring_schedules.last_generated_month IS 'Last month bookings were generated (YYYY-MM format)';

-- Enable Row Level Security
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_schedules
-- Policy: Admins can do everything
CREATE POLICY "Admins can manage recurring schedules" ON recurring_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = auth.uid()::uuid 
      AND customers.role = 'admin'
    )
  );

-- Policy: Customers can view their own schedules
CREATE POLICY "Customers can view their own schedules" ON recurring_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = auth.uid()::uuid 
      AND customers.id = recurring_schedules.customer_id
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recurring_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_recurring_schedules_updated_at
  BEFORE UPDATE ON recurring_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_schedules_updated_at();
