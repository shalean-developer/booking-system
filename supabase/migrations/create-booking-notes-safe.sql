-- Create booking notes table for admin internal notes (SAFE VERSION)
-- This version won't fail if objects already exist
-- Run this in Supabase SQL Editor

-- Drop existing policy if it exists (to recreate it)
DROP POLICY IF EXISTS "Admins can manage booking notes" ON booking_notes;

-- Create booking_notes table (will skip if exists)
CREATE TABLE IF NOT EXISTS booking_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  admin_id TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes (will skip if exist)
CREATE INDEX IF NOT EXISTS idx_booking_notes_booking ON booking_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_cleaner_date_status 
  ON bookings(cleaner_id, booking_date, status);

-- Enable RLS (safe to run multiple times)
ALTER TABLE booking_notes ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admins can manage booking notes" ON booking_notes
  FOR ALL USING (true);

-- Add comment
COMMENT ON TABLE booking_notes IS 'Internal admin notes for bookings';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ booking_notes table is ready!';
  RAISE NOTICE '✅ Policies configured successfully!';
END $$;


