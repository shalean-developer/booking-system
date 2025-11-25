-- ============================================
-- ADD PRICING COLUMNS TO RECURRING SCHEDULES
-- ============================================
-- This migration adds total_amount and cleaner_earnings columns
-- to recurring_schedules table for manual pricing override
-- ============================================

-- Add total_amount column (in cents, like bookings table)
ALTER TABLE recurring_schedules 
ADD COLUMN IF NOT EXISTS total_amount INTEGER;

COMMENT ON COLUMN recurring_schedules.total_amount IS 'Default total amount per booking in cents (optional, for manual pricing override)';

-- Add cleaner_earnings column (in cents, like bookings table)
ALTER TABLE recurring_schedules 
ADD COLUMN IF NOT EXISTS cleaner_earnings INTEGER;

COMMENT ON COLUMN recurring_schedules.cleaner_earnings IS 'Default cleaner earnings per booking in cents (optional, for manual pricing override)';

-- Add helpful comment
COMMENT ON TABLE recurring_schedules IS 'Stores recurring booking schedules for customers. If total_amount and cleaner_earnings are set, they will be used when generating bookings. Otherwise, pricing is calculated automatically.';

