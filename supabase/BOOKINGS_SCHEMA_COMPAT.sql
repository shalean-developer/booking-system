-- Bookings Schema Compatibility Update
-- Purpose: Align the database schema with fields used by app/api/bookings/route.ts
-- Safe to run multiple times (uses IF NOT EXISTS)

-- Add columns used during booking insert, if missing
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cleaner_earnings numeric NULL,
  ADD COLUMN IF NOT EXISTS frequency text DEFAULT 'one-time',
  ADD COLUMN IF NOT EXISTS service_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequency_discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_snapshot jsonb;

-- Add index for status lookups (optional)
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Ensure cleaners table has hire_date used for earnings calculation
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS hire_date date;

-- Verification queries
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bookings' AND column_name IN ('cleaner_earnings','frequency','service_fee','frequency_discount','price_snapshot');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'cleaners' AND column_name = 'hire_date';

