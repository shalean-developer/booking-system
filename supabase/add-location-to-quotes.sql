-- Migration: Add location column to quotes table
-- Purpose: Store customer location for quote requests
-- Run this in Supabase SQL Editor to fix quote saving

-- Add location column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'location'
  ) THEN
    ALTER TABLE quotes ADD COLUMN location TEXT;
    COMMENT ON COLUMN quotes.location IS 'Customer location/city for the quote request';
    
    -- Create index on location for better query performance
    CREATE INDEX IF NOT EXISTS idx_quotes_location ON quotes(location);
    
    RAISE NOTICE 'Location column added to quotes table';
  ELSE
    RAISE NOTICE 'Location column already exists in quotes table';
  END IF;
END $$;

