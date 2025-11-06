-- Migration: Add location column to applications table
-- Run this in Supabase SQL Editor if the applications table already exists

-- Add location column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'location'
  ) THEN
    ALTER TABLE applications ADD COLUMN location TEXT;
    COMMENT ON COLUMN applications.location IS 'Cleaner location/city';
  END IF;
END $$;

-- Create index on location if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_applications_location ON applications(location);

