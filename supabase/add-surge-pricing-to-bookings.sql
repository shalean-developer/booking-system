-- Add Surge Pricing Columns to Bookings Table
-- Purpose: Track surge pricing application on individual bookings
-- This allows us to see which bookings had surge pricing applied and how much

-- Add surge pricing columns to bookings table
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS surge_pricing_applied BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS surge_amount INTEGER DEFAULT 0; -- Amount in cents

-- Add comments for documentation
COMMENT ON COLUMN bookings.surge_pricing_applied IS 'Whether surge pricing was applied to this booking';
COMMENT ON COLUMN bookings.surge_amount IS 'Surge pricing amount in cents (e.g., 1000 = R10.00)';

-- Create index for surge pricing queries
CREATE INDEX IF NOT EXISTS idx_bookings_surge_pricing ON bookings(surge_pricing_applied) WHERE surge_pricing_applied = true;

