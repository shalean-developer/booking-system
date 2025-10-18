-- Add total_amount column to bookings table
-- Purpose: Store booking price for dashboard display
-- Run this in Supabase SQL Editor

-- Add total_amount column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN bookings.total_amount IS 'Total booking price in cents/minor currency unit (e.g., 25000 = R250.00)';

-- Create index for price queries
CREATE INDEX IF NOT EXISTS idx_bookings_total_amount ON bookings(total_amount);

-- Note: Price is stored as INTEGER in cents (e.g., R250.00 = 25000) to avoid floating-point precision issues.
