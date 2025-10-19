-- Migration: Add cleaner authentication and tracking features
-- Description: Adds auth fields, location tracking, and customer ratings

-- 1. Update cleaners table with authentication and tracking fields
ALTER TABLE cleaners 
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'both', -- 'password', 'otp', or 'both'
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_location_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS last_location_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS last_location_updated TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_code TEXT,
  ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otp_last_sent TIMESTAMPTZ;

-- Add unique constraint on phone for authentication (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cleaners_phone_unique'
  ) THEN
    ALTER TABLE cleaners ADD CONSTRAINT cleaners_phone_unique UNIQUE (phone);
  END IF;
END $$;

-- Create index for phone lookup (for authentication)
CREATE INDEX IF NOT EXISTS idx_cleaners_phone ON cleaners(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cleaners_available ON cleaners(is_available);
CREATE INDEX IF NOT EXISTS idx_cleaners_location ON cleaners(last_location_lat, last_location_lng);

-- 2. Create customer_ratings table
CREATE TABLE IF NOT EXISTS customer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_phone TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id) -- One rating per booking
);

-- Create indexes for customer_ratings
CREATE INDEX IF NOT EXISTS idx_customer_ratings_cleaner ON customer_ratings(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_customer_ratings_booking ON customer_ratings(booking_id);

-- 3. Update bookings table with cleaner tracking fields
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cleaner_claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cleaner_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cleaner_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_rating_id UUID REFERENCES customer_ratings(id),
  ADD COLUMN IF NOT EXISTS total_amount INTEGER; -- Amount in cents

-- Create index for booking status queries
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_cleaner_status ON bookings(cleaner_id, status);

-- 4. Enable RLS on customer_ratings
ALTER TABLE customer_ratings ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for cleaners

-- Cleaners can view their own profile
CREATE POLICY "Cleaners can view own profile" ON cleaners
  FOR SELECT USING (
    phone IS NOT NULL AND 
    phone = current_setting('app.current_cleaner_phone', true)
  );

-- Cleaners can update their own profile (availability, location, etc)
CREATE POLICY "Cleaners can update own profile" ON cleaners
  FOR UPDATE USING (
    phone IS NOT NULL AND 
    phone = current_setting('app.current_cleaner_phone', true)
  );

-- 6. Create RLS policies for bookings (cleaner access)

-- Cleaners can view their assigned bookings
CREATE POLICY "Cleaners can view assigned bookings" ON bookings
  FOR SELECT USING (
    cleaner_id = current_setting('app.current_cleaner_id', true)
  );

-- Cleaners can view available bookings in their areas
CREATE POLICY "Cleaners can view available bookings" ON bookings
  FOR SELECT USING (
    cleaner_id IS NULL AND 
    status = 'pending'
  );

-- Cleaners can update their assigned bookings (status, timestamps)
CREATE POLICY "Cleaners can update assigned bookings" ON bookings
  FOR UPDATE USING (
    cleaner_id = current_setting('app.current_cleaner_id', true)
  );

-- Cleaners can claim available bookings
CREATE POLICY "Cleaners can claim bookings" ON bookings
  FOR UPDATE USING (
    cleaner_id IS NULL AND 
    status = 'pending'
  );

-- 7. Create RLS policies for customer_ratings

-- Cleaners can create ratings for their completed bookings
CREATE POLICY "Cleaners can create customer ratings" ON customer_ratings
  FOR INSERT WITH CHECK (
    cleaner_id::text = current_setting('app.current_cleaner_id', true)
  );

-- Cleaners can view ratings they created
CREATE POLICY "Cleaners can view own ratings" ON customer_ratings
  FOR SELECT USING (
    cleaner_id::text = current_setting('app.current_cleaner_id', true)
  );

-- 8. Add comments for documentation
COMMENT ON COLUMN cleaners.password_hash IS 'Bcrypt hashed password for cleaner authentication';
COMMENT ON COLUMN cleaners.auth_provider IS 'Authentication method: password, otp, or both';
COMMENT ON COLUMN cleaners.is_available IS 'Whether cleaner is currently available for jobs';
COMMENT ON COLUMN cleaners.last_location_lat IS 'Last known latitude (for proximity matching)';
COMMENT ON COLUMN cleaners.last_location_lng IS 'Last known longitude (for proximity matching)';
COMMENT ON COLUMN cleaners.otp_code IS 'Temporary OTP code (cleared after use)';
COMMENT ON COLUMN cleaners.otp_expires_at IS 'OTP expiration timestamp (5 minutes)';
COMMENT ON TABLE customer_ratings IS 'Cleaner ratings of customers after job completion';

