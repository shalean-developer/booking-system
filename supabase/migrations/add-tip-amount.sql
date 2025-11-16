-- ============================================
-- ADD TIP AMOUNT COLUMN TO BOOKINGS
-- ============================================
-- This migration adds tip_amount column to bookings table
-- Tips go 100% to cleaner (separate from commission earnings)
-- ============================================

-- Add tip_amount column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS tip_amount INTEGER DEFAULT 0;

COMMENT ON COLUMN bookings.tip_amount IS 'Tip amount in cents (goes 100% to cleaner, separate from commission earnings)';

-- Create index for tip queries (optional)
CREATE INDEX IF NOT EXISTS idx_bookings_tip_amount ON bookings(tip_amount) WHERE tip_amount > 0;

-- Note: Existing bookings will have tip_amount = 0
-- Tips that were previously included in total_amount cannot be retroactively separated
-- New bookings will store tips separately

