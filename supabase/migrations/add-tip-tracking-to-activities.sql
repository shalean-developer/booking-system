-- ============================================
-- ADD TIP TRACKING TO BOOKING ACTIVITIES
-- ============================================
-- This migration adds tip_amount and customer_name columns to booking_activities
-- to support displaying tip activities in the admin dashboard
-- ============================================

-- Add tip_amount column (in cents, nullable - only set for tip activities)
ALTER TABLE booking_activities 
ADD COLUMN IF NOT EXISTS tip_amount INTEGER;

-- Add customer_name column (for tip activities to show who gave the tip)
ALTER TABLE booking_activities 
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Update comments
COMMENT ON COLUMN booking_activities.tip_amount IS 'Tip amount in cents (only set for tip_received action_type)';
COMMENT ON COLUMN booking_activities.customer_name IS 'Customer name (for tip activities to show who gave the tip)';

-- Note: old_status and new_status can be NULL for tip activities
-- The action_type 'tip_received' will be used for tip activities

