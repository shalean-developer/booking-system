-- Update bookings table to support dynamic pricing
-- Add columns for service fee, frequency, discounts, and price snapshot

-- Add new columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS frequency TEXT CHECK (
  frequency IS NULL OR frequency IN ('one-time', 'weekly', 'bi-weekly', 'monthly')
);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS frequency_discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_snapshot JSONB;

-- Add comments for documentation
COMMENT ON COLUMN bookings.service_fee IS 'Service fee charged for this booking';
COMMENT ON COLUMN bookings.frequency IS 'Booking frequency: one-time, weekly, bi-weekly, or monthly';
COMMENT ON COLUMN bookings.frequency_discount IS 'Discount amount applied based on frequency';
COMMENT ON COLUMN bookings.price_snapshot IS 'Complete pricing data at time of booking for audit trail';

-- Create index for frequency queries
CREATE INDEX IF NOT EXISTS idx_bookings_frequency ON bookings(frequency) WHERE frequency IS NOT NULL;

-- Update existing bookings to have default values
UPDATE bookings 
SET 
  frequency = 'one-time',
  service_fee = 0,
  frequency_discount = 0
WHERE frequency IS NULL;

-- Example of what price_snapshot should contain:
-- {
--   "service": {
--     "type": "Standard",
--     "base": 250,
--     "bedroom": 20,
--     "bathroom": 30
--   },
--   "extras": [
--     {"name": "Inside Fridge", "price": 30},
--     {"name": "Inside Oven", "price": 30}
--   ],
--   "service_fee": 50,
--   "frequency": "weekly",
--   "frequency_discount_percent": 15,
--   "frequency_discount_amount": 52.50,
--   "subtotal": 350,
--   "total": 347.50,
--   "snapshot_date": "2025-10-18T10:30:00Z"
-- }

