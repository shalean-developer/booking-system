-- ============================================
-- RECURRING BOOKINGS SYSTEM - DATABASE MIGRATION
-- ============================================
-- Run this script in your Supabase SQL Editor
-- This will create the necessary tables and indexes
-- for the recurring bookings system
-- ============================================

-- Step 1: Create the recurring_schedules table
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31), -- 1-31
  preferred_time TIME NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  extras TEXT[] DEFAULT '{}',
  notes TEXT,
  address_line1 TEXT NOT NULL,
  address_suburb TEXT NOT NULL,
  address_city TEXT NOT NULL,
  cleaner_id UUID REFERENCES cleaners(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL,
  end_date DATE,
  last_generated_month TEXT, -- Format: 'YYYY-MM' to track last generation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_customer 
  ON recurring_schedules(customer_id);

CREATE INDEX IF NOT EXISTS idx_recurring_schedules_active 
  ON recurring_schedules(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_recurring_schedules_frequency 
  ON recurring_schedules(frequency);

CREATE INDEX IF NOT EXISTS idx_recurring_schedules_last_generated 
  ON recurring_schedules(last_generated_month);

-- Step 3: Add foreign key column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS recurring_schedule_id UUID REFERENCES recurring_schedules(id) ON DELETE SET NULL;

-- Step 4: Create index on the new foreign key
CREATE INDEX IF NOT EXISTS idx_bookings_recurring_schedule 
  ON bookings(recurring_schedule_id) 
  WHERE recurring_schedule_id IS NOT NULL;

-- Step 5: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recurring_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_recurring_schedules_updated_at ON recurring_schedules;

CREATE TRIGGER trigger_update_recurring_schedules_updated_at
  BEFORE UPDATE ON recurring_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_schedules_updated_at();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration was successful:

-- Check if recurring_schedules table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'recurring_schedules'
) as table_exists;

-- Check if recurring_schedule_id column exists in bookings
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_name = 'bookings' 
  AND column_name = 'recurring_schedule_id'
) as column_exists;

-- View all indexes on recurring_schedules
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'recurring_schedules';

-- ============================================
-- SUCCESS!
-- ============================================
-- If all queries return true/show results,
-- the migration was successful and your
-- recurring bookings system is ready to use!
-- ============================================
