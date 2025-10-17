-- Cleaner Selection Booking System - Database Schema

-- Create cleaners table
CREATE TABLE IF NOT EXISTS cleaners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  rating DECIMAL(2,1) DEFAULT 5.0,
  areas TEXT[] NOT NULL,  -- Array of areas they serve
  bio TEXT,
  years_experience INTEGER,
  specialties TEXT[],
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,  -- Changed from UUID to TEXT to support "BK-..." format
  cleaner_id TEXT,      -- Changed from UUID to TEXT to support 'manual' and UUID strings
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  service_type TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  address_line1 TEXT,
  address_suburb TEXT,
  address_city TEXT,
  payment_reference TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_cleaner CHECK (
    cleaner_id IS NULL OR
    cleaner_id = 'manual' OR 
    cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_cleaner_date ON bookings(cleaner_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_cleaners_areas ON cleaners USING GIN(areas);
CREATE INDEX IF NOT EXISTS idx_cleaners_active ON cleaners(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);

-- Enable Row Level Security (RLS)
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to cleaners
CREATE POLICY "Public can view active cleaners" ON cleaners
  FOR SELECT USING (is_active = true);

-- Create policies for public insert access to bookings
CREATE POLICY "Public can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Create policies for public select access to bookings (for cleaner availability)
CREATE POLICY "Public can view bookings for availability" ON bookings
  FOR SELECT USING (true);
