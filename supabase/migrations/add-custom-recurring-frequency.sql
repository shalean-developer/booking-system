-- Migration: Add Custom Recurring Frequency Support
-- Purpose: Allow multiple days per week for recurring bookings
-- Date: 2024

-- Add days_of_week array column for custom frequencies
ALTER TABLE recurring_schedules 
ADD COLUMN IF NOT EXISTS days_of_week INTEGER[];

-- Update frequency constraint on recurring_schedules to include custom options
ALTER TABLE recurring_schedules 
DROP CONSTRAINT IF EXISTS recurring_schedules_frequency_check;

ALTER TABLE recurring_schedules
ADD CONSTRAINT recurring_schedules_frequency_check 
CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly'));

-- Update frequency constraint on bookings table to include custom options
-- First, drop all frequency-related constraints (there might be multiple with different names)
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'bookings'::regclass 
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%frequency%'
    LOOP
        EXECUTE format('ALTER TABLE bookings DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;
END $$;

-- Add the new constraint with custom frequencies
ALTER TABLE bookings
ADD CONSTRAINT bookings_frequency_check 
CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly'));

-- Ensure days_of_week is used appropriately
ALTER TABLE recurring_schedules
ADD CONSTRAINT recurring_schedules_custom_days_check 
CHECK (
  (frequency IN ('custom-weekly', 'custom-bi-weekly') AND days_of_week IS NOT NULL AND array_length(days_of_week, 1) > 0)
  OR
  (frequency NOT IN ('custom-weekly', 'custom-bi-weekly') AND days_of_week IS NULL)
);

-- Add index for custom frequencies
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_custom_frequency 
ON recurring_schedules(frequency) 
WHERE frequency IN ('custom-weekly', 'custom-bi-weekly');

-- Add comment
COMMENT ON COLUMN recurring_schedules.days_of_week IS 'Array of day numbers (0=Sunday, 1=Monday, etc.) for custom frequencies';

